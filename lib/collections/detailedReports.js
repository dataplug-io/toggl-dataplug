const moment = require('moment')
const logger = require('winston')
const { URL } = require('url')
const dataplug = require('@dataplug/dataplug')
const { PagedHttpGetReader } = require('@dataplug/dataplug-http')
const { JsonStreamReader } = require('@dataplug/dataplug-json')
const config = require('../config')

// https://github.com/toggl/toggl_api_docs/blob/master/reports/detailed.md
const schema = {
  type: 'object',
  definitions: {},
  properties: {
    id: {
      description: 'Time entry ID',
      type: 'integer'
    },
    pid: {
      description: 'Project ID',
      type: ['integer', 'null']
    },
    project: {
      description: 'Project name for which the time entry was recorded',
      type: ['string', 'null']
    },
    project_color: {
      description: '(Probably) Project color ID',
      type: ['string', 'null']
    },
    project_hex_color: {
      description: '(Probably) Project color (hex)',
      type: ['string', 'null']
    },
    client: {
      description: 'Client name for which the time entry was recorded',
      type: ['string', 'null']
    },
    tid: {
      description: 'Task ID',
      type: ['integer', 'null']
    },
    task: {
      description: 'Task name for which the time entry was recorded',
      type: ['string', 'null']
    },
    uid: {
      description: 'User ID whose time entry it is',
      type: 'integer'
    },
    user: {
      description: 'Full name of the user whose time entry it is',
      type: 'string'
    },
    description: {
      description: 'Time entry description',
      type: 'string'
    },
    start: {
      description: 'Start time of the time entry in ISO 8601 date and time format (YYYY-MM-DDTHH:MM:SS)',
      type: 'string',
      format: 'date-time'
    },
    end: {
      description: 'End time of the time entry in ISO 8601 date and time format (YYYY-MM-DDTHH:MM:SS)',
      type: 'string',
      format: 'date-time'
    },
    dur: {
      description: 'Time entry duration in milliseconds',
      type: 'integer'
    },
    updated: {
      description: 'Last time the time entry was updated in ISO 8601 date and time format (YYYY-MM-DDTHH:MM:SS)',
      type: 'string',
      format: 'date-time'
    },
    use_stop: {
      description: 'If the stop time is saved on the time entry, depends on user\'s personal settings.',
      type: 'boolean'
    },
    is_billable: {
      description: 'If the time entry was billable or not',
      type: 'boolean'
    },
    billable: {
      description: 'Billed amount',
      type: 'number'
    },
    cur: {
      description: 'Billable amount currency',
      type: 'string'
    },
    tags: {
      description: 'Array of tag names, which assigned for the time entry',
      type: 'array',
      items: {
        type: 'string'
      }
    }
  },
  additionalProperties: false,
  required: ['id']
}

const configDeclaration = config.declaration.extended((declaration) => declaration
  .parameters({
    workspace: {
      description: 'The workspace ID to query data from',
      type: 'integer',
      required: true
    },
    since: {
      description: 'Date to query data since',
      type: 'string',
      format: 'date',
      default: moment().subtract(6, 'days').format('YYYY-MM-DD')
    },
    until: {
      description: 'Date to query data until',
      type: 'string',
      format: 'date',
      default: moment().format('YYYY-MM-DD')
    },
    billable: {
      description: 'Filter by billable option',
      enum: ['yes', 'no', 'both'],
      default: 'both'
    },
    clientIds: {
      description: 'Filter by set of client IDs, "0" means "w/o client"',
      type: 'array',
      item: 'integer'
    },
    projectIds: {
      description: 'Filter by set of project IDs, "0" means "w/o project"',
      type: 'array',
      item: 'integer'
    },
    userIds: {
      description: 'Filter by set of user IDs',
      type: 'array',
      item: 'integer'
    },
    membersOfGroupIds: {
      description: 'Filter by set users, members of specified group IDs',
      type: 'array',
      item: 'integer'
    },
    // TODO: or_members_of_group_ids: A list of group IDs separated by a comma. This extends provided user_ids with the members of the given groups.
    // TODO: tag_ids: A list of tag IDs separated by a comma. Use "0" if you want to filter out time entries without a tag.
    // TODO: task_ids: A list of task IDs separated by a comma. Use "0" if you want to filter out time entries without a task.
    // TODO: time_entry_ids: A list of time entry IDs separated by a comma.
    matchDescription: {
      description: 'Matches against time entry descriptions',
      type: 'string'
    },
    filterNoDescriptionEntries: {
      description: 'Filters out the time entries which do not have a description',
      type: 'boolean',
      default: false
    },
    orderField: {
      description: 'Field to sort by',
      enum: ['date', 'description', 'duration', 'user']
    },
    orderDescending: {
      description: 'Sort by descending or ascending order',
      enum: ['on', 'off']
    },
    distinctRates: {
      description: 'Show distinct rates for entries',
      enum: ['on', 'off'],
      default: 'off'
    },
    rounding: {
      description: 'Rounds time according to workspace settings',
      enum: ['on', 'off'],
      default: 'off'
    },
    displayHours: {
      description: 'Determines whether to display hours as a decimal number or with minutes',
      enum: ['decimal', 'minutes'],
      default: 'minutes'
    }
  }))

const queryMapping = config.mapping.query.extended((mapping) => mapping
  .rename('workspace', 'workspace_id')
  .asIs('since')
  .asIs('until')
  .asIs('billable')
  .rename('clientIds', 'client_ids')
  .rename('projectIds', 'project_ids')
  .rename('userIds', 'user_ids')
  .rename('membersOfGroupIds', 'members_of_group_ids')
  .rename('matchDescription', 'description')
  .rename('filterNoDescriptionEntries', 'without_description')
  .rename('orderField', 'order_field')
  .rename('orderDescending', 'order_desc')
  .rename('distinctRates', 'distinct_rates')
  .asIs('rounding')
  .rename('displayHours', 'display_hours'))

const factory = (params) => {
  const url = new URL('/reports/api/v2/details', params.endpoint)
  const nextPage = (page, data) => {
    if (data) {
      const pageIndex = page.query.page || 0
      if (pageIndex * data.per_page < data.total_count) {
        page.query.page = pageIndex + 1

        logger.info('Source output for toggl:detailed-reports from %s page %d', url, page.query.page)

        return true
      }
    }

    return false
  }
  const transformFactory = () => new JsonStreamReader('!.data.*')
  const query = queryMapping.apply(params)
  const headers = config.mapping.headers.apply(params)

  logger.info('Source output for toggl:detailed-reports from %s', url)

  return new PagedHttpGetReader(url, nextPage, transformFactory, query, headers)
}

const source = dataplug.source(configDeclaration, factory)

module.exports = {
  origin: 'toggl',
  name: 'detailed-reports',
  schema,
  source
}

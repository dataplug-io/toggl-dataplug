const moment = require('moment')
const dataplug = require('@dataplug/dataplug')
const config = require('../config')
const factory = require('../factory')

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

const source = dataplug.source(
  config.declaration.extended((declaration) => declaration
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
      }
      // TODO: or_members_of_group_ids: A list of group IDs separated by a comma. This extends provided user_ids with the members of the given groups.
      // TODO: tag_ids: A list of tag IDs separated by a comma. Use "0" if you want to filter out time entries without a tag.
      // TODO: task_ids: A list of task IDs separated by a comma. Use "0" if you want to filter out time entries without a task.
      // TODO: time_entry_ids: A list of time entry IDs separated by a comma.
      // TODO: description: Matches against time entry descriptions.
      // TODO: without_description: "true" or "false". Filters out the time entries which do not have a description (literally "(no description)").
      // TODO: order_field: "date", "description", "duration", or "user"
      // TODO: order_desc: "on" for descending, or "off" for ascending order.
      // TODO: distinct_rates: "on" or "off". Defaults to "off".
      // TODO: rounding: "on" or "off". Defaults to "off". Rounds time according to workspace settings.
      // TODO: display_hours: "decimal" or "minutes". Defaults to "minutes". Determines whether to display hours as a decimal number or with minutes.
    })),
  factory.output('/reports/api/v2/details', '!.data.*', {
    headers: config.mapping.headers,
    query: config.mapping.query.extended((mapping) => mapping
      .rename('workspace', 'workspace_id')
      .asIs('since')
      .asIs('until')
      .asIs('billable')
      .rename('clientIds', 'client_ids')
      .rename('projectIds', 'project_ids')
      .rename('userIds', 'user_ids')
      .rename('membersOfGroupIds', 'members_of_group_ids'))
  }))

module.exports = {
  origin: 'toggl',
  name: 'detailed-reports',
  schema,
  source
}

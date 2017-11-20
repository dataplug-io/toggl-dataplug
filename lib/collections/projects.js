const { URL } = require('url')
const dataplug = require('@dataplug/dataplug')
const { PagedHttpGetReader } = require('@dataplug/dataplug-http')
const { JsonStreamReader } = require('@dataplug/dataplug-json')
const config = require('../config')

const schema = {
  type: 'object',
  definitions: {},
  properties: {
    id: {
      description: 'Project ID',
      type: 'integer'
    },
    name: {
      description: 'The name of the project',
      type: 'string'
    },
    workspace_id: {
      description: 'Workspace ID, where the project will be saved',
      type: 'integer'
    },
    wid: {
      description: 'Workspace ID, where the project will be saved',
      type: 'integer'
    },
    client_id: {
      description: 'Client ID',
      type: ['integer', 'null']
    },
    cid: {
      description: 'Client ID',
      type: ['integer', 'null']
    },
    active: {
      description: 'Whether the project is archived or not',
      type: 'boolean'
    },
    is_private: {
      description: 'Whether project is accessible for only project users or for all workspace users',
      type: 'boolean'
    },
    template: {
      description: 'Whether the project can be used as a template',
      type: 'boolean'
    },
    template_id: {
      description: 'ID of the template project used on current project\'s creation',
      type: ['integer', 'null']
    },
    billable: {
      description: 'Whether the project is billable or not',
      type: 'boolean'
    },
    auto_estimates: {
      description: 'Whether the estimated hours are automatically calculated based on task estimations or manually fixed based on the value of \'estimated_hours\'',
      type: 'boolean'
    },
    estimated_hours: {
      description: 'If auto_estimates is true then the sum of task estimations is returned, otherwise user inserted hours',
      type: ['integer', 'null']
    },
    at: {
      description: 'Timestamp indicating when the time task was last updated',
      type: 'string',
      format: 'date-time'
    },
    created_at: {
      description: 'Timestamp indicating when the project was created',
      type: 'string',
      format: 'date-time'
    },
    server_deleted_at: {
      description: 'Timestamp indicating when the project was deleted',
      type: ['string', 'null'],
      format: 'date-time'
    },
    color: {
      description: 'ID of the color selected for the project',
      type: 'string'
    },
    rate: {
      description: 'Hourly rate of the project',
      type: ['integer', 'null']
    },
    currency: {
      description: 'Billable amount currency',
      type: ['string', 'null']
    },
    actual_hours: {
      description: 'Completed hours of the project',
      type: ['integer', 'null']
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
    active: {
      description: 'To filter projects by their state',
      enum: ['true', 'false', 'both'],
      default: 'both'
    },
    actualHours: {
      description: 'Get the completed hours per project',
      type: 'boolean',
      default: false
    },
    onlyTemplates: {
      description: 'Get only project templates',
      enum: ['true', 'false'],
      default: 'false'
    }
  })
)

const queryMapping = config.mapping.query.extended((mapping) => mapping
  .asIs('active')
  .rename('actualHours', 'actual_hours')
  .rename('onlyTemplates', 'only_templates')
)

const factory = (params) => {
  const url = new URL(`api/v9/workspaces/${params.workspace}/projects`, params.endpoint)
  const nextPage = (page, data) => {
    if (data) {
      const pageIndex = page.query.page || 0
      if (pageIndex * data.per_page < data.total_count) {
        page.query.page = pageIndex + 1

        return true
      }
    }

    return false
  }
  const transformFactory = () => new JsonStreamReader('!.data.*')
  const query = queryMapping.apply(params)
  const headers = config.mapping.headers.apply(params)

  return new PagedHttpGetReader(url, nextPage, {
    transformFactory,
    query,
    headers
  })
}

const source = dataplug.source(configDeclaration, factory)

module.exports = {
  origin: 'toggl',
  name: 'projects',
  schema,
  source
}

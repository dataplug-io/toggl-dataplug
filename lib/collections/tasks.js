const { URL } = require('url')
const dataplug = require('@dataplug/dataplug')
const { HttpGetReader } = require('@dataplug/dataplug-http')
const { JsonStreamReader } = require('@dataplug/dataplug-json')
const config = require('../config')

const schema = {
  type: 'object',
  definitions: {},
  properties: {
    id: {
      description: 'Task ID',
      type: 'integer'
    },
    pid: {
      description: 'Project ID',
      type: 'integer'
    },
    uid: {
      description: 'User ID',
      type: ['integer', 'null']
    },
    wid: {
      description: 'Workspace ID',
      type: 'integer'
    },
    active: {
      description: 'Task state',
      type: 'boolean'
    },
    at: {
      description: 'Timestamp indicates the time task was last updated',
      type: 'string',
      format: 'date-time'
    },
    estimated_seconds: {
      description: 'Estimated time (seconds)',
      type: 'integer'
    },
    tracked_seconds: {
      description: 'Total time tracked (seconds)',
      type: 'integer'
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
      description: 'Filters by active state',
      enum: ['true', 'false', 'both'],
      default: 'both'
    }
  })
)

const queryMapping = config.mapping.query.extended((mapping) => mapping
)

const factory = (params) => {
  const url = new URL(`api/v8/workspaces/${params.workspace}/tasks`, params.endpoint)
  const transform = new JsonStreamReader('!.*')
  const query = queryMapping.apply(params)
  const headers = config.mapping.headers.apply(params)

  return new HttpGetReader(url, {
    transform,
    query,
    headers
  })
}

const source = dataplug.source(configDeclaration, factory)

module.exports = {
  origin: 'toggl',
  name: 'tasks',
  schema,
  source
}

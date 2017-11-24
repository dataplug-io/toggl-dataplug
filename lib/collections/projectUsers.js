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
      description: 'Project user ID',
      type: 'integer'
    },
    pid: {
      description: 'Project ID',
      type: 'integer'
    },
    uid: {
      description: 'User ID',
      type: 'integer'
    },
    wid: {
      description: 'Workspace ID',
      type: 'integer'
    },
    manager: {
      description: 'User has manager permissions on project',
      type: 'boolean'
    },
    rate: {
      description: 'Hourly rate',
      type: ['number', 'null']
    },
    at: {
      description: 'Timestamp indicates the time project user was last updated',
      type: 'string',
      format: 'date-time'
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
    }
  })
)

const queryMapping = config.mapping.query.extended((mapping) => mapping
)

const factory = (params) => {
  const url = new URL(`api/v8/workspaces/${params.workspace}/project_users`, params.endpoint)
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
  name: 'project-users',
  schema,
  source
}

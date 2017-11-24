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
      description: 'Group ID',
      type: 'integer'
    },
    wid: {
      description: 'Workspace ID',
      type: 'integer'
    },
    name: {
      description: 'Group name',
      type: 'string'
    },
    at: {
      description: 'Timestamp indicates the time group was last updated',
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
  const url = new URL(`api/v8/workspaces/${params.workspace}/groups`, params.endpoint)
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
  name: 'groups',
  schema,
  source
}

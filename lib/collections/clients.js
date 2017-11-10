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
      description: 'Project ID',
      type: 'integer'
    },
    name: {
      description: 'The name of the project',
      type: 'string'
    },
    wid: {
      description: 'Workspace ID, where the project will be saved',
      type: 'integer'
    },
    guid: {
      description: 'Client GUID',
      type: ['string', 'null']
    },
    notes: {
      description: 'Notes for the client',
      type: ['string', 'null']
    },
    at: {
      description: 'Timestamp indicates the time client was last updated',
      type: 'string'
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
  }))

const queryMapping = config.mapping.query.extended((mapping) => mapping.asIs('active'))

const factory = (params) => {
  const url = new URL(`api/v8/workspaces/${params.workspace}/clients`, params.endpoint)
  const transform = new JsonStreamReader('!.*')
  const query = queryMapping.apply(params)
  const headers = config.mapping.headers.apply(params)

  return new HttpGetReader(url, transform, query, headers)
}

const source = dataplug.source(configDeclaration, factory)

module.exports = {
  origin: 'toggl',
  name: 'clients',
  schema,
  source
}

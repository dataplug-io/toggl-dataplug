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
      description: 'Workspace ID',
      type: 'integer'
    },
    name: {
      description: 'The name of the workspace',
      type: 'string'
    },
    profile: {
      description: 'Profile (?)',
      type: 'integer'
    },
    premium: {
      description: 'If it\'s a pro workspace or not. Shows if someone is paying for the workspace or not',
      type: 'boolean'
    },
    admin: {
      description: 'Shows whether currently requesting user has admin access to the workspace',
      type: 'boolean'
    },
    default_hourly_rate: {
      description: 'Default hourly rate for workspace, won\'t be shown to non-admins if the only_admins_see_billable_rates flag is set to true',
      type: 'number'
    },
    default_currency: {
      description: 'Default currency for workspace',
      type: 'string'
    },
    projects_billable_by_default: {
      description: 'Whether projects in workspace are billable by default',
      type: 'boolean'
    },
    only_admins_may_create_projects: {
      description: 'Whether only the admins can create projects or everybody',
      type: 'boolean'
    },
    only_admins_see_billable_rates: {
      description: 'Whether only the admins can see billable rates or everybody',
      type: 'boolean'
    },
    only_admins_see_team_dashboard: {
      description: 'Whether only the admins can see team dashboard or everybody',
      type: 'boolean'
    },
    rounding: {
      description: 'Type of rounding: round down (-1), nearest (0), round up (1)',
      type: 'integer'
      // enum: [-1, 0, 1]
    },
    rounding_minutes: {
      description: 'Round up to nearest minute',
      type: 'integer'
    },
    at: {
      description: 'Timestamp indicates the time client was last updated',
      type: 'string'
    },
    logo_url: {
      description: 'URL pointing to the logo',
      type: 'string'
    },
    ical_enabled: {
      description: 'Whether iCal is enabled or no',
      type: 'boolean'
    },
    ical_url: {
      description: 'URL pointing to iCal',
      type: 'string'
    },
    api_token: {
      description: 'API token (?)',
      type: 'string'
    }
  },
  additionalProperties: false,
  required: ['id']
}

const configDeclaration = config.declaration.extended((declaration) => declaration
)

const queryMapping = config.mapping.query.extended((mapping) => mapping
)

const factory = (params) => {
  const url = new URL(`api/v8/workspaces`, params.endpoint)
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
  name: 'workspaces',
  schema,
  source
}

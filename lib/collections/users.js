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
      description: 'User ID',
      type: 'integer'
    },
    default_wid: {
      description: 'Default workspace ID',
      type: 'integer'
    },
    email: {
      description: 'User email',
      type: 'string'
    },
    fullname: {
      description: 'User full name',
      type: 'string'
    },
    jquery_timeofday_format: {
      type: 'string'
    },
    jquery_date_format: {
      type: 'string'
    },
    timeofday_format: {
      type: 'string'
    },
    date_format: {
      type: 'string'
    },
    store_start_and_stop_time: {
      description: 'Whether start and stop time are saved on time entry',
      type: 'boolean'
    },
    beginning_of_week: {
      description: 'Beginning of the week, Sunday = 0',
      type: 'integer'
    },
    language: {
      description: 'User language',
      type: 'string'
    },
    image_url: {
      description: 'User profile picture URL',
      type: 'string'
    },
    sidebar_piechart: {
      description: 'Should a piechart be shown on the sidebar',
      type: 'boolean'
    },
    at: {
      description: 'Timestamp indicates the time user was last updated',
      type: 'string',
      format: 'date-time'
    },
    created_at: {
      description: 'Timestamp indicates the time user was created',
      type: 'string',
      format: 'date-time'
    },
    new_blog_post: {
      description: 'Object with toggl blog post title and link',
      type: 'object'
    },
    send_product_emails: {
      description: 'Toggl can send newsletters over e-mail to the user',
      type: 'boolean'
    },
    send_weekly_report: {
      description: 'Toogl should send weekly reports',
      type: 'boolean'
    },
    send_timer_notifications: {
      description: 'Toogl should warn user about long-running tasks (more than 8 hours)',
      type: 'boolean'
    },
    openid_enabled: {
      description: 'Google sign-in enabled',
      type: 'boolean'
    },
    openid_email: {
      description: 'Google sign-in email',
      type: 'string'
    },
    timezone: {
      description: 'User time zone',
      type: 'string'
    },
    retention: {
      description: 'Retention (?)',
      type: 'integer'
    },
    record_timeline: {
      description: 'Record timeline (?)',
      type: 'boolean'
    },
    render_timeline: {
      description: 'Render timeline (?)',
      type: 'boolean'
    },
    timeline_enabled: {
      description: 'Timeline enabled (?)',
      type: 'boolean'
    },
    timeline_experiment: {
      description: 'Timeline experiment (?)',
      type: 'boolean'
    },
    should_upgrade: {
      description: 'Should upgrade (?)',
      type: 'boolean'
    },
    achievements_enabled: {
      description: 'Achievements enabled (?)',
      type: 'boolean'
    },
    last_blog_entry: {
      description: 'Last blog entry (?)',
      type: 'string'
    },
    invitation: {
      description: 'Invitation (?)',
      type: 'object'
    },
    duration_format: {
      description: 'Duration format (?)',
      type: 'string'
    },
    obm: {
      description: 'OBM (?)',
      type: 'object'
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
  const url = new URL(`api/v8/workspaces/${params.workspace}/users`, params.endpoint)
  const transform = new JsonStreamReader('!.*')
  const query = queryMapping.apply(params)
  const headers = config.mapping.headers.apply(params)

  return new HttpGetReader(url, transform, query, headers)
}

const source = dataplug.source(configDeclaration, factory)

module.exports = {
  origin: 'toggl',
  name: 'users',
  schema,
  source
}

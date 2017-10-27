const dataplug = require('@dataplug/dataplug')

const declaration = dataplug.config.declare()
  .parameters({
    endpoint: {
      description: 'API endpoint',
      type: 'string',
      default: 'https://toggl.com'
    },
    token: {
      description: 'API token',
      type: 'string',
      required: true
    }
  })
const headersMapping = dataplug.config.map()
  .remap('token', (value) => ({
    Authorization: 'Basic ' + Buffer.from(`${value}:api_token`).toString('base64')
  }))
  .default('Content-Type', () => 'application/json')
const queryMapping = dataplug.config.map()
  .default('user_agent', () => 'dataplug.io')

module.exports = {
  declaration,
  mapping: {
    headers: headersMapping,
    query: queryMapping
  }
}

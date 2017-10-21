const dataplug = require('@dataplug/dataplug');

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
  });
const headersMapping = dataplug.config.map()
  .remap('token', (value) => ({
    Authorization: 'Basic ' + new Buffer(`${value}:api_token`).toString('base64')
  }));
const queryMapping = dataplug.config.map()
  .asIs('page');

module.exports = {
  declaration,
  mapping: {
    headers: headersMapping,
    query: queryMapping
  }
};

const dataplug = require('@dataplug/dataplug');

const declaration = dataplug.config.declare;
const headersMapping = dataplug.config.mapping;
const queryMapping = dataplug.config.mapping;

module.exports = {
  declaration,
  mapping: {
    headers: headersMapping,
    query: queryMapping
  }
}

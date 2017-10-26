const _ = require('lodash')
const { URL } = require('url')
const { PagedHttpGetReader } = require('@dataplug/dataplug-http')
const { JsonStreamReader } = require('@dataplug/dataplug-json')
const config = require('./config')

/**
 * Creates output factory
 *
 * @param {string|Function} uri Collection URI or function returning it
 * @param {selector|Function} selector Collection entry selector or function returning it
 * @param {Object|Function} mapping
 * @return {Source~OutputFactory} Output factory functor
 */
function createOutputFactory (uri, selector = '!.*', mapping = config.mapping) {
  return (params) => {
    if (_.isFunction(uri)) {
      uri = uri(params)
    }
    if (_.isFunction(selector)) {
      selector = selector(params)
    }
    if (_.isFunction(mapping)) {
      mapping = mapping(params)
    }

    const url = new URL(uri, params.endpoint)
    const query = Object.assign({},
      mapping.query.apply(params), {
        'user_agent': 'dataplug.io'
      })
    const headers = Object.assign({},
      mapping.headers.apply(params), {
        'Content-Type': 'application/json'
      })
    const nextPage = (page, data) => {
      if (!data) {
        return false
      }

      const pageIndex = page.query.page || 0
      if (pageIndex * data.per_page < data.total_count) {
        page.query.page = pageIndex + 1
        return true
      }

      return false
    }
    const transformFactory = () => new JsonStreamReader(selector)

    return new PagedHttpGetReader(url, nextPage, transformFactory, query, headers)
  }
}

module.exports = {
  output: createOutputFactory
}

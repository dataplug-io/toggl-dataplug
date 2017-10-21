const _ = require('lodash');
const Promise = require('bluebird');
const https = require('https');
const querystring = require('querystring');
const {
  URL,
  URLSearchParams
} = require('url');
const {
  JsonSequentialStreamsReader
} = require('@dataplug/dataplug');
const config = require('./config');

/**
 * Creates output factory
 *
 * @param {string|Function} uri Collection URI or function returning it
 * @param {selector|Function} selector Collection entry selector or function returning it
 * @param {Object} mapping
 */
function declareOutputFactory(uri, selector = '!.*', mapping = config.mapping) {
  return (params) => {
    if (_.isFunction(uri)) {
      uri = uri(params);
    }
    if (_.isFunction(selector)) {
      selector = selector(params);
    }
    if (_.isFunction(mapping)) {
      mapping = mapping(params);
    }

    return new JsonSequentialStreamsReader(
      async(factoryParams, previousData, previousParams) => new Promise((resolve, reject) => {
        let currentParams = Object.assign({}, factoryParams);
        if (!currentParams.page) {
          currentParams.page = 1;
        }

        if (previousData && previousParams) {
          if (previousParams.page * previousData.per_page < previousData.total_count) {
            currentParams.page = previousParams.page + 1;
          } else {
            reject(null);
            return;
          }
        }

        const currentHeaders = mapping.headers.apply(currentParams);
        const currentQuery = mapping.query.apply(currentParams);

        const previousDataHeaders = mapping.headers.apply(previousData || {});
        const previousDataQuery = mapping.query.apply(previousData || {});

        const headers = Object.assign({},
          currentHeaders,
          previousDataHeaders, {
            'Content-Type': 'application/json'
          });
        const query = Object.assign({},
          currentQuery,
          previousDataQuery, {
            'user_agent': 'dataplug.io'
          });

        const url = new URL(uri, params.endpoint);
        url.search = querystring.stringify(query);
        const requestOptions = {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port ? parseInt(url.port) : undefined,
          path: url.pathname + url.search,
          headers: headers
        };

        https
          .request(requestOptions, (response) => {
            resolve({
              stream: response,
              params: currentParams
            });
          })
          .on('error', (reason) => {
            reject(reason);
          })
          .end();
      }),
      params,
      selector);
  };
}

module.exports = {
  output: declareOutputFactory,
}

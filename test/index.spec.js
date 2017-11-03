/* eslint-env node, mocha */
require('chai')
  .should()
const dataplugTestsuite = require('@dataplug/dataplug-testsuite')
const togglDataplug = require('../lib')

describe('toggl-dataplug', () => {
  dataplugTestsuite
    .forCollection('clients', togglDataplug.clients)
    .use()

  dataplugTestsuite
    .forCollection('detailed-reports', togglDataplug.detailedReports)
    .use()

  dataplugTestsuite
    .forCollection('projects', togglDataplug.projects)
    .use()
})

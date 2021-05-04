'use strict';
const run = require('./lib/cli');
const setupProject = require('./lib/project/setup-project');
const { processPolicies } = require('./lib/project/multiple-projects');

module.exports = { run, setupProject, processPolicies };

'use strict';
const run = require('./lib/cli');
const setupProject = require('./lib/project/setup-project');
const { isAllInSupportWindow } = require('./lib/project/mulitple-projects');

module.exports = {
  run,
  setupProject,
  isAllInSupportWindow,
};

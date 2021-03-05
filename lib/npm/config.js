'use strict';

const execa = require('execa');
const camelcaseKeys = require('camelcase-keys');

module.exports = async function (cwd) {
  const child = execa.sync('npm', ['config', 'list', '--json'], {
    cwd,
    // shell: true,
  });

  return camelcaseKeys(JSON.parse(child.stdout));
};

'use strict';

const execa = require('execa');
const camelcaseKeys = require('camelcase-keys');

module.exports = async function (cwd) {
  const child = execa.sync('npm', ['config', 'list', '--json'], {
    cwd,
    // shell: true,
  });
  let jsonConfigOutput = '';

  try {
    jsonConfigOutput = JSON.parse(child.stdout);
  } catch (e) {
    throw new Error(
      `'npm config list --json' did not return a valid JSON result. Please make sure you are on npm v7 or greater.`,
    );
  }

  return camelcaseKeys(jsonConfigOutput);
};

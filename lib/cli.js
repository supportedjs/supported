'use strict';
const ora = require('ora');
const { displayResults } = require('../lib/output/cli-output');
const { isAllInSupportWindow } = require('../lib/project/mulitple-projects');
const { DEFAULT_SUPPORT_MESSAGE, LOG_LAST_STEP_PROGRESS } = require('./output/messages');
const { generateCsv } = require('../lib/output/csv-output');
const chalk = require('chalk');

const DEFAULT_SETUP_FILE = './project/setup-project';

async function main(cli, { policyDetails, setupProject }) {
  if (cli.input.length === 0) {
    cli.showHelp(1);
  } else {
    const projectPaths = cli.input;

    const spinner = ora(chalk`{dim [1/4]} 🔍 Gathering dependencies`).start();
    let result;
    try {
      result = await isAllInSupportWindow(projectPaths, setupProject, spinner);
      if (result.isInSupportWindow === false) {
        process.exitCode = 1;
      }
    } finally {
      if (result) {
        spinner.prefixText += LOG_LAST_STEP_PROGRESS(
          result.isInSupportWindow,
          result.expiringSoonCount,
        );
        // reset this to empty to avoid last step message is duplicated
        spinner.text = '';
      }
      spinner.stopAndPersist();
    }

    if (cli.flags.json && result) {
      console.log(JSON.stringify(projectPaths.length > 1 ? result : result.projects[0], null, 2));
    } else if (cli.flags.csv && result) {
      generateCsv(projectPaths, result, policyDetails);
    } else {
      displayResults(result, cli.flags, policyDetails);
    }
  }
}

/**
 *
 * @param {string} policyDetails Custom message that needs to be passed regarding the support audit run
 * @param {*} setupProjectFn if the way project is setup is different then use this method to override.
 */
async function run(policyDetails, setupProjectFn, help) {
  const setupProject = setupProjectFn ? setupProjectFn : require(DEFAULT_SETUP_FILE);
  help = help ? help : require('../lib/help')();
  policyDetails = policyDetails ? policyDetails : DEFAULT_SUPPORT_MESSAGE();
  await main(
    require('meow')(help, {
      flags: {
        verbose: {
          type: 'boolean',
          alias: 'd',
        },
        json: {
          type: 'boolean',
          alias: 'j',
        },
        unsupported: {
          type: 'boolean',
          alias: 'u',
        },
        supported: {
          type: 'boolean',
          alias: 's',
        },
        expiring: {
          type: 'boolean',
          alias: 'e',
        },
      },
    }),
    { policyDetails, setupProject },
  );
}
module.exports = run;

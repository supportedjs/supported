'use strict';
//check for node version as first thing
const { checkNodeCompatibility } = require('../lib/util');
checkNodeCompatibility();

// proceed only if node version is good.
const ora = require('ora');
const { displayResults } = require('../lib/output/cli-output');
const { processPolicies } = require('../lib/project/mulitple-projects');
const { DEFAULT_SUPPORT_MESSAGE } = require('./output/messages');
const { generateCsv } = require('../lib/output/csv-output');

async function main(cli, { policyDetails, setupProjectFn }) {
  if (cli.input.length === 0) {
    cli.showHelp(1);
  } else {
    const projectPaths = cli.input;

    const spinner = ora('working').start();
    let result;
    try {
      result = await processPolicies(projectPaths, setupProjectFn, spinner);
      if (result.isInSupportWindow === false) {
        process.exitCode = 1;
      }
    } finally {
      spinner.stopAndPersist({
        symbol: '✨',
      });
    }

    if (cli.flags.json && result) {
      console.log(JSON.stringify(result, null, 2));
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
  help = help ? help : require('./help')();
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
    { policyDetails, setupProjectFn },
  );
}
module.exports = run;

'use strict';
//check for node version as first thing
const { checkNodeCompatibility } = require('../lib/util');
checkNodeCompatibility();

// proceed iff the node version is good.
const ora = require('ora');
const { displayResults } = require('../lib/output/cli-output');
const { processPolicies } = require('../lib/project/multiple-projects');
const { DEFAULT_SUPPORT_MESSAGE } = require('./output/messages');
const { generateCsv } = require('../lib/output/csv-output');
const parseDuration = require('parse-duration');
/*
 *
 * convert a string representing a date into an actual date
 * supports anything new Date(maybeDate) supports
 *
 * supports anything `parse-duration` supports:
 *   -30 days === the date 30 days ago
 */
function processDate(inputDate) {
  if (typeof inputDate !== 'string') {
    return;
  }
  if (inputDate === '') {
    return;
  }
  const date = new Date(inputDate);
  if (isNaN(date)) {
    // failed to parse the date normally, let's try parse-duration. As it gives
    // us the ability to allow a micro-syntax for dates such as `-30days` or `-5years`
    const parsed = parseDuration(inputDate, 'ms');
    if (parsed === null) {
      // unable to parse
      throw new Error(`[Supported] could not parse date='${date}'`);
    } else {
      const result = new Date(Date.now() + parsed);
      if (isNaN(result)) {
        return undefined;
      } else {
        return result;
      }
    }
    //
  } else {
    // able to parse date normally, use that date
    return date;
  }
}

async function main(cli, { policyDetails, setupProjectFn }) {
  if (cli.input.length === 0) {
    cli.showHelp(1);
  } else {
    const date = processDate(cli.flags.date) || undefined;
    const projectPaths = cli.input;

    const spinner = ora('working').start();
    let result;
    try {
      result = await processPolicies(projectPaths, setupProjectFn, spinner, date);
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
module.exports = run;
async function run(
  policyDetails = DEFAULT_SUPPORT_MESSAGE(),
  setupProjectFn,
  help = require('./help')(),
) {
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
        date: {
          type: 'string',
        },
      },
    }),
    { policyDetails, setupProjectFn },
  );
}

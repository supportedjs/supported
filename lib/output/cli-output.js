'use strict';

const boxen = require('boxen');
const termSize = require('term-size');
const wordWrap = require('word-wrap');
const chalk = require('chalk');
const emoji = require('node-emoji');
const { supportedRanges } = require('../time/index');

// CONSTANTS
const LOG_PREFIX_TXT = 'Support Policy Audit for';
const BOX_PADDING = 1;
const BOX_MARGIN = 0;

const BOX_WIDTH_MAX = 200;
const BOX_WIDTH = Math.min(BOX_WIDTH_MAX, termSize().columns);
const MILLSINQUARTER = 91 * 24 * 60 * 60 * 1000;

const LOG_VIOLATION = (total, violationOutputString) =>
  `Total ${total} violation(s) found.
Following version violation found
${violationOutputString}
  `;

function getViolations(violations) {
  let violationOutputString = '';
  let total = 0;
  for (let key in violations) {
    let violationCount = violations[key];
    if (violationCount) {
      violationOutputString += `${key}: ${violationCount}`;
      total += violationCount;
    }
  }
  return {
    violationOutputString,
    total,
  };
}

const COLOR = isSupported => (isSupported ? '#00FF00' : '#ff0000');

function getPackageHeadContent(name, latestVersion, message, isSupported) {
  if (isSupported) {
    return `${emoji.get('white_check_mark')} ${message ? message : 'Up-to-Date'} `;
  }
  return `${emoji.get('x')} ${message}
  ACTION REQUIRED: Upgrade to at least ${latestVersion} by running \`yarn upgrade ${name}\``;
}

function getBodyContent(nodePackage) {
  let { name, latestVersion, resolvedVersion, type, duration, message, isSupported } = nodePackage;
  return `
  ${name}
  ---------------------
  ${chalk.hex(COLOR(isSupported))(getPackageHeadContent(name, latestVersion, message, isSupported))}

  Resolved Version:        ${resolvedVersion}
  Latest Version:          ${latestVersion}
  ${
    !isSupported
      ? `Violated ${type} version:  +${Math.round(duration / MILLSINQUARTER)} quarters`
      : ''
  }
`;
}

function makeConsoleReport(reportContent) {
  const { title, body, isInSupportWindow, violationMessage, currentPolicy } = reportContent;
  const color = COLOR(isInSupportWindow);
  let head = boxen(
    `
//  ${chalk.yellowBright(LOG_PREFIX_TXT)}
//${chalk.bold(wordWrap(`${title}`, { width: BOX_WIDTH - 10 }))}

${chalk
  .hex(color)
  .bold(wordWrap(`In Support Window: ${isInSupportWindow}`, { width: BOX_WIDTH - 10 }))}
${chalk.red(wordWrap(violationMessage, { width: BOX_WIDTH - 10 }))}
${chalk.greenBright(
  wordWrap(
    `Current Policy :
${currentPolicy.join('\n')}`,
    { width: BOX_WIDTH - 10 },
  ),
)}
  `,
    {
      padding: BOX_PADDING,
      margin: BOX_MARGIN,
      borderColor: 'yellow',
    },
  );

  return `${head}
${body}
${chalk.blueBright(
  wordWrap(`Use option 'yarn supported <PROJECT NAME> --all' to see detailed report`, {
    width: BOX_WIDTH - 10,
  }),
)}`;
}

function displayResult(supportResult, flags) {
  const title = supportResult.projectName;
  const isInSupportWindow = supportResult.isInSupportWindow;
  const currentPolicy = supportedRanges(new Date()).map(support => support.name);

  let totalviolation = {
    patch: 0,
    minor: 0,
    major: 0,
    total: 0,
  };
  let body = '';
  supportResult.supportChecks.forEach(nodePackage => {
    if (flags.all || !nodePackage.isSupported) {
      if (nodePackage.type) {
        totalviolation[nodePackage.type]++;
      }
      body += getBodyContent(nodePackage);
    }
  });
  let violationMessage = '';
  if (!isInSupportWindow) {
    let { total, violationOutputString } = getViolations(totalviolation);
    violationMessage = LOG_VIOLATION(total, violationOutputString);
  }
  console.log(
    makeConsoleReport({
      title,
      isInSupportWindow,
      violationMessage,
      body: body || '',
      currentPolicy,
    }),
  );
}

module.exports = {
  displayResult,
};

'use strict';

const boxen = require('boxen');
const termSize = require('term-size');
const wordWrap = require('word-wrap');
const chalk = require('chalk');
const emoji = require('node-emoji');
const { supportedRanges } = require('../time/index');
const terminalLink = require('terminal-link');

// CONSTANTS
const BOX_PADDING = 1;
const BOX_MARGIN = 0;
const SPACE = '  ';

const BOX_WIDTH_MAX = 200;
const BOX_WIDTH = Math.min(BOX_WIDTH_MAX, termSize().columns);
const MILLSINQUARTER = 91 * 24 * 60 * 60 * 1000;

const LOG_VIOLATION = (total) => `Your project is not within the support window.
  ${total} package(s) that need to be upgraded to a supported version`;

const LOG_TITLE = (isSupported) => !isSupported ?
 `${emoji.get('x')} PROBLEM DETECTED` :
 `${emoji.get('white_check_mark')} ${chalk.bold(`Congrats!
Your project is using only supported versions of libraries. No action is required.`)}`

function getViolations(violations, violationDuration) {
  let violationOutputString = '';
  let total = 0;
  for (let key in violations) {
    let violationCount = violations[key];
    if (violationCount) {
      total += violationCount;
    }
  }
  for (let type in violationDuration) {
    let duration = violationDuration[type];
    let isSemVer =  ['major', 'minor', 'patch'].includes(type);
    if (duration) {
      if (!violationOutputString && isSemVer) {
        violationOutputString += `
      ${emoji.get('x')} SemVer`
      }
      violationOutputString += `
      ${isSemVer ? SPACE.repeat(2) : ''}${emoji.get('x')} ${type.toUpperCase()} ${Math.round(duration / MILLSINQUARTER)} qtr(s) behind.
      ${isSemVer ? SPACE.repeat(3) : ''}- ${violations[type] ? `${violations[type]} package(s) violates support policy` : ''}`;
    } else {
      violationOutputString += `
      ${isSemVer ? SPACE.repeat(2) : ''}${emoji.get('white_check_mark')} ${type.toUpperCase()}`
    }
  }

  return {
    violationOutputString,
    total,
  };
}

const COLOR = isSupported => (isSupported ? '#FFFFF' : '#ff0000');

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
  const { title, body, isInSupportWindow, violationMessage, violationOutput } = reportContent;
  const color = COLOR(isInSupportWindow);
  let head = boxen(
    `
${chalk
  .bold(wordWrap(LOG_TITLE(isInSupportWindow), { width: BOX_WIDTH - 10 }))}
${chalk(wordWrap(violationMessage, { width: BOX_WIDTH - 10 }))}
${violationOutput}
${chalk.bold(
  wordWrap(
    `For more information about our support policy: ${
      terminalLink.isSupported ?
      terminalLink('http://go/pemberly-support-policy', 'http://go/pemberly-support-policy') :
      'http://go/pemberly-support-policy'}`,
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
`;
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
  let violationDuration = {
    major: 0,
    minor: 0,
    patch: 0,
    node: 0,
    ember: 0
  }
  let body = '';
  supportResult.supportChecks.forEach(nodePackage => {
    if (flags.all || !nodePackage.isSupported) {
      if (nodePackage.type) {
        totalviolation[nodePackage.type]++;
        if (violationDuration[nodePackage.type] < nodePackage.duration) {
          violationDuration[nodePackage.type] = nodePackage.duration;
        }
        if (nodePackage.name in ['node', 'ember-cli']) {
          violationDuration[nodePackage.name] = nodePackage.duration;
        }
      }
      body += getBodyContent(nodePackage);
    }
  });
  let violationMessage = '';
  let violationOutput = '';
  if (!isInSupportWindow) {
    let { total, violationOutputString } = getViolations(totalviolation, violationDuration);
    violationMessage = LOG_VIOLATION(total);
    violationOutput = violationOutputString;
  }
  console.log(
    makeConsoleReport({
      title,
      isInSupportWindow,
      violationOutput,
      violationMessage,
      body: flags.all ? body : '',
      currentPolicy,
    }),
  );
}

module.exports = {
  displayResult,
};

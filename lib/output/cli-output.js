'use strict';

const { duration } = require('moment');
const Table = require('cli-table');
const boxen = require('boxen');
const termSize = require('term-size');
const wordWrap = require('word-wrap');
const chalk = require('chalk');

// CONSTANTS
const LOG_PREFIX_TXT = 'Support Policy Audit';
const BOX_PADDING = 1;
const BOX_MARGIN = 0;

const BOX_WIDTH_MAX = 200;
const BOX_WIDTH = Math.min(BOX_WIDTH_MAX, termSize().columns);

const LOG_VOILATION = (type, timeDuration) =>
  `Voilated the ${chalk.underline(type)} version policy by ${chalk.underline(
    duration(timeDuration).humanize(),
  )}`;

function makeConsoleAlert(alertContent) {
  const { title, nba, body, isInSupportWindow, voilationMessage } = alertContent;
  const color = isInSupportWindow ? '#00FF00' : '#ff0000';
  return boxen(
    `${chalk.yellowBright(LOG_PREFIX_TXT)}
${chalk.bold(wordWrap(`Project: ${title}`, { width: BOX_WIDTH - 10 }))}

${chalk
  .hex(color)
  .bold(wordWrap(`In Support Window: ${isInSupportWindow}`, { width: BOX_WIDTH - 10 }))}
${chalk.red(wordWrap(voilationMessage, { width: BOX_WIDTH - 10 }))}
${body}
${chalk.blueBright(wordWrap(`Use option --all to see detailed report`, { width: BOX_WIDTH - 10 }))}`,
    {
      padding: BOX_PADDING,
      margin: BOX_MARGIN,
      align: 'center',
      borderColor: 'yellow',
    },
  );
}

function displayResult(supportResult, flags) {
  const title = supportResult.projectName;
  const isInSupportWindow = supportResult.isInSupportWindow;
  let voilationMessage = ``;
  if (!isInSupportWindow) {
    const firstItem = supportResult.supportChecks[0];
    const type = firstItem.type;
    const timeDuration = firstItem.duration;
    voilationMessage = LOG_VOILATION(type, timeDuration);
  }

  const table = new Table({
    head: ['Name', 'In Support Window', 'Message', 'How old', 'Resolved Version', 'Latest Version'],
    style: {head: ['yellow']}
  });

  supportResult.supportChecks.forEach(nodePackage => {
    if (flags.all || !nodePackage.isSupported) {
      table.push([
        nodePackage.name,
        nodePackage.isSupported,
        nodePackage.message || 'Up-to-date',
        nodePackage.duration ? duration(nodePackage.duration).humanize() : '-',
        nodePackage.resolvedVersion || '-',
        nodePackage.latestVersion || '-',
      ]);
    }
  });
  console.log(
    makeConsoleAlert({
      title,
      isInSupportWindow,
      voilationMessage,
      body: (!isInSupportWindow && table.toString()) || '',
    }),
  );
}

module.exports = {
  displayResult,
};

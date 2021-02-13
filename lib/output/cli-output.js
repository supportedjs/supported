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
const SEMVER_LIST = ['major', 'minor', 'patch'];

const BOX_WIDTH_MAX = 200;
const BOX_WIDTH = Math.min(BOX_WIDTH_MAX, termSize().columns);
const MILLSINQUARTER = 91 * 24 * 60 * 60 * 1000;

const LOG_TITLE = (isSupported) => !isSupported ?
  chalk`  {underline {red {bold Support Policy Problem Detected!}}}
  {bold Please upgrade your dependencies!}
  {dim Your project is not within the support policy window because of outdated dependencies.}` :
  chalk`  {green ✓} Congrats!
  Your project is using only supported versions of libraries. No action is required.`;

const LOG_SEMVER_VIOLATION = (type, total, duration) => chalk`
      {red ✗ ${type.toUpperCase()} version [${total} dependencie(s) ${Math.round(duration / MILLSINQUARTER)} qtr(s) behind]}`;

const LOG_LTS_VIOLATION = (type, total, message) => {
  if (total) {
    return chalk`{red ✗} ${type} LTS \n      {red ✗ ${message}}`;
  }
  return chalk`{green ✓} {dim ${type} LTS}`;
};

const LOG_SEMVER_TITLE = (isSemVerViolated, totalSemVerViolation, totalPackages) => {
  if (isSemVerViolated) {
    return chalk`{red ✗} SemVer (${totalSemVerViolation} of ${totalPackages})`;
  }
  return chalk`{green ✓} {dim SemVer}`;
};

const LOG_POLICY_TITLE = (violationCount, policyCount ) => chalk`
  {bold Policies violated (${violationCount} of ${policyCount})}`;

function isSemVersion(type) {
  return SEMVER_LIST.includes(type);
}

function getTypeForModule(name) {
  if (name === 'node') {
    return 'node';
  } else if (name === 'ember-cli') {
    return 'ember'
  }
 }

function isSemVerPolicyViolated(violations) {
  return Object.keys(violations).some((type)=> {
    return violations[type] > 0;
  });
}

function getViolations({ violations, violationInfo, totalPackages }) {
  let violationMessages = {};
  let isSemVerViolated = isSemVerPolicyViolated(violations);
  let totalSemVerViolation = 0;
  for (let type in violations) {
    let isSemVer = isSemVersion(type);
    if (isSemVerViolated && isSemVer && violations[type] > 0) {
        totalSemVerViolation += violations[type];
        violationMessages[type] = LOG_SEMVER_VIOLATION(type, violations[type], violationInfo[type]);
    } else if(!isSemVer){
      debugger;
      violationMessages[type] = LOG_LTS_VIOLATION(type, violations[type], violationInfo[type]);
    }
  }

  // add headline for semVer voilation
  violationMessages['semVer'] = LOG_SEMVER_TITLE(isSemVerViolated, totalSemVerViolation, totalPackages);

  return violationMessages;
}


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
function generateViolationMessage(violationMessages) {
  let message = ``;
  if (violationMessages['node']) {
    message += `
    ${violationMessages['node']}`;
  }
  if (violationMessages['ember']) {
    message += `
    ${violationMessages['ember']}`;
  }
  message += `
    ${violationMessages['semVer']}`;
  if (violationMessages['major']) {
    message += `${violationMessages['major']}`;
  }
  if (violationMessages['minor']) {
    message += `${violationMessages['minor']}`;
  }
  if (violationMessages['patch']) {
    message += `${violationMessages['patch']}`;
  }
  return message;
}
function makeConsoleReport(reportContent) {
  const {
    title,
    body,
    isInSupportWindow,
    violationMessages,
    policyCount,
    violationCount,
  } = reportContent;

  let head =chalk`
${LOG_TITLE(isInSupportWindow)}`;
  if (!isInSupportWindow) {
    head += `
${LOG_POLICY_TITLE(policyCount, violationCount)}
    ${generateViolationMessage(violationMessages)}

${chalk.bold(
      wordWrap(`For more information about our support policy: ${
          terminalLink.isSupported ?
          terminalLink('http://go/pemberly-support-policy', 'http://go/pemberly-support-policy') :
          'http://go/pemberly-support-policy'}`,
        { width: BOX_WIDTH - 10 },
      ),
    )}`
  };

  return `${head}
${body}
`;
}

function getPolicyViolationData(violations) {
  let violationCount = 0;
  let policyCount = 0;
  if (violations['patch'] || violations['minor'] || violations['major']) {
    violationCount += 1;
    policyCount += 1;
  }
  if (violations['node']) {
    violationCount += 1;
  } else if (violations.hasOwnProperty('node')) {
    policyCount += 1;
  }

  if (violations['ember']) {
    violationCount += 1;
  } else if (violations.hasOwnProperty('ember')) {
    policyCount += 1;
  }
  return {
    violationCount,
    policyCount
  };
}

function getViolationsDetail(supportChecks) {
  let violations = {
    patch: 0,
    minor: 0,
    major: 0,
  };
  let violationInfo = {
    major: 0,
    minor: 0,
    patch: 0,
  }
  let totalPackages = 0;
  supportChecks.forEach(({type, isSupported, duration, message, name}) => {
    let isSemVer = isSemVersion(type);
    let moduleType = getTypeForModule(name);
    if (!isSupported) {
      if (violations[type]) {
        violations[type] += 1;
      } else {
        violations[type] = 1;
      }
      // store the largest voliation for a type
      if (violationInfo[type] < duration && isSemVer) {
        violationInfo[type] = duration;
      } else if(!isSemVer) {
        // for node and ember display the message about LTS
        violationInfo[type] = message;
      }
    }
    if (moduleType && isSupported) {
      violations[moduleType] = 0;
      violationInfo[moduleType] = 0;
    } else if(!moduleType){
      totalPackages++;
    }
  });
  return {
    violations,
    violationInfo,
    totalPackages
  }
}

function displayResult(supportResult, flags, message) {
  const title = supportResult.projectName;
  const isInSupportWindow = supportResult.isInSupportWindow;
  const currentPolicy = message ?
    message :
    supportedRanges(new Date()).map(support => support.name);
  let voilationDetails = getViolationsDetail(supportResult.supportChecks);
  let { violationCount, policyCount } = getPolicyViolationData(voilationDetails.violations);
  console.log(
    makeConsoleReport({
      title,
      isInSupportWindow,
      violationMessages: !isInSupportWindow ? getViolations(voilationDetails) : '',
      violationCount,
      policyCount,
      body: flags.all ? body : '',
      currentPolicy,
    }),
  );
}

module.exports = {
  displayResult,
};

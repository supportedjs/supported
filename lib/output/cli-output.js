'use strict';

const chalk = require('chalk');
const Table = require('cli-table');
const {
  LOG_TITLE,
  LOG_SEMVER_VIOLATION,
  LOG_LTS_VIOLATION,
  LOG_SEMVER_TITLE,
  LOG_POLICY_TITLE,
  DEFAULT_SUPPORT_MESSAGE,
} = require('./messages');

// CONSTANTS
const SEMVER_LIST = ['major', 'minor', 'patch'];

function isSemVersion(type) {
  return SEMVER_LIST.includes(type);
}

function getTypeForModule(name) {
  if (name === 'node') {
    return 'node';
  } else if (name === 'ember-cli') {
    return 'ember';
  }
}

function isSemVerPolicyViolated(violations) {
  return Object.keys(violations).some(type => {
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
    } else if (!isSemVer) {
      violationMessages[type] = LOG_LTS_VIOLATION(type, violations[type], violationInfo[type]);
    }
  }

  // add headline for semVer voilation
  violationMessages['semVer'] = LOG_SEMVER_TITLE(
    isSemVerViolated,
    totalSemVerViolation,
    totalPackages,
  );

  return violationMessages;
}

function getBodyContent(results) {
  const table = new Table({
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: '',
      'right-mid': '',
      middle: '',
    },
    head: [
      chalk` {underline {bold {white Name}}}`,
      chalk`{underline {bold {white Resolved}}}`,
      chalk`{underline {bold {white Latest}}}`,
    ],
  });
  results.forEach(({ name, resolvedVersion, latestVersion, isSupported }) => {
    if (!isSupported) {
      table.push([
        chalk` {red ${name}}`,
        chalk`{red ${resolvedVersion}}`,
        chalk`{red ${latestVersion}}`,
      ]);
    } else {
      table.push([
        chalk` {dim ${name}}`,
        chalk`{dim ${resolvedVersion}}`,
        chalk`{dim ${latestVersion}}`,
      ]);
    }
  });
  return table.toString();
}

/* Keep the order of voilations summary output as
node LTS
ember LTS
SemVer
*/
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
    body,
    isInSupportWindow,
    violationMessages,
    policyCount,
    violationCount,
    currentPolicy,
  } = reportContent;

  let summary = chalk`
${LOG_TITLE(isInSupportWindow)}`;

  if (!isInSupportWindow) {
    summary += chalk`
      ${LOG_POLICY_TITLE(violationCount, policyCount)}
      ${generateViolationMessage(violationMessages)}

      ${currentPolicy}`;
  }

  return `${summary}

${body}
`;
}

function getPolicyViolationData(violations) {
  let violationCount = 0;
  let policyCount = 0;
  let semVer = false;
  Object.keys(violations).forEach(type => {
    if (isSemVersion(type)) {
      if (semVer) {
        return;
      }
      violationCount++;
      policyCount++;
      semVer = true;
    } else if (undefined !== violations[type]) {
      // we add 'node' or 'ember' to violations tracker
      // only if policy is evaluated
      policyCount++;
    }
    if (violations[type]) {
      violationCount++;
    }
  });
  return {
    violationCount,
    policyCount,
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
  };
  let totalPackages = 0;
  supportChecks.forEach(({ type, isSupported, duration, message, name }) => {
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
      } else if (!isSemVer) {
        // for node and ember display the message about LTS
        violationInfo[type] = message;
      }
    }
    if (moduleType && isSupported) {
      violations[moduleType] = 0;
      violationInfo[moduleType] = 0;
    } else if (!moduleType) {
      totalPackages++;
    }
  });
  return {
    violations,
    violationInfo,
    totalPackages,
  };
}

function displayResult(supportResult, flags, message) {
  const title = supportResult.projectName;
  const isInSupportWindow = supportResult.isInSupportWindow;
  const currentPolicy = message ? message : DEFAULT_SUPPORT_MESSAGE();
  let voilationDetails = getViolationsDetail(supportResult.supportChecks);
  let { violationCount, policyCount } = getPolicyViolationData(voilationDetails.violations);
  let body = getBodyContent(supportResult.supportChecks);
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
  getBodyContent,
  generateViolationMessage,
  getViolations,
};

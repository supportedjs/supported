'use strict';

const chalk = require('chalk');
const Table = require('cli-table');
const { isExpiringSoon, MILLSINQUARTER } = require('../util');
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

function isSemVerPolicyViolated(violations, violationInfo) {
  return Object.keys(violations).some(type => {
    return violations[type] > 0 || violationInfo[type];
  });
}

function getViolations({ violations, violationInfo, totalPackages }) {
  let violationMessages = {};
  let isSemVerViolated = isSemVerPolicyViolated(violations, violationInfo);
  let totalSemVerViolation = 0;
  for (let type in violations) {
    let isSemVer = isSemVersion(type);
    if (isSemVerViolated && isSemVer && (violations[type] > 0 || violationInfo[type])) {
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
      chalk`{underline {bold {white Behind}}}`,
      chalk`{underline {bold {white Will be Depercated in}}}`,
    ],
  });
  results.forEach(({ name, resolvedVersion, latestVersion, duration, isSupported }) => {
    if (!isSupported) {
      table.push([
        chalk` {red ${name}}`,
        chalk`{red ${resolvedVersion}}`,
        chalk`{red ${latestVersion}}`,
        chalk`{red ${Math.ceil(duration / MILLSINQUARTER)} qtr(s)}`,
        ``,
      ]);
    } else {
      let format = `dim`;
      let expiresSoon = duration && isExpiringSoon(duration);
      if (expiresSoon) {
        format = `yellow`;
      }
      table.push([
        chalk` {${format} ${name}}`,
        chalk`{${format} ${resolvedVersion}}`,
        chalk`{${format} ${latestVersion}}`,
        ``,
        expiresSoon && chalk`{yellow ${Math.ceil(duration / MILLSINQUARTER)} qtr(s)}`,
      ]);
    }
  });
  return table.toString();
}

function getLtsViolation(packageInfo) {
  if (packageInfo) {
    return LOG_LTS_VIOLATION(
      packageInfo.name,
      packageInfo.isSupported,
      packageInfo.duration || packageInfo.message,
      packageInfo.resolvedVersion,
    );
  }
  return '';
}

function getPackageViolationTitle(packages, total, totalPackages, isWarning) {
  if (packages.length) {
    return LOG_SEMVER_TITLE(total, totalPackages, isWarning);
  }
  return '';
}

function getPackageViolation(violatingPackages, supportedPackages, isWarning) {
  let message = '';
  let totalPackages = violatingPackages.length + supportedPackages.length;
  if (violatingPackages.length) {
    let { violations, violationInfo } = getViolationsDetail(violatingPackages);
    let totalSemVerViolation = violations['total'];
    delete violations['total'];
    message += getPackageViolationTitle(
      violatingPackages,
      totalSemVerViolation,
      totalPackages,
      isWarning,
    );
    Object.keys(violations).forEach(type => {
      let dataObject = isWarning ? violationInfo : violations;
      if (dataObject[type]) {
        message += LOG_SEMVER_VIOLATION(type, violations[type], violationInfo[type], isWarning);
      }
    });
  }
  return message;
}

function violatedOrSoonExpiringPackagesCount(violatingPackageCount, ltsPackages) {
  let count = ltsPackages.reduce((count, pkg) => {
    if (pkg) {
      let { isSupported, duration, message } = pkg;
      if (!isSupported || (isSupported && (duration || message))) {
        count++;
      }
    }
    return count;
  }, 0);
  return violatingPackageCount + count;
}

function getTitle(isInSupportWindow, expiresSoon, nodePackage, emberPackage) {
  let violatedOrSoonExpiringCount = violatedOrSoonExpiringPackagesCount(expiresSoon.length, [
    emberPackage,
    nodePackage,
  ]);
  return chalk`${LOG_TITLE(isInSupportWindow, violatedOrSoonExpiringCount)}`;
}

function getHead(
  isInSupportWindow,
  unsupportedPackages,
  supportedPackages,
  expiresSoon,
  nodePackage,
  emberPackage,
  currentPolicy,
) {
  let head = '';
  let violatedOrSoonExpiringCount = violatedOrSoonExpiringPackagesCount(expiresSoon.length, [
    emberPackage,
    nodePackage,
  ]);
  if (!isInSupportWindow) {
    let policyCount = 1 + (emberPackage ? 1 : 0) + (nodePackage ? 1 : 0);
    let violationCount = unsupportedPackages.length ? 1 : 0;
    violationCount +=
      (emberPackage && !emberPackage.isSupported ? 1 : 0) +
      (nodePackage && !nodePackage.isSupported ? 1 : 0);
    head += chalk`
      ${LOG_POLICY_TITLE(violationCount, policyCount)}`;
  }
  if (violatedOrSoonExpiringCount || !isInSupportWindow) {
    let nodeViolation = getLtsViolation(nodePackage);
    let emberViolation = getLtsViolation(emberPackage);
    let packageViolation = getPackageViolation(unsupportedPackages, supportedPackages);
    if (!packageViolation) {
      packageViolation = getPackageViolation(expiresSoon, supportedPackages, true);
    }

    head += chalk`
    ${nodeViolation}
    ${emberViolation ? `${emberViolation}\n    ` : ''}${packageViolation}
    ${currentPolicy}`;
  }
  return head;
}

function makeConsoleReport(reportContent) {
  const {
    body,
    isInSupportWindow,
    currentPolicy,
    expiresSoon,
    unsupportedPackages,
    supportedPackages,
    nodePackage,
    emberPackage,
  } = reportContent;

  let title = getTitle(isInSupportWindow, expiresSoon, nodePackage, emberPackage);

  let head = getHead(
    isInSupportWindow,
    unsupportedPackages,
    supportedPackages,
    expiresSoon,
    nodePackage,
    emberPackage,
    currentPolicy,
  );

  return `${title}${head}
${body}
`;
}

function getViolationsDetail(supportChecks) {
  let violations = {
    major: 0,
    minor: 0,
    patch: 0,
    total: 0,
  };
  let violationInfo = {
    major: 0,
    minor: 0,
    patch: 0,
  };

  supportChecks.forEach(({ type, isSupported, duration, message }) => {
    let isSemVer = isSemVersion(type);
    let isDeprecatingSoon = isSupported && (duration || message);
    if (!isSupported || isDeprecatingSoon) {
      if (isSemVer) {
        violations[type] += 1;
      }
      violations['total'] += 1;
    }
    if (!isSupported || isDeprecatingSoon) {
      // store the largest voliation for a type
      if (violationInfo[type] < duration || (isDeprecatingSoon && isSemVer)) {
        violationInfo[type] = duration || message;
      } else if (!isSemVer) {
        // for node and ember display the message about LTS
        violationInfo[type] = message;
      }
    }
  });
  return {
    violations,
    violationInfo,
  };
}

function getCategorisedList(pkgList) {
  let expiresSoon = [];
  let unsupportedPackages = [];
  let nodePackage = [];
  let emberPackage;
  let supportedPackages = [];
  pkgList.forEach(pkg => {
    let { isSupported, duration, name } = pkg;
    if (name === 'node') {
      nodePackage = pkg;
    } else if (name === 'ember-cli') {
      emberPackage = pkg;
    } else if (isSupported && duration) {
      expiresSoon.push(pkg);
    } else if (isSupported) {
      supportedPackages.push(pkg);
    } else if (!isSupported) {
      unsupportedPackages.push(pkg);
    }
  });
  return {
    expiresSoon,
    unsupportedPackages,
    nodePackage,
    emberPackage,
    supportedPackages,
  };
}

function displayResult(supportResult, flags, message) {
  const title = supportResult.projectName;
  const isInSupportWindow = supportResult.isInSupportWindow;
  const currentPolicy = message ? message : DEFAULT_SUPPORT_MESSAGE();
  let {
    expiresSoon,
    unsupportedPackages,
    nodePackage,
    emberPackage,
    supportedPackages,
  } = getCategorisedList(supportResult.supportChecks);

  console.log(
    makeConsoleReport({
      title,
      isInSupportWindow,
      body: flags.verbose ? getBodyContent(supportResult.supportChecks) : '',
      currentPolicy,
      expiresSoon,
      unsupportedPackages,
      supportedPackages,
      nodePackage,
      emberPackage,
    }),
  );
}

module.exports = {
  displayResult,
  getBodyContent,
  getViolations,
  getCategorisedList,
  getHead,
  getTitle,
};

'use strict';
const chalk = require('chalk');
const { supportedRanges } = require('../time/index');

const { MILLSINQUARTER } = require('../util');

const LOG_TITLE = (isSupported, count) => {
  if (!isSupported) {
    return chalk`  {underline {red {bold Support Policy Problem Detected!}}}
    {bold Please upgrade your dependencies!}
    {dim Your project is not within the support policy window because of outdated dependencies.}`;
  } else if (count) {
    return chalk`  {underline {yellow {bold ⚠ Warning!}}}
    Your project needs your attention!`;
  } else {
    return chalk`  {green ✓} Congrats!
    Your project is using only supported versions of libraries. No action is required.`;
  }
};

const LOG_SEMVER_VIOLATION = (type, total, duration, isWarning) => {
  if (!isWarning) {
    return chalk`
      {red ✗ ${type} version [${total} ${getDepLocale(total)} up-to ${Math.ceil(
      duration / MILLSINQUARTER,
    )} ${getQtrLocale(total)} behind]}`;
  } else {
    let qtrs = Math.ceil(duration / MILLSINQUARTER);
    return chalk`
      {yellow ⚠ ${type} [${total} ${getDepLocale(total)} will expire within ${qtrs} ${getQtrLocale(
      qtrs,
    )}}]`;
  }
};

function getDepLocale(count) {
  return count == 1 ? 'dependency' : 'dependencies';
}

function getQtrLocale(count) {
  return count == 1 ? 'qtr' : 'qtrs';
}

const LOG_LTS_VIOLATION = (type, isSupported, duration, message, resolvedVersion) => {
  const LTS_POLICY = `${type} LTS Policy`;
  if (!isSupported) {
    return chalk`{red ✗} ${LTS_POLICY}\n      {red ✗ ${message}}`;
  } else if (isSupported && (message || duration)) {
    let qtrs = Math.ceil(duration / MILLSINQUARTER);
    return chalk`{yellow ⚠} ${LTS_POLICY}
      ${
        !duration
          ? chalk`{yellow ⚠ ${message}}`
          : chalk`{yellow ⚠ version/version-range ${resolvedVersion} will be deprecated within ${qtrs} ${getQtrLocale(
              qtrs,
            )}}`
      }`;
  }
  return chalk`{green ✓} {dim ${LTS_POLICY}}`;
};

const LOG_SEMVER_TITLE = (totalSemVerViolation, totalPackages, isWarning) => {
  const SEMVER_POLICY = `SemVer Policy`;
  if (totalSemVerViolation && !isWarning) {
    return chalk`{red ✗} ${SEMVER_POLICY} (${totalSemVerViolation} violations in ${totalPackages} dependencies)`;
  } else if (isWarning) {
    return chalk`{yellow ⚠} ${SEMVER_POLICY} (${totalSemVerViolation} in ${totalPackages} dependencies will expire soon) `;
  }
  return chalk`{green ✓} {dim ${SEMVER_POLICY}}`;
};

const LOG_POLICY_TITLE = (violationCount, policyCount) => chalk`
  {bold Policies violated (${violationCount} of ${policyCount})}`;

const DEFAULT_SUPPORT_MESSAGE = () => chalk`{dim
  Current Support Policy:
${supportedRanges(new Date())
  .map(support => `    ${support.name}`)
  .join('\n')}
    node LTS versions
    ember LTS versions}`;

module.exports = {
  LOG_TITLE,
  LOG_SEMVER_VIOLATION,
  LOG_LTS_VIOLATION,
  LOG_SEMVER_TITLE,
  LOG_POLICY_TITLE,
  DEFAULT_SUPPORT_MESSAGE,
  getDepLocale,
  getQtrLocale,
};

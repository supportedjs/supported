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
      {red ✗ ${type} version [${total} dependencie(s) ${Math.ceil(
      duration / MILLSINQUARTER,
    )} qtr(s) behind]}`;
  } else {
    return chalk`
      {yellow ⚠ ${type} [${total} dependencie(s) will expire within ${Math.ceil(
      duration / MILLSINQUARTER,
    )} qtr(s)}]`;
  }
};

const LOG_LTS_VIOLATION = (type, isSupported, messageOrDuration, resolvedVersion) => {
  if (!isSupported) {
    return chalk`{red ✗} ${type} LTS \n      {red ✗ ${messageOrDuration}}`;
  } else if (isSupported && messageOrDuration) {
    return chalk`{yellow ⚠} ${type} LTS
      ${
        messageOrDuration.length
          ? chalk`{yellow ⚠ ${messageOrDuration}}`
          : chalk`{yellow ⚠ version/version-range ${resolvedVersion} will be deprecated within ${Math.ceil(
              messageOrDuration / MILLSINQUARTER,
            )}qtr(s)}`
      }`;
  }
  return chalk`{green ✓} {dim ${type} LTS}`;
};

const LOG_SEMVER_TITLE = (totalSemVerViolation, totalPackages, isWarning) => {
  if (totalSemVerViolation && !isWarning) {
    return chalk`{red ✗} SemVer (${totalSemVerViolation} violations in ${totalPackages} dependencies)`;
  } else if (isWarning) {
    return chalk`{yellow ⚠} SemVer (${totalSemVerViolation} in ${totalPackages} dependencies will expire soon) `;
  }
  return chalk`{green ✓} {dim SemVer}`;
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
};

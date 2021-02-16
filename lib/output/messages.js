'use strict';
const chalk = require('chalk');
const { supportedRanges } = require('../time/index');

const MILLSINQUARTER = 91 * 24 * 60 * 60 * 1000;

const LOG_TITLE = isSupported =>
  !isSupported
    ? chalk`  {underline {red {bold Support Policy Problem Detected!}}}
  {bold Please upgrade your dependencies!}
  {dim Your project is not within the support policy window because of outdated dependencies.}`
    : chalk`  {green ✓} Congrats!
  Your project is using only supported versions of libraries. No action is required.`;

const LOG_SEMVER_VIOLATION = (type, total, duration) => chalk`
      {red ✗ ${type.toUpperCase()} version [${total} dependencie(s) ${Math.round(
  duration / MILLSINQUARTER,
)} qtr(s) behind]}`;

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

const LOG_POLICY_TITLE = (violationCount, policyCount) => chalk`
  {bold Policies violated (${violationCount} of ${policyCount})}`;

const DEFAULT_SUPPORT_MESSAGE = () => chalk`{bold
  Current Support Policy:
${supportedRanges(new Date())
  .map(support => `    ${support.name}`)
  .join('\n')}
    Node LTS versions
    Ember LTS versions}`;

module.exports = {
  LOG_TITLE,
  LOG_SEMVER_VIOLATION,
  LOG_LTS_VIOLATION,
  LOG_SEMVER_TITLE,
  LOG_POLICY_TITLE,
  DEFAULT_SUPPORT_MESSAGE,
};

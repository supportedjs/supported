'use strict';

    import chalk from 'chalk';
    import { supportedRanges } from '../time/index';

    import { MS_IN_QTR } from '../util';

/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'isSupported' implicitly has an 'any' type. */
module.exports.LOG_TITLE = (isSupported, count, inVerboseMode) => {
  const verboseCallToAction = inVerboseMode
    ? ''
    : '\n    Run in verbose mode (--verbose) to get a full report';
  if (!isSupported) {
    return chalk`  {underline {red {bold Support Policy Problem Detected!}}}
    {bold Please upgrade your dependencies!}
    {dim Your project is not within the support policy window because of outdated dependencies.}${verboseCallToAction}`;
  } else if (count) {
    return chalk`  {underline {yellow {bold ⚠ Warning!}}}
    Your project needs your attention!${verboseCallToAction}`;
  } else {
    return chalk`  {green ✓} Congrats!
    Your project is using only supported versions of libraries. No action is required.`;
  }
};

/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'isWarning' implicitly has an 'any' type. */
module.exports.LOG_SEMVER_VIOLATION = (type: unknown, total: unknown, duration: number, isWarning) => {
  if (!isWarning) {
    return chalk`
      {red ✗ ${type} version [${total} ${getDepLocale(total)} up-to ${Math.ceil(
      duration / MS_IN_QTR,
    )} ${getQtrLocale(total)} behind]}`;
  } else {
    let qtrs = Math.ceil(duration / MS_IN_QTR);
    return chalk`
      {yellow ⚠ ${type} [${total} ${getDepLocale(total)} will expire within ${qtrs} ${getQtrLocale(
      qtrs,
    )}]}`;
  }
};

function getDepLocale(count: unknown): "dependency" | "dependencies"  {
  return count == 1 ? 'dependency' : 'dependencies';
}

module.exports.getQtrLocale = getQtrLocale;
export function getQtrLocale(count: unknown): "qtr" | "qtrs"  {
  return count == 1 ? 'qtr' : 'qtrs';
}

/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'type' implicitly has an 'any' type. */
module.exports.LOG_LTS_VIOLATION = (type, isSupported, duration: number, message: unknown, resolvedVersion: unknown) => {
  const LTS_POLICY = `${type} LTS Policy`;
  if (!isSupported) {
    return chalk`{red ✗} ${LTS_POLICY}\n      {red ✗ ${message}}`;
  } else if (isSupported && (message || duration)) {
    let qtrs = Math.ceil(duration / MS_IN_QTR);
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

/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'isWarning' implicitly has an 'any' type. */
module.exports.LOG_SEMVER_TITLE = (totalSemVerViolation: unknown, totalPackages: unknown, isWarning) => {
  const SEMVER_POLICY = `SemVer Policy`;
  if (totalSemVerViolation && !isWarning) {
    return chalk`{red ✗} ${SEMVER_POLICY} (${totalSemVerViolation} violations in ${totalPackages} dependencies)`;
  } else if (isWarning) {
    return chalk`{yellow ⚠} ${SEMVER_POLICY} (${totalSemVerViolation} in ${totalPackages} dependencies will expire soon) `;
  }
  return chalk`{green ✓} {dim ${SEMVER_POLICY}}`;
};

module.exports.LOG_POLICY_TITLE = (violationCount: unknown, policyCount: unknown) => chalk`
  {bold Policies violated (${violationCount} of ${policyCount})}`;

module.exports.DEFAULT_SUPPORT_MESSAGE = () => {
/* @ts-expect-error @rehearsal TODO TS2339: Property 'map' does not exist on type '{ type: string; name: strin; }'. */
  return chalk`{dim
  Current Support Policy:
${supportedRanges(new Date())
  .map((support) => `    ${support.name}`)
  .join('\n')}
    node LTS versions
    ember LTS versions}`;
};

/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'isSupported' implicitly has an 'any' type. */
module.exports.LOG_PROJECT_TITLE = (isSupported, projectName: unknown, isExpiringSoon) => {
  if (!isSupported) {
    return chalk`  {red ✗ {bold ${projectName}}}`;
  } else if (isSupported && isExpiringSoon) {
    return chalk`  {yellow ⚠} {bold ${projectName}}`;
  }
  return chalk`  {green ✓} {dim ${projectName}}`;
};

/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'isSupported' implicitly has an 'any' type. */
module.exports.LOG_TITLE_MULTIPLE = (isSupported, count) => {
  if (!isSupported) {
    return chalk`  {underline {red {bold Support Policy Problem Detected!}}}
    {bold Please upgrade your dependencies!}
    {dim Your projects are not within the support policy window because of outdated dependencies.}`;
  } else if (count) {
    return chalk`  {underline {yellow {bold ⚠ Warning!}}}
    Your projects needs your attention!`;
  } else {
    return chalk`  {green ✓} Congrats!
    Your projects are using only supported versions of libraries. No action is required.`;
  }
};

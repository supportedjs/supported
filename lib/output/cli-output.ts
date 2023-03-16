'use strict';

    import chalk from 'chalk';
    import Table from 'cli-table';
    import { isExpiringSoon } from '../util';
/* @ts-expect-error @rehearsal TODO TS2305: Module '"./messages"' has no exported member 'LOG_TITLE'. */
    import { LOG_TITLE, LOG_SEMVER_VIOLATION, LOG_LTS_VIOLATION, LOG_SEMVER_TITLE, LOG_POLICY_TITLE, DEFAULT_SUPPORT_MESSAGE, LOG_TITLE_MULTIPLE, LOG_PROJECT_TITLE } from './messages';

// CONSTANTS
const SEMVER_LIST = ['major', 'minor', 'patch'];

/**
 *
 * @param {string} type : type of semver from SEMVER_LIST / `node` / `ember-cli`
 * @returns {boolean} true/false
 */
function isSemVersion(type: string): boolean {
  return SEMVER_LIST.includes(type);
}

/**
 * creates a table of content for display
 * @param {list} results : result of support check run
 * @param {flags} flags input from terminal
 * @returns {string} formatted output table in string
 */
module.exports.getBodyContent = getBodyContent;
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'results' implicitly has an 'any' type. */
function getBodyContent(results, flags): "" | Table<TableRow>  {
  const chars = {
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
  };
  const headings = [
    chalk` {underline {bold {white Name}}}`,
    chalk`{underline {bold {white Resolved}}}`,
    chalk`{underline {bold {white Latest}}}`,
    chalk`{underline {bold {white Violation Type}}}`,
    chalk`{underline {bold {white End of Support}}}`,
  ];
  const unSupportedTable: string[][] = [];
/* @ts-expect-error @rehearsal TODO TS7034: Variable 'expiringSoonTable' implicitly has type 'any[]' in some locations where its type cannot be determined. */
  const expiringSoonTable = [];
  const supportedTable: string[][] = [];
  results.forEach(
/* @ts-expect-error @rehearsal TODO TS7031: Binding element 'name' implicitly has an 'any' type. */
    ({ name, resolvedVersion, latestVersion, duration, type, isSupported, deprecationDate }) => {
      if (!isSupported) {
        unSupportedTable.push([
          chalk` {red ${name}}`,
          chalk`{red ${resolvedVersion}}`,
          chalk`{red ${latestVersion}}`,
          chalk`{red ${type ? type : 'LTS'}}`,
          chalk`{red ${new Date(deprecationDate).toDateString()}}`,
        ]);
      } else {
        let expiresSoon = duration && isExpiringSoon(duration);
        if (expiresSoon) {
          expiringSoonTable.push([
            chalk` {yellow ${name}}`,
            chalk`{yellow ${resolvedVersion}}`,
            chalk`{yellow ${latestVersion}}`,
            chalk`{yellow ${type ? type : 'LTS'}}`,
            expiresSoon && chalk`{yellow ${new Date(deprecationDate).toDateString()}}`,
          ]);
        } else {
          supportedTable.push([
            chalk` {dim ${name}}`,
            chalk`{dim ${resolvedVersion}}`,
            chalk`{dim ${latestVersion}}`,
          ]);
        }
      }
    },
  );
  let table = new Table({
    chars,
    head: [...headings],
  });
  const showUnsupported = flags.verbose || flags.unsupported;
  const showExpiring = flags.verbose || flags.expiring;
  const showSupported = flags.verbose || flags.supported;
  if (unSupportedTable.length && showUnsupported) {
    table.push(...unSupportedTable);
  }
  if (expiringSoonTable.length && showExpiring) {
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'expiringSoonTable' implicitly has an 'any[]' type. */
    table.push(...expiringSoonTable);
  }
  if (supportedTable.length && showSupported) {
    table.push(...supportedTable);
  }

  return showUnsupported || showExpiring || showSupported ? table : '';
}

/**
 *
 * @param {object} packageInfo: support check result for LTS pakcages (node & ember-cli)
 * @returns {string} if there is LTS violation, retruns formatted violation message.
 */
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'packageInfo' implicitly has an 'any' type. */
function getLtsViolation(packageInfo): string {
  if (packageInfo) {
    return LOG_LTS_VIOLATION(
      packageInfo.name,
      packageInfo.isSupported,
      packageInfo.duration,
      packageInfo.message,
      packageInfo.resolvedVersion,
    );
  }
  return '';
}

/**
 *
 * @param {list} violatingPackages : list of all dependencies violating the semVer
 * @param {int} totalSemVerViolation: total number of semVer violation
 * @param {int} totalPackages: total number of packages in the project
 * @param {boolean | undefined} isWarning: is it only warning not violation
 * @returns {string} formatted package semver violation title string
 */
function getPackageViolationTitle(
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'list'. */
  violatingPackages: list,
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'int'. */
  totalSemVerViolation: int,
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'int'. */
  totalPackages: int,
  isWarning: boolean | undefined,
): string {
  if (violatingPackages.length) {
    return LOG_SEMVER_TITLE(totalSemVerViolation, totalPackages, isWarning);
  }
  return '';
}

/**
 *
 * @param {list} violatingPackages : list of all dependencies violating the semVer
 * @param {number} totalPackagesCount: total number of dependencies
 * @param {boolean | undefined} isWarning: is it only warning not violation
 * @returns {string} formatted package semver violation title + body string
 */
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'list'. */
function getPackageViolation(violatingPackages: list, totalPackagesCount: number, isWarning: boolean | undefined): string {
  let message = '';
  if (violatingPackages.length) {
/* @ts-expect-error @rehearsal TODO TS2339: Property 'violationInfo' does not exist on type '{ violations: { major: numb; }; }'. */
    let { violations, violationInfo } = getViolationsDetail(violatingPackages);
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type '"total"' can't be used to index type '{ major: numb; }'..  Property 'total' does not exist on type '{ major: numb; }'. */
    let totalSemVerViolation = violations['total'];
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type '"total"' can't be used to index type '{ major: numb; }'..  Property 'total' does not exist on type '{ major: numb; }'. */
    delete violations['total'];
    message += getPackageViolationTitle(
      violatingPackages,
      totalSemVerViolation,
      totalPackagesCount,
      isWarning,
    );
    Object.keys(violations).forEach(type => {
      let dataObject = isWarning ? violationInfo : violations;
      if (dataObject[type]) {
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ major: numb; }'..  No index signature with a parameter of type 'string' was found on type '{ major: numb; }'. */
        message += LOG_SEMVER_VIOLATION(type, violations[type], violationInfo[type], isWarning);
      }
    });
  }
  return message;
}

/**
 *
 * @param {int} violatingPackageCount number of violating node moduels packages
 * @param {list} ltsPackages list of all LTS pakcages (node and ember-cli)
 * @returns {int} total number of expiring and violating packages
 */
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'int'. */
function violatedOrSoonExpiringPackagesCount(violatingPackageCount: int, ltsPackages: list): int {
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'pkg' implicitly has an 'any' type. */
  let count = ltsPackages.reduce((count: number, pkg) => {
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
/**
 *
 * @param {*} isInSupportWindow
 */
module.exports.isProjectExpiringSoon = isProjectExpiringSoon;
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'result' implicitly has an 'any' type. */
export function isProjectExpiringSoon(result): boolean  {
  const { expiresSoon, emberCliPackage, emberSourcePackage, nodePackage } = getCategorisedList(
    result.supportChecks,
  );
  let violatedOrSoonExpiringCount = violatedOrSoonExpiringPackagesCount(expiresSoon.length, [
    emberCliPackage,
    emberSourcePackage,
    nodePackage,
  ]);
  return violatedOrSoonExpiringCount > 0;
}
/**
 *
 * @param {boolean} isInSupportWindow is the project in support window or not
 * @param {list} expiresSoon list of expiring soon packages
 * @param {object} flags: flags passed in command line
 * @param {object} nodePackage support check info of package node
 * @param {object} emberCliPackage support check info of package ember-cli
 * @param {object} emberSourcePackage support check info of package ember-source
 *
 * @returns {string} foramtted title for the support check run
 */
module.exports.getTitle = getTitle;
function getTitle(
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'isInSupportWindow' implicitly has an 'any' type. */
  isInSupportWindow,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'expiresSoon' implicitly has an 'any' type. */
  expiresSoon,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'flags' implicitly has an 'any' type. */
  flags,
  nodePackage: undefined,
  emberCliPackage: undefined,
  emberSourcePackage: undefined,
): string  {
  let violatedOrSoonExpiringCount = violatedOrSoonExpiringPackagesCount(expiresSoon.length, [
    emberSourcePackage,
    emberCliPackage,
    nodePackage,
  ]);
  return chalk`${LOG_TITLE(isInSupportWindow, violatedOrSoonExpiringCount, flags.verbose)}`;
}

/**
 *
 * @param {boolean} isInSupportWindow is the project in support window or not
 * @param {list} unsupportedPackages list of unsupported packages
 * @param {list} supportedPackages list of supported packages
 * @param {list} expiresSoon list of expiring soon packages
 * @param {object} nodePackage support check info of package node
 * @param {object} emberCliPackage support check info of package ember-cli
 * @param {object} emberSourcePackage support check info of package ember-source
 * @param {string} currentPolicy current support policy detail
 *
 * @returns {string} head for the support check run
 */
module.exports.getHead = getHead;
function getHead(
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'isInSupportWindow' implicitly has an 'any' type. */
  isInSupportWindow,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'unsupportedPackages' implicitly has an 'any' type. */
  unsupportedPackages,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'supportedPackages' implicitly has an 'any' type. */
  supportedPackages,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'expiresSoon' implicitly has an 'any' type. */
  expiresSoon,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'nodePackage' implicitly has an 'any' type. */
  nodePackage,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'emberCliPackage' implicitly has an 'any' type. */
  emberCliPackage,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'emberSourcePackage' implicitly has an 'any' type. */
  emberSourcePackage,
  currentPolicy: unknown,
): string  {
  let head = '';
  let violatedOrSoonExpiringCount = violatedOrSoonExpiringPackagesCount(expiresSoon.length, [
    emberCliPackage,
    emberSourcePackage,
    nodePackage,
  ]);
  if (!isInSupportWindow) {
    let policyCount =
      1 + (emberCliPackage ? 1 : 0) + (emberSourcePackage ? 1 : 0) + (nodePackage ? 1 : 0);
    let violationCount = unsupportedPackages.length ? 1 : 0;
    violationCount +=
      (emberCliPackage && !emberCliPackage.isSupported ? 1 : 0) +
      (emberSourcePackage && !emberSourcePackage.isSupported ? 1 : 0) +
      (nodePackage && !nodePackage.isSupported ? 1 : 0);
    head += chalk`
      ${LOG_POLICY_TITLE(violationCount, policyCount)}`;
  }
  let totalPackagesCount =
    unsupportedPackages.length + supportedPackages.length + expiresSoon.length;
  if (violatedOrSoonExpiringCount || !isInSupportWindow) {
    let nodeViolation = getLtsViolation(nodePackage);
    let emberSourceViolation = getLtsViolation(emberSourcePackage);
    let emberCliViolation = getLtsViolation(emberCliPackage);
/* @ts-expect-error @rehearsal TODO TS2554: Expected 3 arguments, but got 2. */
    let packageViolation = getPackageViolation(unsupportedPackages, totalPackagesCount);
    if (!packageViolation) {
      packageViolation = getPackageViolation(expiresSoon, totalPackagesCount, true);
    }

    head += chalk`
    ${nodeViolation}
    ${emberCliViolation ? `${emberCliViolation}\n    ` : ''}
    ${emberSourceViolation ? `${emberSourceViolation}\n    ` : ''}${packageViolation}
    ${currentPolicy}`;
  }
  return head;
}

/**
 *
 * @param {object} supportResult : support check result
 *
 */
module.exports.makeConsoleReport = makeConsoleReport;
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'supportResult' implicitly has an 'any' type. */
export function makeConsoleReport(supportResult, flags: {}, supportMessage: string): { title: string; head: stri...  {
  const isInSupportWindow = supportResult.isInSupportWindow;
  const currentPolicy = supportMessage ? supportMessage : DEFAULT_SUPPORT_MESSAGE();
  let {
    expiresSoon,
    unsupportedPackages,
    nodePackage,
    emberCliPackage,
    emberSourcePackage,
    supportedPackages,
  } = getCategorisedList(supportResult.supportChecks);

  const title = getTitle(
    isInSupportWindow,
    expiresSoon,
    flags,
    nodePackage,
    emberCliPackage,
    emberSourcePackage,
  );

  const head = getHead(
    isInSupportWindow,
    unsupportedPackages,
    supportedPackages,
    expiresSoon,
    nodePackage,
    emberCliPackage,
    emberSourcePackage,
    currentPolicy,
  );

  const body = getBodyContent(supportResult.supportChecks, flags);

  return {
    title,
    head,
/* @ts-expect-error @rehearsal TODO TS2322: Type 'title: string; head: string; body: "" | Table<TableRow' is being returned or assigned, but type 'title: string; head: stri' is expected. Please convert type 'title: string; head: string; body: "" | Table<TableRow' to type 'title: string; head: stri', or return or assign a variable of type 'title: string; head: stri' */
    body,
  };
}

/**
 * This function will generate each semver violation count and duration
 * @param {list} supportChecks resulting list from support check run for packages
 * @returns {object} violations: counts the number of violation for each semVers
 * violationInfo: max number of duration for each semVer violation or message for the violation
 */
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'list'. */
function getViolationsDetail(supportChecks: list): { violations: { major: numb...  {
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

/* @ts-expect-error @rehearsal TODO TS7031: Binding element 'type' implicitly has an 'any' type. */
  supportChecks.forEach(({ type, isSupported, duration, message }) => {
    let isSemVer = isSemVersion(type);
    let isDeprecatingSoon = isSupported && (duration || message);
    if (!isSupported || isDeprecatingSoon) {
      if (isSemVer) {
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ major: number; minor: number; patch: number; total: number; }'. */
        violations[type] += 1;
      }
      violations['total'] += 1;
    }
    if (!isSupported || isDeprecatingSoon) {
      // store the largest voliation for a type
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ major: number; minor: number; patch: number; }'. */
      if (violationInfo[type] < duration || (isDeprecatingSoon && isSemVer)) {
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ major: number; minor: number; patch: number; }'. */
        violationInfo[type] = duration || message;
      } else if (!isSemVer) {
        // for node and ember display the message about LTS
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ major: number; minor: number; patch: number; }'. */
        violationInfo[type] = message;
      }
    }
  });
  return {
    violations,
/* @ts-expect-error @rehearsal TODO TS2322: Type 'violations: { major: number; minor: number; patch: number; total: number; }; violationInfo: { major: number; minor: number; patch: number' is being returned or assigned, but type 'violations: { major: numb' is expected. Please convert type 'violations: { major: number; minor: number; patch: number; total: number; }; violationInfo: { major: number; minor: number; patch: number' to type 'violations: { major: numb', or return or assign a variable of type 'violations: { major: numb' */
    violationInfo,
  };
}

/**
 * Categorises entire list into separate list based on type of violation
 * @param {list} pkgList : list of all packages processed by support check
 * @returns {object} object contains expiresSoon
    unsupportedPackages,
    nodePackage,
    emberPackage,
    supportedPackages
 */
module.exports.getCategorisedList = getCategorisedList;
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'pkgList' implicitly has an 'any' type. */
function getCategorisedList(pkgList) {
/* @ts-expect-error @rehearsal TODO TS7034: Variable 'expiresSoon' implicitly has type 'any[]' in some locations where its type cannot be determined. */
  let expiresSoon = [];
/* @ts-expect-error @rehearsal TODO TS7034: Variable 'unsupportedPackages' implicitly has type 'any[]' in some locations where its type cannot be determined. */
  let unsupportedPackages = [];
  let nodePackage = undefined;
  let emberCliPackage;
  let emberSourcePackage;
/* @ts-expect-error @rehearsal TODO TS7034: Variable 'supportedPackages' implicitly has type 'any[]' in some locations where its type cannot be determined. */
  let supportedPackages = [];
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'pkg' implicitly has an 'any' type. */
  pkgList.forEach((pkg) => {
    let { isSupported, duration, name } = pkg;
    if (name === 'node') {
      nodePackage = pkg;
    } else if (name === 'ember-cli') {
      emberCliPackage = pkg;
    } else if (name === 'ember-source') {
      emberSourcePackage = pkg;
    } else if (isSupported && duration) {
      expiresSoon.push(pkg);
    } else if (isSupported) {
      supportedPackages.push(pkg);
    } else if (!isSupported) {
      unsupportedPackages.push(pkg);
    }
  });
  return {
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'expiresSoon' implicitly has an 'any[]' type. */
    expiresSoon,
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'unsupportedPackages' implicitly has an 'any[]' type. */
    unsupportedPackages,
    nodePackage,
    emberCliPackage,
    emberSourcePackage,
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'supportedPackages' implicitly has an 'any[]' type. */
    supportedPackages,
  };
}

/**
 * Outputs the result of support run on terminal
 * @param {object} supportResult: result from support check run
 * @param {object} flags: flags passed in command line
 * @param {string} supportMessage: custom support policy message
 *
 */
module.exports.displayResult = displayResult;
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'supportResult' implicitly has an 'any' type. */
function displayResult(supportResult, flags: {}, supportMessage: string): void  {
/* @ts-expect-error @rehearsal TODO TS2339: Property 'body' does not exist on type '{ title: string; head: stri; }'. */
  const { title, head, body } = makeConsoleReport(supportResult, flags, supportMessage);
  let readjustedBody = body;
  if (body) {
    readjustedBody = `\n${readjustedBody}`;
  }
  console.log(`${title}${head}${readjustedBody}`);
}

module.exports.displayResults = displayResults;
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'results' implicitly has an 'any' type. */
export function displayResults(results, flags, policyDetails: string): void  {
  if (results.projects.length == 1) {
    return displayResult(results.projects[0], flags, policyDetails);
  }
  let finalOutput = `${LOG_TITLE_MULTIPLE(
    results.isInSupportWindow,
    results.expiringSoonCount,
  )}\n\n`;
  if (results.projects.length > 1 && (flags.unsupported || flags.supported || flags.expiring)) {
/* @ts-expect-error @rehearsal TODO TS7034: Variable 'tempList' implicitly has type 'any[]' in some locations where its type cannot be determined. */
    let tempList = [];
    if (flags.unsupported) {
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'tempList' implicitly has an 'any[]' type. */
      tempList.push.apply(
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'tempList' implicitly has an 'any[]' type. */
        tempList,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'result' implicitly has an 'any' type. */
        results.projects.filter((result) => !result.isInSupportWindow),
      );
    }
    if (flags.supported) {
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'tempList' implicitly has an 'any[]' type. */
      tempList.push.apply(
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'tempList' implicitly has an 'any[]' type. */
        tempList,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'result' implicitly has an 'any' type. */
        results.projects.filter((result) => result.isInSupportWindow),
      );
    }
    if (flags.expiring) {
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'tempList' implicitly has an 'any[]' type. */
      tempList.push.apply(
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'tempList' implicitly has an 'any[]' type. */
        tempList,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'result' implicitly has an 'any' type. */
        results.projects.filter((result) => result.isExpiringSoon),
      );
    }
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'tempList' implicitly has an 'any[]' type. */
    results.projects = tempList;
  }
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'result' implicitly has an 'any' type. */
  results.projects.forEach((result) => {
    const { head } = makeConsoleReport(result, {}, '  ');
    finalOutput += LOG_PROJECT_TITLE(
      result.isInSupportWindow,
      result.projectName,
      result.isExpiringSoon,
    );
    if (head && flags.verbose) {
      // remove the newlines in both the ends of head so that we can place the
      // head with right amount of tabs
      let trimmedHead = head.replace(/^\s+|\s+$/g, '');
      finalOutput += `\n    ${trimmedHead}`;
    }
    finalOutput += '\n';
  });
  finalOutput += `  ${policyDetails}`;
  console.log(finalOutput);
}

'use strict';

// TODO: refactor this file
const { parse: parsePackageName } = require('parse-package-name');
const semver = require('semver');
const { isExpiringSoon, dateDiff, getLatest, DEFAULT_PRIMARY_POLICY } = require('../util');
const moment = require('moment');
module.exports.supportedRanges = supportedRanges;

const MONTHS_IN_QTR = 3;

// TODO: Should check if we should remove this function as we are using deprecationDates function for the calculation
function supportedRanges(_origin, upgradeBudget = DEFAULT_PRIMARY_POLICY.upgradeBudget) {
  const origin = new Date(_origin);
  const major = new Date(origin);
  const minor = new Date(origin);
  const patch = new Date(origin);

  major.setMonth(origin.getMonth() - upgradeBudget.major * MONTHS_IN_QTR);
  minor.setMonth(origin.getMonth() - upgradeBudget.minor * MONTHS_IN_QTR);
  patch.setMonth(origin.getMonth() - upgradeBudget.patch * MONTHS_IN_QTR);

  return [
    {
      type: 'major',
      name: `major version must be within ${upgradeBudget.major * MONTHS_IN_QTR} months of latest`,
      date: major,
    },
    {
      type: 'minor',
      name: `minor version must be within ${upgradeBudget.minor * MONTHS_IN_QTR} months of latest`,
      date: minor,
    },
    {
      type: 'patch',
      name: `patch version must be within ${upgradeBudget.patch * MONTHS_IN_QTR} months of latest`,
      date: patch,
    },
  ];
}

function roundToEndOfQuarter(date) {
  return moment(date)
    .endOf('quarter')
    .add({
      minutes: moment().utcOffset(),
    })
    .toDate();
}

module.exports.deprecationDates = deprecationDates;
/**
 * calculates the major, minor and patch version deprecation dates for the given release date
 * if release occurred at the end of quarter, add a padding of one quarter.
 * @param {Date} _release : release date of next version
 * @param {Object} upgradeBudget : The budget object
 * @param {Integer} eoqPaddingInWeeks : Padding in number of weeks before expiration date is rolled
 * over to the next quarter.
 */
function deprecationDates(
  _release,
  upgradeBudget = DEFAULT_PRIMARY_POLICY.upgradeBudget,
  eoqPaddingInWeeks = 0,
) {
  const release = new Date(_release);
  const major = new Date(release);
  const minor = new Date(release);
  const patch = new Date(release);
  const padding = eoqPaddingInWeeks;
  major.setMonth(release.getMonth() + upgradeBudget.major * MONTHS_IN_QTR);
  if (padding) {
    major.setMonth(major.getMonth() + padding);
  }
  minor.setMonth(release.getMonth() + upgradeBudget.minor * MONTHS_IN_QTR + padding);
  patch.setMonth(release.getMonth() + upgradeBudget.patch * MONTHS_IN_QTR + padding);

  return {
    major: roundToEndOfQuarter(major),
    minor: roundToEndOfQuarter(minor),
    patch: roundToEndOfQuarter(patch),
    prerelease: roundToEndOfQuarter(major),
    premajor: roundToEndOfQuarter(major),
    preminor: roundToEndOfQuarter(minor),
    prepatch: roundToEndOfQuarter(patch),
  };
}

module.exports.findNextVersionReleaseDate = findNextVersionReleaseDate;
/**
 * finds the next version release date wrt the type of violation.
 * @param {string} _version: current installed version in the project.
 * @param {object} info information received from the artifactory
 * @param {'major'|'minor'|'patch'} type type of violation with current vs latest
 */
function findNextVersionReleaseDate(_version, info, type) {
  let allRelease = info.time;
  let versionArray = Object.keys(allRelease);
  versionArray = versionArray.filter(version => semver.valid(version));
  semver.sort(versionArray);
  let indexCurrent = versionArray.indexOf(_version);
  let currentParsed = semver.parse(_version);
  let nextVersion = _version;
  for (let i = indexCurrent + 1; i < versionArray.length; i++) {
    let version = semver.parse(versionArray[i]);
    if (semver.diff(versionArray[i], currentParsed) === type) {
      nextVersion = version;
      break;
    }
  }
  return new Date(allRelease[nextVersion]);
}

module.exports.supported = supported;
function supported(
  info,
  packageName,
  policies,
  _today,
  effectiveReleaseDate,
  upgradeBudget,
  ignorePrereleases,
) {
  const { version } = parsePackageName(packageName);

  // TODO: if there is not latest, then return unsupported with caused relate to the lack of it being published: "pre-release"
  const latestVersion = semver.parse(getLatest(info, ignorePrereleases));

  const semverCoerce = semver.coerce(version);
  const parsed = semver.parse(semverCoerce);
  let supportedData = { isSupported: true };
  let today = _today || new Date();
  let diffType = semver.diff(parsed, latestVersion);
  if (semver.compare(parsed, latestVersion) < 0 && diffType) {
    // deprecation for the current used version start when version next to is released not always when latest is released.
    // Ex: if version 2.0.0 is being currently being used, and the latest is 4.0.0, the deprecation of the 2.0.0 starts when 3.0.0 is released.
    let releaseDate = effectiveReleaseDate || findNextVersionReleaseDate(version, info, diffType);
    let deprecationPolicyDates = deprecationDates(releaseDate, upgradeBudget);
    const result = dateDiff(deprecationPolicyDates[diffType], today);
    if (isNaN(result)) {
      throw new Error(
        `Invalid Date: ${deprecationPolicyDates[diffType]} - ${today}, name: ${info.name}`,
      );
    }

    if (result <= 0) {
      let policy = policies.filter(_policy => _policy.type === diffType);
      if (policy.length !== 1) {
        throw new Error(
          `Unable to determine latest vs current version diff for ${packageName}: (${parsed}, ${latestVersion}) = ${diffType}`,
        );
      }
      return {
        isSupported: false,
        message: `violated: ${policy[0].name}`,
        duration: Math.abs(result),
        type: diffType,
        deprecationDate: deprecationPolicyDates[diffType].toISOString(),
      };
    } else if (isExpiringSoon(result)) {
      return {
        isSupported: true,
        duration: result,
        type: diffType,
        deprecationDate: deprecationPolicyDates[diffType].toISOString(),
      };
    }
  }
  return supportedData;
}

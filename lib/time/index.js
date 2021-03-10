'use strict';

// TODO: refactor this file
const parsePackageName = require('parse-package-name');
const semver = require('semver');
const { isExpiringSoon, dateDiff, getLatest } = require('../util');
const moment = require('moment');
module.exports.supportedRanges = supportedRanges;

const EOQ = ['31 March', '30 June', '30 Sept', '31 Dec'];

function supportedRanges(_origin) {
  const origin = new Date(_origin);
  const major = new Date(origin);
  const minor = new Date(origin);
  const patch = new Date(origin);

  major.setFullYear(origin.getFullYear() - 1);
  minor.setMonth(origin.getMonth() - 6);
  patch.setMonth(origin.getMonth() - 3);

  return [
    {
      type: 'major',
      name: 'major version must be within 1 year of latest',
      date: major,
    },
    {
      type: 'minor',
      name: 'minor version must be within 6 months of latest',
      date: minor,
    },
    {
      type: 'patch',
      name: 'patch version must be within 3 months of latest',
      date: patch,
    },
  ];
}

module.exports.deprecationDates = deprecationDates;
/**
 * calculates the major, minor and patch version deprecation dates for the given release date
 * if release occured at the end of quarter, add a padding of one quarter.
 * @param {Date} _release : release date of next version
 */
function deprecationDates(_release) {
  const release = new Date(_release);
  const major = new Date(release);
  const minor = new Date(release);
  const patch = new Date(release);
  const releaseYear = release.getFullYear();
  let padding = 0;
  const isEOQ = EOQ.some(halfDate => {
    let endOfQuarter = moment(new Date(`${halfDate} ${releaseYear}`));
    let twoWeeksBefore = moment(new Date(`${halfDate} ${releaseYear}`)).subtract(14, 'd');
    let releaseDate = moment(release);
    return releaseDate.isBefore(endOfQuarter) && releaseDate.isAfter(twoWeeksBefore);
  });
  // if new version is released at the end of quarter do not count next quarter.
  if (isEOQ) {
    padding = 3;
  }
  major.setFullYear(release.getFullYear() + 1);
  if (padding) {
    major.setMonth(major.getMonth() + padding);
  }
  minor.setMonth(release.getMonth() + 6 + padding);
  patch.setMonth(release.getMonth() + 3 + padding);

  return {
    major,
    minor,
    patch,
  };
}

module.exports.findDeprecationDate = findDeprecationDate;
/**
 * finds the next version release date wrt the type of violation.
 * @param {string} _version: current installed version in the project.
 * @param {object} info information recieved from the artifactory
 * @param {'major'|'minor'|'patch'} type type of violation with current vs latest
 */
function findDeprecationDate(_version, info, type) {
  let allRelease = info.time;
  let versionArray = Object.keys(allRelease);
  versionArray = versionArray.filter(version => semver.valid(version));
  semver.sort(versionArray);
  let indexCurrent = versionArray.indexOf(_version);
  let currentParsed = semver.parse(_version);
  let nextVersion = '';
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
function supported(info, packageName, policies, _today) {
  const { version } = parsePackageName(packageName);

  // TODO: if there is not latest, then return unsupported with caused relate to the lack of it being published: "pre-release"
  const latestVersion = semver.parse(getLatest(info));

  const parsed = semver.parse(version);
  let supportedData = { isSupported: true };
  let today = _today || new Date();
  let diffType = semver.diff(parsed, latestVersion);
  if (diffType) {
    // deprecation for the current used version start when version next to is released not always when latest is released.
    // Ex: if version 2.0.0 is being currently being used, and the latest is 4.0.0, the deprecation of the 2.0.0 starts when 3.0.0 is released.
    let deprecationDate = findDeprecationDate(version, info, diffType);
    let deprecationPolicyDates = deprecationDates(deprecationDate);
    const result = dateDiff(deprecationPolicyDates[diffType], today);
    if (isNaN(result)) {
      throw new Error(`Invalid Date: ${deprecationDates(deprecationDate)[diffType]} - ${today}`);
    }

    if (result <= 0) {
      let policy = policies.filter(_policy => _policy.type === diffType);
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

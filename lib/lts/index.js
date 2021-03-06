'use strict';

const NODE_LTS = require('./node-lts.json');
const EMBER_LTS = require('./ember-lts.json');
const { isExpiringSoon, dateDiff } = require('../util');

function sortByMinor(a, b) {
  return a.minor - b.minor;
}
/* [ ] current latest minor
 * [x] LTS
 * [ ] fix publish at cool
 */
const semver = require('semver');
module.exports.isConsideredVersion = isConsideredVersion;
function isConsideredVersion(potentialVersion) {
  const parsed = semver.parse(potentialVersion);
  if (parsed !== null && typeof parsed === 'object') {
    // pre-release and build variants are by default not supported
    return parsed.prerelease.length === 0 && parsed.build.length === 0;
  } else {
    return false;
  }
}

module.exports.ltsVersions = ltsVersions;
function ltsVersions(_time, currentDate) {
  if (arguments.length !== 2) {
    throw new TypeError('ltsVersions(time, currentDate) requires exactly two arguments');
  }
  const groupedByMajor = Object.create(null);
  const intermediate = [];
  const time = Object.create(null);
  for (const version of Object.keys(_time)) {
    if (isConsideredVersion(version)) {
      time[version] = _time[version];
    }
  }

  for (const version of Object.keys(time).sort(semver.compare)) {
    const { major, minor } = semver.parse(version);

    if (!(major in groupedByMajor)) {
      groupedByMajor[major] = [];
    }

    const current = groupedByMajor[major];

    // grab the first minor for each major, as it it's published date
    // will be part of what is considered when we decide if it's an LTS
    // or not.
    const entry = current.find(entry => entry.minor === minor);
    if (entry) {
      entry.latestVersion = version;
    } else {
      current.push({
        minor,
        version,
        ltsBeginsAt: new Date(time[version]),
        latestVersion: version,
      });
    }
  }

  for (const major of Object.keys(groupedByMajor).sort()) {
    const versions = groupedByMajor[major];
    // in-place sort each groupedByMajor list by it's entries minor version
    versions.sort(sortByMinor);

    // grab every fourth minor per major, but skipping the first of a major
    // (1.0.0 is skipped, 1.4.0 is the first LTS etc)
    for (let i = 4; i < versions.length; i += 4) {
      intermediate.push(versions[i]);
    }
  }

  // grab the last minor before every major, as it may be considered for LTS
  for (const version of Object.keys(groupedByMajor).sort().slice(0, -1)) {
    const versions = groupedByMajor[version];
    intermediate.push(versions[versions.length - 1]);
  }

  // every four minor versions
  // last minor, before major
  // max-age 54 weeks
  return intermediate
    .sort((a, b) => semver.compare(a.version, b.version))
    .map(({ ltsBeginsAt, version, latestVersion }) => ({
      ltsBeginsAt,
      version,
      latestVersion,
    }))
    .filter(({ ltsBeginsAt }) => {
      // ensure no LTS is older then 54 days

      // calculate the end of support
      const endOfSupport = new Date(ltsBeginsAt);
      endOfSupport.setDate(endOfSupport.getDate() + 54 * 7);

      // ensure the current date is within the support window
      return ltsBeginsAt <= currentDate && currentDate <= endOfSupport;
    });
}

/**
 *
 * @param {LTS version} latestLts
 * Returns current LTS version of all available LTS versions.
 * throws error if the list is not updated with latest LTS version
 * Throw is essential if static json file is not updated for long time
 * this error will let consumer of this module report the issue.
 */
function getCurrentLts(ltsList, packageName, _currentDate) {
  let latestLts = '';
  const today = _currentDate || new Date();
  Object.keys(ltsList).forEach(version => {
    const versionInfo = ltsList[version];
    if (
      new Date(versionInfo.start_date) <= today &&
      today <= new Date(versionInfo.end_date) &&
      new Date(versionInfo.maintenance_start_date) >= today
    ) {
      latestLts = versionInfo.versionRange;
    }
  });
  if (!latestLts) {
    throw new Error(
      `Please create PR to update lts ${packageName}-lts.json file in lts/ folder or create an issue in supported project`,
    );
  }
  return latestLts;
}

module.exports.isLtsOrLatest = isLtsOrLatest;
/**
 *
 * @param {object} info information about the package.
 * @param {string} resolvedVersion resolved version in the project
 * @param {Date} currentDate this used for testing purpose
 *
 * return support policy check result.
 */
function isLtsOrLatest(info, resolvedVersion, currentDate /* this used for testing purpose */) {
  let ltsList = NODE_LTS;
  let isSupported = true;
  let packageName = 'node';
  let message = '';
  let duration = 0;

  const today = currentDate || new Date();
  if (info.type == 'node') {
    // Check when there is no node version could be found in package.json.
    // In future we can consider execa('node -v') and get the version
    if (resolvedVersion === '0.0.0') {
      isSupported = true;
      message = `No node version mentioned in the package.json. Please add engines/volta`;
    } else {
      isSupported = Object.keys(ltsList).some(version => {
        const data = ltsList[version];
        const versionRange = data.versionRange;
        if (semver.intersects(versionRange, resolvedVersion)) {
          if (new Date(data.start_date) <= today && today <= new Date(data.end_date)) {
            const isMaintenanceLts = new Date(data.maintenance_start_date) <= today;
            if (isMaintenanceLts) {
              message = 'Using maintenance LTS. Update to latest LTS';
              duration = dateDiff(new Date(data.end_date), today);
            }
            return true;
          }
        }
      });
    }
  } else {
    ltsList = EMBER_LTS;
    packageName = 'ember-cli';
    isSupported = Object.keys(ltsList).some(version => {
      const data = ltsList[version];
      const versionRange = data.versionRange;
      // if maintenance version is in the list of ember LTS then do not match semver.gtr.
      // We discourage people from using 3.18 when 3.20 is active LTS and 3.16 is maintenance.
      const isMaintenanceLts = new Date(data.maintenance_start_date) <= today;

      if (
        semver.satisfies(resolvedVersion, versionRange) ||
        (!isMaintenanceLts && semver.gtr(resolvedVersion, versionRange))
      ) {
        if (isMaintenanceLts) {
          message = 'Using maintenance LTS. Update to latest LTS';
          duration = dateDiff(new Date(data.end_date), today);
        }
        return true;
      }
    });
  }

  if (isSupported) {
    const returnVal = {
      isSupported: true,
      resolvedVersion,
      latestVersion: getCurrentLts(ltsList, packageName, currentDate),
    };

    if (isExpiringSoon(duration)) {
      returnVal['duration'] = duration;
      returnVal['message'] = message;
    }

    if (!duration && message) {
      returnVal['message'] = message;
    }

    return returnVal;
  } else {
    let version = '';
    Object.keys(ltsList).some(key => {
      const data = ltsList[key];
      if (
        new Date(data.start_date) <= today &&
        today <= new Date(data.end_date) &&
        today <= new Date(data.maintenance_start_date)
      ) {
        version = key;
        duration = dateDiff(today, new Date(data.start_date));
        return true;
      }
    });

    return {
      isSupported: false,
      message: `${packageName} needs to be on v${version} or above LTS version`,
      duration,
      type: info.type == 'node' ? 'node' : 'ember',
    };
  }
}

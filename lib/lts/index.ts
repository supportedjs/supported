'use strict';

/* @ts-expect-error @rehearsal TODO TS2732: Cannot find module './node-lts.json'. Consider using '--resolveJsonModule' to import module with '.json' extension. */
    import NODE_LTS from './node-lts.json';
/* @ts-expect-error @rehearsal TODO TS2732: Cannot find module './ember-lts.json'. Consider using '--resolveJsonModule' to import module with '.json' extension. */
    import EMBER_LTS from './ember-lts.json';
    import { isExpiringSoon, dateDiff } from '../util';

function sortByMinor(a: { minor: number; }, b: { minor: number; }): number  {
  return a.minor - b.minor;
}
/* [ ] current latest minor
 * [x] LTS
 * [ ] fix publish at cool
 */
    import semver from 'semver';
    import semverMinVersion from 'semver/ranges/min-version';
    import { info } from 'console';
module.exports.isConsideredVersion = isConsideredVersion;
function isConsideredVersion(potentialVersion: string | semver.SemVer | null | undefined): boolean  {
  const parsed = semver.parse(potentialVersion);
  if (parsed !== null && typeof parsed === 'object') {
    // pre-release and build variants are by default not supported
    return parsed.prerelease.length === 0 && parsed.build.length === 0;
  } else {
    return false;
  }
}

module.exports.ltsVersions = ltsVersions;
/* @ts-expect-error @rehearsal TODO TS7006: Parameter '_time' implicitly has an 'any' type. */
function ltsVersions(_time, currentDate: number) {
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
/* @ts-expect-error @rehearsal TODO TS2339: Property 'major' does not exist on type 'SemVer | null'. */
    const { major, minor } = semver.parse(version);

    if (!(major in groupedByMajor)) {
      groupedByMajor[major] = [];
    }

    const current = groupedByMajor[major];

    // grab the first minor for each major, as it it's published date
    // will be part of what is considered when we decide if it's an LTS
    // or not.
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'entry' implicitly has an 'any' type. */
    const entry = current.find((entry) => entry.minor === minor);
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
/* @ts-expect-error @rehearsal TODO TS2365: Operator '<=' cannot be applied to types 'number' and 'Date'. */
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
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'ltsList' implicitly has an 'any' type. */
function getCurrentLts(ltsList, groupName: string, _currentDate: Date): string  {
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
      `Please create PR to update lts ${groupName}-lts.json file in lts/ folder or create an issue in supported project`,
    );
  }
  return latestLts;
}

module.exports.isLtsOrLatest = isLtsOrLatest;
/**
 *
 * @param {object} info information about the package.
 * @param {string} resolvedVersion resolved version in the project
 * @param {Date} currentDate optional parameter used to adjust the current date
 *
 * return support policy check result.
 */
/* @ts-expect-error @rehearsal TODO TS2371: A parameter initializer is only allowed in a function or constructor implementation. */
export function isLtsOrLatest(_info: { type: string; name: string; }, _resolvedVersion: string, _currentDate: Date = new Date()): { isSupported: boolean; res...  {
  let ltsList = NODE_LTS;
  let isSupported = true;
  let message = '';
  let duration = 0;
  let deprecationDate = 0;

/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'currentDate'. */
  const today = currentDate || new Date();
/* @ts-expect-error @rehearsal TODO TS2339: Property 'type' does not exist on type '(message?: any, ...optionalParams: any[]) => void'. */
  if (info.type == 'node') {
    // Check when there is no node version could be found in package.json.
    // In future we can consider execa('node -v') and get the version
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'resolvedVersion'. */
    if (resolvedVersion === '0.0.0') {
      isSupported = true;
      message = `No node version mentioned in the package.json. Please add engines/volta`;
    } else {
      isSupported = Object.keys(ltsList).some(version => {
        const data = ltsList[version];
        const versionRange = data.versionRange;
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'resolvedVersion'. */
        if (semver.intersects(versionRange, resolvedVersion)) {
          if (new Date(data.start_date) <= today && today <= new Date(data.end_date)) {
            const isMaintenanceLts = new Date(data.maintenance_start_date) <= today;
            if (isMaintenanceLts) {
              message = 'Using maintenance LTS. Update to latest LTS';
              duration = dateDiff(new Date(data.end_date), today);
              deprecationDate = data.end_date;
            }
            return true;
          }
        }
      });
    }
  } else {
    ltsList = EMBER_LTS;
    isSupported = Object.keys(ltsList).some(version => {
      const data = ltsList[version];
      const versionRange = data.versionRange;
      // if maintenance version is in the list of ember LTS then do not match semver.gtr.
      // We discourage people from using 3.18 when 3.20 is active LTS and 3.16 is maintenance.
      const isMaintenanceLts = new Date(data.maintenance_start_date) <= today;

      if (
        new Date(data.end_date) > today &&
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'resolvedVersion'. */
        (semver.satisfies(resolvedVersion, versionRange) ||
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'resolvedVersion'. */
          (!isMaintenanceLts && semver.gtr(resolvedVersion, versionRange)))
      ) {
        if (isMaintenanceLts) {
          message = 'Using maintenance LTS. Update to latest LTS';
          duration = dateDiff(new Date(data.end_date), today);
          deprecationDate = data.end_date;
        }
        return true;
      }
    });
  }

  if (isSupported) {
    const returnVal = {
      isSupported: true,
/* @ts-expect-error @rehearsal TODO TS18004: No value exists in scope for the shorthand property 'resolvedVersion'. Either declare one or provide an initializer. */
      resolvedVersion,
/* @ts-expect-error @rehearsal TODO TS2339: Property 'type' does not exist on type '(message?: any, ...optionalParams: any[]) => void'. */
      latestVersion: getCurrentLts(ltsList, info.type, currentDate),
    };

    if (isExpiringSoon(duration)) {
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type '"duration"' can't be used to index type '{ isSupported: boolean; resolvedVersion: any; latestVersion: string; }'..  Property 'duration' does not exist on type '{ isSupported: boolean; resolvedVersion: any; latestVersion: string; }'. */
      returnVal['duration'] = duration;
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type '"deprecationDate"' can't be used to index type '{ isSupported: boolean; resolvedVersion: any; latestVersion: string; }'..  Property 'deprecationDate' does not exist on type '{ isSupported: boolean; resolvedVersion: any; latestVersion: string; }'. */
      returnVal['deprecationDate'] = deprecationDate;
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type '"message"' can't be used to index type '{ isSupported: boolean; resolvedVersion: any; latestVersion: string; }'..  Property 'message' does not exist on type '{ isSupported: boolean; resolvedVersion: any; latestVersion: string; }'. */
      returnVal['message'] = message;
    }

    if (!duration && message) {
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type '"message"' can't be used to index type '{ isSupported: boolean; resolvedVersion: any; latestVersion: string; }'..  Property 'message' does not exist on type '{ isSupported: boolean; resolvedVersion: any; latestVersion: string; }'. */
      returnVal['message'] = message;
    }

    return returnVal;
  } else {
    // Run for the side effect of throwing if LTS config is not up to date
/* @ts-expect-error @rehearsal TODO TS2339: Property 'type' does not exist on type '(message?: any, ...optionalParams: any[]) => void'. */
    getCurrentLts(ltsList, info.type, currentDate);

    const ltsKeys = Object.keys(ltsList);
    // Find the version that should be used

    // Find the LTS range that is currently being used OR the previous LTS version range
    // if the used version is not part of an LTS range.
    const usedOrPreviousLts =
      ltsKeys.find(key => {
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'resolvedVersion'. */
        if (semver.intersects(key, resolvedVersion)) {
          return true;
        }
      }) ||
      ltsKeys.reverse().find(version => {
/* @ts-expect-error @rehearsal TODO TS2531: Object is possibly 'null'. */
        if (semver.lt(semverMinVersion(version).raw, semverMinVersion(resolvedVersion).raw)) {
          return true;
        }
      });

    const usedOrPreviousLtsInfo = {};

    if (ltsList[usedOrPreviousLts]) {
      const deprecationDate = ltsList[usedOrPreviousLts].end_date;
/* @ts-expect-error @rehearsal TODO TS2339: Property 'duration' does not exist on type '{}'. */
      usedOrPreviousLtsInfo.duration = dateDiff(new Date(deprecationDate), today);
/* @ts-expect-error @rehearsal TODO TS2339: Property 'deprecationDate' does not exist on type '{}'. */
      usedOrPreviousLtsInfo.deprecationDate = deprecationDate;
    }



    return {
      isSupported: false,
      message: `${packageName} needs to be on v${requiredVersion} or a more recent LTS version. See ${ltsGroupInfo.doc}`,
      duration,
      deprecationDate,
      type: info.type == 'node' ? 'node' : 'ember',
    };
  }
}

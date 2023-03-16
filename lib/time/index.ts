'use strict';

// TODO: refactor this file
    import { parse as parsePackageName } from 'parse-package-name';
    import semver from 'semver';
/* @ts-expect-error @rehearsal TODO TS2305: Module '"../util"' has no exported member 'DEFAULT_PRIMARY_POLICY'. */
    import { isExpiringSoon, dateDiff, getLatest, DEFAULT_PRIMARY_POLICY } from '../util';
    import moment from 'moment';
    import { info } from 'console';
module.exports.supportedRanges = supportedRanges;

const MONTHS_IN_QTR = 3;

// TODO: Should check if we should remove this function as we are using deprecationDates function for the calculation
/* @ts-expect-error @rehearsal TODO TS2552: Cannot find name 'strin'. Did you mean 'string'? */
export function supportedRanges(_origin: string | number | Date, upgradeBudget = DEFAULT_PRIMARY_POLICY.upgradeBudget): { type: string; name: strin...  {
  const origin = new Date(_origin);
  const major = new Date(origin);
  const minor = new Date(origin);
  const patch = new Date(origin);

  major.setMonth(origin.getMonth() - upgradeBudget.major * MONTHS_IN_QTR);
  minor.setMonth(origin.getMonth() - upgradeBudget.minor * MONTHS_IN_QTR);
  patch.setMonth(origin.getMonth() - upgradeBudget.patch * MONTHS_IN_QTR);

/* @ts-expect-error @rehearsal TODO TS2739: Type '{ type: string; name: string; date: Date; }[]' is missing the following properties from type '{ type: string; name: strin; }': type, name */
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

function roundToEndOfQuarter(date: moment.MomentInput): Date  {
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
  _release: Date,
  upgradeBudget = DEFAULT_PRIMARY_POLICY.upgradeBudget,
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'Integer'. */
  eoqPaddingInWeeks: Integer = 0,
): { major: Date; minor: Date;...  {
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
/* @ts-expect-error @rehearsal TODO TS2322: Type 'major: Date; minor: Date; patch: Date; prerelease: Date; premajor: Date; preminor: Date; prepatch: Date' is being returned or assigned, but type 'major: Date; minor: Date' is expected. Please convert type 'major: Date; minor: Date; patch: Date; prerelease: Date; premajor: Date; preminor: Date; prepatch: Date' to type 'major: Date; minor: Date', or return or assign a variable of type 'major: Date; minor: Date' */
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
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'info' implicitly has an 'any' type. */
function findNextVersionReleaseDate(_version: string, info, type: 'major' | 'minor' | 'patch'): Date  {
  let allRelease = info.time;
  let versionArray = Object.keys(allRelease);
  versionArray = versionArray.filter(version => semver.valid(version));
  semver.sort(versionArray);
  let indexCurrent = versionArray.indexOf(_version);
  let currentParsed = semver.parse(_version);
  let nextVersion = _version;
  for (let i = indexCurrent + 1; i < versionArray.length; i++) {
    let version = semver.parse(versionArray[i]);
/* @ts-expect-error @rehearsal TODO TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string | SemVer'. Consider verifying both types, using type assertion: '(versionArray[i] as string)', or using type guard: 'if (versionArray[i] instanceof string) { ... }'. */
    if (semver.diff(versionArray[i], currentParsed) === type) {
/* @ts-expect-error @rehearsal TODO TS2322: The variable 'nextVersion' has type 'string', but 'SemVer | null' is assigned. Please convert 'SemVer | null' to 'string' or change variable's type. */
      nextVersion = version;
      break;
    }
  }
  return new Date(allRelease[nextVersion]);
}

module.exports.supported = supported;
export function supported(
/* @ts-expect-error @rehearsal TODO TS7006: Parameter '_info' implicitly has an 'any' type. */
  _info,
  _packageName: string,
/* @ts-expect-error @rehearsal TODO TS2552: Cannot find name 'strin'. Did you mean 'string'? */
  _policies: { type: string; name: strin; },
  _today: Date,
  _effectiveReleaseDate: Date,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter '_upgradeBudget' implicitly has an 'any' type. */
  _upgradeBudget,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter '_ignorePrereleases' implicitly has an 'any' type. */
  _ignorePrereleases,
/* @ts-expect-error @rehearsal TODO TS4060: Return type of exported function has or is using private name ''. */
): { isSupported: boolean; } |...  {
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'packageName'. */
  const { version } = parsePackageName(packageName);

  // TODO: if there is not latest, then return unsupported with caused relate to the lack of it being published: "pre-release"
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'ignorePrereleases'. */
  const latestVersion = semver.parse(getLatest(info, ignorePrereleases));

  const semverCoerce = semver.coerce(version);
  const parsed = semver.parse(semverCoerce);
/* @ts-expect-error @rehearsal TODO TS2552: Cannot find name '_today'. Did you mean 'today'? */
  let today = _today || new Date();
/* @ts-expect-error @rehearsal TODO TS2345: Argument of type 'SemVer | null' is not assignable to parameter of type 'string | SemVer'. Consider verifying both types, using type assertion: '(parsed as string)', or using type guard: 'if (parsed instanceof string) { ... }'. */
  let diffType = semver.diff(parsed, latestVersion);
/* @ts-expect-error @rehearsal TODO TS2345: Argument of type 'SemVer | null' is not assignable to parameter of type 'string | SemVer'. Consider verifying both types, using type assertion: '(parsed as string)', or using type guard: 'if (parsed instanceof string) { ... }'. */
  if (semver.compare(parsed, latestVersion) < 0 && diffType) {
    // deprecation for the current used version start when version next to is released not always when latest is released.
    // Ex: if version 2.0.0 is being currently being used, and the latest is 4.0.0, the deprecation of the 2.0.0 starts when 3.0.0 is released.
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'effectiveReleaseDate'. */
    let releaseDate = effectiveReleaseDate || findNextVersionReleaseDate(version, info, diffType);
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'upgradeBudget'. */
    let deprecationPolicyDates = deprecationDates(releaseDate, upgradeBudget);
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type 'ReleaseType' can't be used to index type '{ major: Date; minor: Date; }'..  Property 'patch' does not exist on type '{ major: Date; minor: Date; }'. */
    const result = dateDiff(deprecationPolicyDates[diffType], today);
    if (isNaN(result)) {
      throw new Error(
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type 'ReleaseType' can't be used to index type '{ major: Date; minor: Date; }'..  Property 'patch' does not exist on type '{ major: Date; minor: Date; }'. */
        `Invalid Date: ${deprecationPolicyDates[diffType]} - ${today}, name: ${info.name}`,
      );
    }

    if (result <= 0) {
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'policies'. */
      let policy = policies.filter((_policy: { type: string | null; }): { type: string | null; } => _policy.type === diffType);
      if (policy.length !== 1) {
        throw new Error(
/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'packageName'. */
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

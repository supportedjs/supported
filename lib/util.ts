'use strict';

    import fs from 'fs';
    import chalk from 'chalk';
    import moment from 'moment';
    import { readFileSync } from 'fs';
    import { join } from 'path';
    import semver from 'semver';

// 91 days in a quarter, 24hrs per day, 60 minutes per hour, 60 seconds per hour, 1000 milliseconds per sec
export const MS_IN_QTR = 91 * 24 * 60 * 60 * 1000;
exports.MS_IN_QTR = MS_IN_QTR;

// Default policy for evaluating semVer
module.exports.DEFAULT_PRIMARY_POLICY = {
  upgradeBudget: {
    major: 4,
    minor: 2,
    patch: 1,
  },
  ignoredDependencies: [],
};

// expiring soon if the package expires within 4 qtrs
const THRESHOLD_QTRS = 5;

/**
 *
 * @param {int}  timeDiff duration between latest version and resolved version release date
 * @returns {boolean} true/false
 */
module.exports.isExpiringSoon = isExpiringSoon;
export function isExpiringSoon(timeDiff: number): boolean | 0  {
  return timeDiff && Math.ceil(timeDiff / MS_IN_QTR) < THRESHOLD_QTRS;
}

module.exports.dateDiff = dateDiff;
export function dateDiff(a: moment.MomentInput, b: moment.MomentInput): number  {
  const utc1 = moment.utc(a);
  const utc2 = moment.utc(b);

  return utc1.diff(utc2);
}

const LTS_MAP = {
  node: {
    packages: ['node'],
    doc: 'https://nodejs.org/en/about/releases/',
  },
  ember: {
    packages: ['ember-cli', 'ember-source'],
    doc: 'https://emberjs.com/releases/lts/',
  },
};
type LTSGroupName = keyof typeof LTS_MAP;
module.exports.LTS_MAP = LTS_MAP;

module.exports.isLtsPackage = function isLtsPackage(packageName: string, ltsGroupName: LTSGroupName) {
  const groupNames: LTSGroupName[] = ltsGroupName ? [ltsGroupName] : (Object.keys(LTS_MAP) as LTSGroupName[]);
  return groupNames.some(groupName => {
    return LTS_MAP[groupName].packages.includes(packageName);
  });
};

function ltsPackageGroupName(packageName: string): LTSGroupName | undefined  {
  return (Object.keys(LTS_MAP) as LTSGroupName[]).find(groupName => {
    return LTS_MAP[groupName].packages.includes(packageName);
  });
}
module.exports.ltsPackageGroupName = ltsPackageGroupName;

export function ltsPackageGroupInfo(packageName: string) {
  const groupName = ltsPackageGroupName(packageName);
  return groupName && LTS_MAP[groupName];
}
module.exports.ltsPackageGroupInfo = ltsPackageGroupInfo;

export type NpmPackage = {
  'dist-tags': {
    latest: string;
    [key: string]: string;
  };
  versions: {
    [key: string]: {
      name: string;
      description: string;
      version: string;
      author: string;
      repository: {
        [key: string]: number | string;
      };
      volta: {
        node: string;
      };
      dependencies: {
        [key: string]: string;
      };
      devDependencies: {
        [key: string]: string;
      };
      license: string;
      scripts: {
        [key: string]: string;
      };
      _id: string;
      dist: {
        [key: string]: number | string;
      };
      'lint-staged': {
        [key: string]: string[];
      };
      'pre-commit': {
        [key: string]: string[];
      };
      ava: {
        [key: string]: boolean | string[];
      };
    };
  };
}

/**
 * Return the latest version string, ignoring pre-releases.
 * @param {InfoObject} info information about package received from the npm registry
 * @param {Boolean} ignorePrereleases if true, ignore prepatch, preminor, and prereleases
 */
module.exports.getLatest = getLatest;

export function getLatest(info: NpmPackage, ignorePrereleases: boolean) {
  const taggedLatest = info['dist-tags'].latest;
  if (!ignorePrereleases || semver.parse(taggedLatest)?.prerelease.length === 0) {
    return taggedLatest;
  } else {
    const latestNonPrerelease = Object.keys(info.versions)
      .filter(version => {
        return semver.parse(version)?.prerelease.length === 0;
      })
      .sort((a, b) => {
        return semver.compare(a, b);
      })
      .pop();
    // If every version is a prerelease, return the prerelease
    return latestNonPrerelease || info['dist-tags'].latest;
  }
}

/**
 * Sorts library in the following order
 * - unsupported at the top
 *   Within which order is,
 *     ii. major at the top
 *     iii. minor
 *     iiii. patch
 *   When there is a conflict largest duration takes precedence
 *   second level of conflict resolution is done using localCompare when duration is not present
 * - Expiring soon at the second
 *    Within which order is,
 *      i. expiring soon at the top
 *      ii. major, minor, patch takes precedence
 * - supported at the last
 *      i. localeCompare
 *
 * @param {packageInfo} a
 * @param {packageInfo} b
 */
module.exports.sortLibraries = sortLibraries;
export function sortLibraries(a: { isSupported: number; duration: number; name: string; type: string; }, b: { isSupported: number; duration: number; name: string; type: string; }): number  {
  if (a.isSupported && b.isSupported) {
    //sort expiring soon to the top
    if (a.duration && b.duration) {
      return a.duration - b.duration;
    } else if (a.duration) {
      return -1;
    } else if (b.duration) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  } else if (a.isSupported || b.isSupported) {
    return a.isSupported - b.isSupported;
  }
  if (a.type === b.type) {
    return b.duration - a.duration;
  }
  return a.type.localeCompare(b.type);
}

module.exports.ProgressLogger = class ProgressLogger {
  spinner: { prefixText: string; text: string; };
    totalPackages: number;
    processedCount: number;
    semVerLogged: boolean;
    isMultipleProduct: boolean;
    ignoredPackages: number;
  constructor(_spinner = { prefixText: '', text: '' }, _isMultipleProduct = false) {
    this.spinner = _spinner;
    this.totalPackages = 0; // start from `1` as we have node policy tested all the time
    this.processedCount = 0;
    this.semVerLogged = false;
    this.isMultipleProduct = _isMultipleProduct;
    this.ignoredPackages = 0;
  }

  getLoggerPrefixText(name: string, isSupported: boolean, isExpiringSoon: boolean): string  {
    if (isSupported && isExpiringSoon) {
      return chalk`{yellow ⚠} ${name} Policy\n`;
    }
    if (isSupported) {
      return chalk`{green ✓} ${name} Policy\n`;
    }
    return chalk`{red ✗} ${name} Policy\n`;
  }

  logAppAuditProgress(name: string, isSupported: boolean, isExpiringSoon: boolean): string  {
    if (isSupported && isExpiringSoon) {
      return chalk`{yellow ⚠} ${name}\n`;
    }
    if (isSupported) {
      return chalk`{green ✓} ${name}\n`;
    }
    return chalk`{red ✗} ${name}\n`;
  }

  updateTotalDepCount(count: number): void  {
    this.totalPackages += count;
  }

  updateIgnoredDepCount(count: number): void  {
    this.ignoredPackages = count;
  }

  updateSpinner(name: string, isSupported: boolean, isExpiringSoon: boolean): void  {
    if (name && !this.isMultipleProduct) {
      if (!this.spinner.prefixText) {
        this.spinner.prefixText = '';
      }
      let ltsGroupName;
      if (name === 'SemVer' && !this.semVerLogged) {
        this.semVerLogged = true;
        this.spinner.prefixText += this.getLoggerPrefixText(name, isSupported, isExpiringSoon);
      } else if ((ltsGroupName = ltsPackageGroupName(name))) {
        this.spinner.prefixText += this.getLoggerPrefixText(
          `${ltsGroupName} LTS`,
          isSupported,
          isExpiringSoon,
        );
      }
    }
    this.spinner.text = `Total Dependencies: ${this.totalPackages}, Verified: ${
      this.processedCount
    }, Remaining: ${this.totalPackages - this.processedCount - this.ignoredPackages}, Ignored: ${
      this.ignoredPackages
    }`;
    if (this.totalPackages > this.processedCount) {
      this.processedCount++;
    }
  }

  updatePrefixTextForMultipleProject(name: string, isSupported: boolean, isExpiringSoon: boolean): void  {
    if (this.isMultipleProduct) {
      if (!this.spinner.prefixText) {
        this.spinner.prefixText = '';
      }
      this.spinner.prefixText += this.logAppAuditProgress(name, isSupported, isExpiringSoon);
    }
  }
};

module.exports.checkNodeCompatibility = checkNodeCompatibility;
export function checkNodeCompatibility(_nodeVersion: string): void  {
  const nodeVersion = _nodeVersion || process.versions.node;
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  if (!semver.satisfies(nodeVersion, packageJson.engines.node)) {
    throw new Error(
      chalk`{red Node v${nodeVersion} found, which does not satisfy the required version range: v${packageJson.engines.node}. Please update the node version.}`,
    );
  }
}

    import parseDuration from 'parse-duration';
/*
 *
 * convert a string representing a date into an actual date
 * supports anything new Date(maybeDate) supports
 *
 * supports anything `parse-duration` supports:
 *   -30 days === the date 30 days ago
 */
module.exports.processDate = processDate;
export function processDate(inputDate: string | number | Date): Date | undefined  {
  if (typeof inputDate !== 'string') {
    return;
  }
  if (inputDate === '') {
    return;
  }
  const date = new Date(inputDate);
  if (isNaN(date.valueOf())) {
    // failed to parse the date normally, let's try parse-duration. As it gives
    // us the ability to allow a micro-syntax for dates such as `-30days` or `-5years`
    const parsed = parseDuration(inputDate, 'ms');
    if (parsed === null) {
      // unable to parse
      throw new Error(`[Supported] could not parse date='${date}'`);
    } else {
      const result = new Date(Date.now() + parsed);
      if (isNaN(result.valueOf())) {
        return undefined;
      } else {
        return result;
      }
    }
    //
  } else {
    // able to parse date normally, use that date
    return date;
  }
};

function isError(obj: unknown): obj is Error & { code: string } {
  return !!(obj as Error).name && !!(obj as Error & { code: string }).code;
}

/*
 *
 * Provide the logic to handle `supported` both with a list of project directories and without.
 *
 * The algorithm is more or less:
 *
 * If a list of directories is used, each directory will be considered a project.
 * If no directory is provided, and the CWD contains a valid looking
 * package.json, we assume the user wants to run supported in CWD.
 *
 */
module.exports.handleInput = function (input, cwd) {
  if (input.length === 0) {
    try {
      JSON.parse(fs.readFileSync(`${cwd}/package.json`, 'utf8'));
      // if the cwd contains a JSON file named `package.json` so we assume the
      // user wanted to run the command on the current directory
      return ['.'];
    } catch (e) {
      if (
        e !== null &&
        typeof e === 'object' && isError(e) && 
        (e.code === 'ENOENT' || e.name === 'SyntaxError')
      ) {
        // no package.json exists at that location as a readable json file, so we
        // are should instead display our help dialog.
        return [];
      }
      throw e; // not sure what happened, let's rethrow
    }
  } else {
    return input;
  }
};

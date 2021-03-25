'use strict';

const fs = require('fs');
const chalk = require('chalk');
const moment = require('moment');
const { readFileSync } = require('fs');
const { join } = require('path');
const semver = require('semver');

// 91 days in a quarter, 24hrs per day, 60 minutes per hour, 60 seconds per hour, 1000 milliseconds per sec
const MS_IN_QTR = 91 * 24 * 60 * 60 * 1000;
exports.MS_IN_QTR = MS_IN_QTR;

// expiring soon if the package expires within 4 qtrs
const THRESHOLD_QTRS = 5;

// github url constants
const RAW_CONTENT_HOST = 'raw.githubusercontent.com';
const GITHUB_PRIVATE = 'githubprivate';
const GITHUB = 'github.com';
const MISSING_TOKEN = chalk`{red Private instances of github needs token. To generate token follow https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token}`;

/**
 *
 * @param {int}  timeDiff duration between latest version and resolved version release date
 * @returns {boolean} true/false
 */
module.exports.isExpiringSoon = isExpiringSoon;
function isExpiringSoon(timeDiff) {
  return timeDiff && Math.ceil(timeDiff / MS_IN_QTR) < THRESHOLD_QTRS;
}

module.exports.dateDiff = dateDiff;
function dateDiff(a, b) {
  const utc1 = moment.utc(a);
  const utc2 = moment.utc(b);

  return utc1.diff(utc2);
}

/**
 *
 * @param {InfoObject} info information about package received from the npm registry
 */
module.exports.getLatest = getLatest;
function getLatest(info) {
  return info['dist-tags'].latest;
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
function sortLibraries(a, b) {
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
  constructor(_spinner = { prefixText: '', text: '' }, _isMultipleProduct) {
    this.spinner = _spinner;
    this.totalPackages = 0; // start from `1` as we have node policy tested all the time
    this.processedCount = 0;
    this.semVerLogged = false;
    this.isMultipleProduct = _isMultipleProduct;
  }

  getLoggerPrefixText(name, isSupported, isExpiringSoon) {
    if (isSupported && isExpiringSoon) {
      return chalk`{yellow ⚠} ${name} Policy\n`;
    }
    if (isSupported) {
      return chalk`{green ✓} ${name} Policy\n`;
    }
    return chalk`{red ✗} ${name} Policy\n`;
  }

  logAppAuditProgress(name, isSupported, isExpiringSoon) {
    if (isSupported && isExpiringSoon) {
      return chalk`{yellow ⚠} ${name}\n`;
    }
    if (isSupported) {
      return chalk`{green ✓} ${name}\n`;
    }
    return chalk`{red ✗} ${name}\n`;
  }

  updateTotalDepCount(count) {
    this.totalPackages += count;
  }

  updateSpinner(name, isSupported, isExpiringSoon) {
    if (name && !this.isMultipleProduct) {
      if (!this.spinner.prefixText) {
        this.spinner.prefixText = '';
      }
      if (name === 'SemVer' && !this.semVerLogged) {
        this.semVerLogged = true;
        this.spinner.prefixText += this.getLoggerPrefixText(name, isSupported, isExpiringSoon);
      } else if (name === 'ember-cli' || name === 'node') {
        this.spinner.prefixText += this.getLoggerPrefixText(
          name === 'ember-cli' ? 'ember LTS' : 'node LTS',
          isSupported,
          isExpiringSoon,
        );
      }
    }
    this.spinner.text = `Total Dependencies: ${this.totalPackages}, Verified: ${
      this.processedCount
    }, Remaining: ${this.totalPackages - this.processedCount}`;
    if (this.totalPackages > this.processedCount) {
      this.processedCount++;
    }
  }

  updatePrefixTextForMultipleProject(name, isSupported, isExpiringSoon) {
    if (this.isMultipleProduct) {
      if (!this.spinner.prefixText) {
        this.spinner.prefixText = '';
      }
      this.spinner.prefixText += this.logAppAuditProgress(name, isSupported, isExpiringSoon);
    }
  }
};

module.exports.checkNodeCompatibility = checkNodeCompatibility;
function checkNodeCompatibility(_nodeVersion) {
  const nodeVersion = _nodeVersion || process.versions.node;
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  if (!semver.satisfies(nodeVersion, packageJson.engines.node)) {
    throw new Error(
      chalk`{red Node v${nodeVersion} found, which does not satisfy the required version range: v${packageJson.engines.node}. Please update the node version.}`,
    );
  }
}

const parseDuration = require('parse-duration');
/*
 *
 * convert a string representing a date into an actual date
 * supports anything new Date(maybeDate) supports
 *
 * supports anything `parse-duration` supports:
 *   -30 days === the date 30 days ago
 */
module.exports.processDate = function processDate(inputDate) {
  if (typeof inputDate !== 'string') {
    return;
  }
  if (inputDate === '') {
    return;
  }
  const date = new Date(inputDate);
  if (isNaN(date)) {
    // failed to parse the date normally, let's try parse-duration. As it gives
    // us the ability to allow a micro-syntax for dates such as `-30days` or `-5years`
    const parsed = parseDuration(inputDate, 'ms');
    if (parsed === null) {
      // unable to parse
      throw new Error(`[Supported] could not parse date='${date}'`);
    } else {
      const result = new Date(Date.now() + parsed);
      if (isNaN(result)) {
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
      JSON.parse(fs.readFileSync(`${cwd}/package.json`, 'UTF-8'));
      // if the cwd contains a JSON file named `package.json` so we assume the
      // user wanted to run the command on the current directory
      return ['.'];
    } catch (e) {
      if (
        e !== null &&
        typeof e === 'object' &&
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

/**
 * Generates the fetch URL to get package.json and other required files.
 */
module.exports.getFetchUrl = function(_url, options = {}) {
  let { token, hostUrl } = options;
  _url = hostUrl || _url;
  _url += _url.endsWith('/') ? '' : '/';
  if (hostUrl) {
    return _url;
  }
  let url = new URL(_url);
  let branch = url.pathname.indexOf('/tree/');
  let hostname = url.hostname;
  let pathname = url.pathname;
  if (hostname.includes(GITHUB)) {
    hostname = RAW_CONTENT_HOST;
    if (branch == -1) {
      pathname += 'main/';
    }
  } else if (hostname.includes(GITHUB_PRIVATE)) {
    if (!token) {
      throw new Error(MISSING_TOKEN);
    }
    hostname = `${token}@raw.${hostname}`;
    if (branch == -1) {
      pathname += 'master/';
    }
  }
  if (branch !== -1) {
    pathname = pathname.replace('/tree/', '/');
  }
  let currentURL = url.toString();
  currentURL = currentURL.replace(url.hostname, hostname);
  currentURL = currentURL.replace(url.pathname, pathname);
  currentURL += currentURL.endsWith('/') ? '' : '/';
  return currentURL;
}

/**
 * Returns true if the given list of input has private instance, and token is provided.
 */
module.exports.inputHasGithubPrivate = function(flags, input) {
  input = Array.isArray(input) ? input : [input];
  let isPrivate = input.some(inputUrl => {
    return inputUrl.includes(GITHUB_PRIVATE);
  });
  if (isPrivate && !flags.token) {
    console.log(MISSING_TOKEN);
  }
  return isPrivate;
}

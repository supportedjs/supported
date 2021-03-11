'use strict';

const chalk = require('chalk');
const moment = require('moment');

// 91 days in a quarter, 24hrs per day, 60 minutes per hour, 60 seconds per hour, 1000 millseconds per sec
const MILLSINQUARTER = 91 * 24 * 60 * 60 * 1000;

// expiring soon if the package expires within 4 qtrs
const THRESHOLDQTRS = 5;

/**
 *
 * @param {int}  timeDiff duration between latest version and resolved version release date
 * @returns {boolean} true/false
 */
function isExpiringSoon(timeDiff) {
  return timeDiff && Math.ceil(timeDiff / MILLSINQUARTER) < THRESHOLDQTRS;
}

function dateDiff(a, b) {
  const utc1 = moment.utc(a);
  const utc2 = moment.utc(b);

  return utc1.diff(utc2);
}

/**
 *
 * @param {InfoObject} info information about package recived from the npm registry
 */
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
 *   When there is a conflict largest duration takes precedance
 *   second level of conflict resolution is done using localCompare when duration is not present
 * - Expiring soon at the second
 *    Within which order is,
 *      i. expring soon at the top
 *      ii. major, minor, patch takes precedence
 * - supported at the last
 *      i. localeCompare
 *
 * @param {packageInfo} a
 * @param {packageInfo} b
 */
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

class ProgressLogger {
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
    this.spinner.text = `Total Dependecies: ${this.totalPackages}, Verified: ${
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
}

module.exports = {
  isExpiringSoon,
  MILLSINQUARTER,
  sortLibraries,
  dateDiff,
  getLatest,
  ProgressLogger,
};

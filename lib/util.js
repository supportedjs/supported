'use strict';

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

module.exports = {
  isExpiringSoon,
  MILLSINQUARTER,
  sortLibraries,
  dateDiff,
};

'use strict';

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

module.exports = {
  isExpiringSoon,
  MILLSINQUARTER,
};

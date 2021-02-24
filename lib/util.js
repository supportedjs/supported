'use strict';

const MILLSINQUARTER = 91 * 24 * 60 * 60 * 1000;
const THRESHOLDQTRS = 5;
function isExpiringSoon(timeDiff) {
  return timeDiff && Math.ceil(timeDiff / MILLSINQUARTER) < THRESHOLDQTRS;
}

module.exports = {
  isExpiringSoon,
  MILLSINQUARTER,
};

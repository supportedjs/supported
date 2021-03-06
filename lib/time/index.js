'use strict';

// TODO: refactor this file
const parsePackageName = require('parse-package-name');
const semver = require('semver');
const { isExpiringSoon, dateDiff } = require('../util');
module.exports.supportedRanges = supportedRanges;

const POLICY_TYPES = ['major', 'minor', 'patch'];
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

function getDate(time, version, message) {
  const result = time[version];

  if (version in time) {
    return new Date(result);
  } else {
    throw new Error(message);
  }
}

module.exports.supported = supported;
function supported(info, packageName, policies) {
  const { name, version } = parsePackageName(packageName);

  // TODO: if there is no published time, then return unsupported with cause related to lack of being published: "pre-release"
  const current = getDate(
    info.time,
    version,
    `${name}'s version: [${version}] has no published time`,
  );

  // TODO: if there is not latest, then return unsupported with caused relate to the lack of it being published: "pre-release"
  const latestVersion = semver.parse(info['dist-tags'].latest);

  const parsed = semver.parse(version);
  let expiresSoonDuration = 0;
  let type = '';
  for (const policy of policies) {
    if (POLICY_TYPES.includes(policy.type) === false) {
      throw new Error(`Unknown Policy: '${policy.type}' for ${JSON.stringify(policy)}`);
    }
    if (parsed[policy.type] === latestVersion[policy.type]) {
      continue;
    }

    const result = dateDiff(current, policy.date);
    if (isNaN(result)) {
      throw new Error(`Invalid Date: ${current} - ${policy.date}`);
    }

    if (result <= 0) {
      let duration = Math.abs(result);
      return {
        isSupported: false,
        message: `violated: ${policy.name}`,
        duration,
        type: policy.type,
      };
    } else {
      expiresSoonDuration = result;
      type = policy.type;
      break;
    }
  }
  if (isExpiringSoon(expiresSoonDuration)) {
    return {
      isSupported: true,
      duration: expiresSoonDuration,
      type,
    };
  }
  return { isSupported: true };
}

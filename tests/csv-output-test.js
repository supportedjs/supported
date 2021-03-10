'use strict';

const { expect } = require('chai');
const { writeToCsv } = require('../lib/output/csv-output');

describe('csv', function () {
  it('supported project', function () {
    let supportResult = {
      projectName: 'example',
      isInSupportWindow: true,
      supportChecks: [
        {
          isSupported: true,
          latestVersion: '4.8.5',
          name: 'rsvp',
          resolvedVersion: '4.8.5',
        },
        {
          isSupported: true,
          name: 'node',
          resolvedVersion: '15.3.0',
          latestVersion: '>=14.*',
          message: '',
        },
      ],
    };
    let result = writeToCsv(supportResult);
    expect(result).to.includes(`✓ Congrats!
    Your project is using only supported versions of libraries. No action is required.`);
  });
  it('unsupported project', function () {
    let supportResult = {
      projectName: 'example',
      isInSupportWindow: false,
      supportChecks: [
        {
          isSupported: false,
          latestVersion: '4.8.5',
          name: 'rsvp',
          resolvedVersion: '4.5.5',
        },
        {
          isSupported: true,
          name: 'node',
          resolvedVersion: '15.3.0',
          latestVersion: '>=14.*',
          message: '',
        },
      ],
    };
    let result = writeToCsv(supportResult);
    expect(result).to.includes(`Support Policy Problem Detected!
    Please upgrade your dependencies!
    Your project is not within the support policy window because of outdated dependencies.`);
  });
});

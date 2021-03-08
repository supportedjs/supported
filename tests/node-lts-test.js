'use strict';

const { expect } = require('chai');
const { isLtsOrLatest } = require('../lib/lts/index');
const NODE_LTS = require('../lib/lts/node-lts.json');

describe('node LTS Policy based policy', function () {
  /*
   *
   * Major Node.js versions enter Current release status for six months, which
   * gives library authors time to add support for them. After six months,
   * odd-numbered releases (9, 11, etc.) become unsupported, and even-numbered
   * releases (10, 12, etc.) move to Active LTS status and are ready for general
   * use. LTS release status is "long-term support", which typically guarantees
   * that critical bugs will be fixed for a total of 30 months. Production
   * applications should only use Active LTS or Maintenance LTS releases.
   */
  // Rules to implement:
  // * odd versions are supported for 6 months
  // * even versions are supported for 30 months
  // * exceptions are possible, and dates may be adjusted. Will need to implement "exceptions"
  //
  // all node versions + dates can be found programmatically at https://nodejs.org/download/release/index.json
  // We may choose to bundle the above, just-incase an environment does not have HTTP access.
  // This bundling will require this package be released regularly, but that may just be a cost of doing business
  function ltsVersions(/*versions, currentDate*/) {
    return [];
  }

  it('works', function () {
    expect(ltsVersions([{}], new Date())).to.eql([]);
    expect(ltsVersions([{}], new Date('2020-12-02'))).to.eql([]);
  });

  describe('validates node versions', function () {
    it('node version with range', function () {
      let currentDate = new Date(`2021-02-24T00:00:00.000Z`);
      expect(isLtsOrLatest({ type: 'node' }, '10.* || 12.* || 14.* || >= 15', currentDate)).to.eql({
        isSupported: true,
        duration: 5616000000,
        message: 'Using maintenance LTS. Update to latest LTS',
        resolvedVersion: '10.* || 12.* || 14.* || >= 15',
        latestVersion: '>=14.*',
      });
    });

    it('node version with above current LTS range', function () {
      expect(isLtsOrLatest({ type: 'node' }, '15.3.0')).to.eql({
        isSupported: true,
        latestVersion: '>=14.*',
        resolvedVersion: '15.3.0',
      });
    });

    it('node version with fixed value in current LTS range', function () {
      expect(isLtsOrLatest({ type: 'node' }, '14.3.0')).to.eql({
        isSupported: true,
        latestVersion: '>=14.*',
        resolvedVersion: '14.3.0',
      });
    });

    it('node version with below and in support range value', function () {
      let currentDate = new Date(`2021-02-24T00:00:00.000Z`);
      expect(isLtsOrLatest({ type: 'node' }, '8.* || 10.*', currentDate)).to.eql({
        isSupported: true,
        duration: 5616000000,
        message: 'Using maintenance LTS. Update to latest LTS',
        latestVersion: '>=14.*',
        resolvedVersion: '8.* || 10.*',
      });
    });

    it('node version with fixed value below LTS range', function () {
      const fakeToday = new Date(`2021-02-22T00:00:00.000Z`);
      expect(isLtsOrLatest({ type: 'node' }, '8.0.0', fakeToday)).to.eql({
        isSupported: false,
        duration: 10195200000,
        message: `node needs to be on v14.* or above LTS version`,
        type: 'node',
      });
    });

    it('node version with range value below LTS', function () {
      const fakeToday = new Date(`2021-02-22T00:00:00.000Z`);
      expect(isLtsOrLatest({ type: 'node' }, '6.* || 8.*', fakeToday)).to.eql({
        isSupported: false,
        duration: 10195200000,
        message: `node needs to be on v14.* or above LTS version`,
        type: 'node',
      });
    });

    it('node version invalid after end of LTS date', function () {
      const lastDay = new Date(NODE_LTS['10.*'].end_date);
      const nextDay = new Date(lastDay);
      nextDay.setDate(nextDay.getDate() + 1);
      expect(isLtsOrLatest({ type: 'node' }, '10.2.0', nextDay)).to.eql({
        isSupported: false,
        duration: 16070400000,
        message: `node needs to be on v14.* or above LTS version`,
        type: 'node',
      });
    });

    it('node version is valid till last day', function () {
      const lastDay = new Date(NODE_LTS['10.*'].end_date);
      expect(isLtsOrLatest({ type: 'node' }, '10.2.0', lastDay)).to.eql({
        isSupported: true,
        message: 'Using maintenance LTS. Update to latest LTS',
        resolvedVersion: '10.2.0',
        latestVersion: '>=14.*',
      });
    });

    it('node version not found', function () {
      expect(isLtsOrLatest({ type: 'node' }, '0.0.0')).to.eql({
        isSupported: true,
        message: `No node version mentioned in the package.json. Please add engines/volta`,
        latestVersion: '>=14.*',
        resolvedVersion: '0.0.0',
      });
    });
  });

  it.skip('considers odd versions supported for 6 months', function () {
    const v15_3_0_date = new Date('2020-11-24');
    const currentDate = new Date('2020-11-24');

    expect(
      ltsVersions(
        [
          {
            version: 'v15.3.0',
            date: v15_3_0_date,
          },
        ],
        currentDate,
      ),
    ).to.eql([{ version: 'v15.3.0', date: v15_3_0_date }]);

    const exactlySixMonths = new Date(currentDate);
    exactlySixMonths.setMonth(exactlySixMonths.getMonth() + 6);

    expect(
      ltsVersions(
        [
          {
            version: 'v15.3.0',
            date: v15_3_0_date,
          },
        ],
        exactlySixMonths,
      ),
    ).to.eql([{ version: 'v15.3.0', date: v15_3_0_date }]);

    const sixMonthAndOneDay = new Date(currentDate);
    sixMonthAndOneDay.setMonth(sixMonthAndOneDay.getMonth() + 6);
    sixMonthAndOneDay.setDay(sixMonthAndOneDay.getDay() + 1);

    expect(
      ltsVersions(
        [
          {
            version: 'v15.3.0',
            date: v15_3_0_date,
          },
        ],
        exactlySixMonths,
      ),
    ).to.eql([]);
  });
});

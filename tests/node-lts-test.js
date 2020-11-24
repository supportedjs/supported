'use strict';

const { expect } = require('chai');
describe('node LTS based policy', function () {
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

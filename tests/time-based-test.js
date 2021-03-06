'use strict';

const chai = require('chai');
const { expect } = chai;
const fs = require('fs');
const { supported, supportedRanges } = require('../lib/time/index');

chai.use(require('chai-datetime'));

describe('time based policy: 1 year for major, 6 months for minor, 3 months of patch.', function () {
  it('supported ranges', function () {
    const origin = new Date('1986-09-16');
    const result = supportedRanges(origin);

    expect(result.map(x => x.name)).to.eql([
      'major version must be within 1 year of latest',
      'minor version must be within 6 months of latest',
      'patch version must be within 3 months of latest',
    ]);

    expect(result[0].date).to.equalDate(new Date('1985-09-16'), 'major expects 1 year range');
    expect(result[1].date).to.equalDate(new Date('1986-03-16'), 'minor expects 6 month range');
    expect(result[2].date).to.equalDate(new Date('1986-06-16'), 'patch expects 3 month range');
  });

  it('returns true in simple case', function () {
    expect(
      supported(
        {
          version: '1.0.0',
          time: {
            '1.0.0': 'never',
          },
          'dist-tags': {
            latest: '1.0.0',
          },
        },
        'example@1.0.0',
        [],
      ),
    ).to.eql({ isSupported: true });
  });

  it('throws if latest version has no published time', function () {
    expect(() =>
      supported(
        {
          version: '1.0.0',
          time: {},
        },
        'example@1.0.0',
        [],
      ),
    ).to.throw("example's version: [1.0.0] has no published time");
  });

  it('throws useful error version has no published time', function () {
    expect(() =>
      supported(
        {
          version: '1.0.0',
          time: {},
        },
        'example@3.22.0',
        [],
      ),
    ).to.throw("example's version: [3.22.0] has no published time");
  });

  it('returns true, when no policies are provide but versions have been published', function () {
    expect(
      supported(
        {
          version: '1.0.0',
          time: {
            '1.0.0': new Date().toJSON(),
          },
          'dist-tags': {
            latest: '1.0.0',
          },
        },
        'example@1.0.0',
        [],
      ),
    ).to.eql({ isSupported: true });
  });

  it('returns false, when a constraint is violated', function () {
    expect(
      supported(
        {
          version: '2.0.0',
          time: {
            '2.0.0': new Date('1986-09-16').toJSON(),
            '1.0.0': new Date('1985-09-15').toJSON(),
          },
          'dist-tags': {
            latest: '2.0.0',
          },
        },
        'example@1.0.0',
        [
          {
            type: 'major',
            name: '1 year window',
            date: new Date('1985-09-16'),
          },
        ],
      ),
    ).to.eql({
      duration: 86400000,
      isSupported: false,
      message: 'violated: 1 year window',
      type: 'major',
    });
  });

  it('test console-ui', function () {
    const info = JSON.parse(
      fs.readFileSync(`${__dirname}/fixtures/recordings/default/console-ui.json`, 'UTF8'),
    );
    const policies = supportedRanges(info.time[info.version]);

    expect(supported(info, 'console-ui@3.1.2', policies)).to.eql({ isSupported: true });
    let result = supported(info, 'console-ui@3.1.0', policies);
    expect(typeof result.duration).to.eql('number');
    delete result.duration;
    expect(result).to.eql({
      isSupported: false,
      message: 'violated: patch version must be within 3 months of latest',
      type: 'patch',
    });
    result = supported(info, 'console-ui@2.0.0', policies);
    expect(typeof result.duration).to.eql('number');
    delete result.duration;
    expect(result).to.eql({
      isSupported: false,
      message: 'violated: major version must be within 1 year of latest',
      type: 'major',
    });
  });

  it('test ember-cli', function () {
    const info = JSON.parse(
      fs.readFileSync(`${__dirname}/fixtures/recordings/default/ember-cli.json`, 'UTF8'),
    );
    const policies = supportedRanges(info.time[info.version]);

    expect(supported(info, 'ember-cli@3.22.0', policies)).to.eql({ isSupported: true });
    expect(supported(info, 'ember-cli@3.21.0', policies)).to.eql({
      duration: 11840496435,
      isSupported: true,
      type: 'minor',
    });
    expect(supported(info, 'ember-cli@3.20.0', policies)).to.eql({
      duration: 8756624607,
      isSupported: true,
      type: 'minor',
    });
    expect(supported(info, 'ember-cli@3.12.1', policies)).to.eql({
      duration: 11061239038,
      isSupported: false,
      message: 'violated: minor version must be within 6 months of latest',
      type: 'minor',
    });
    expect(supported(info, 'ember-cli@3.13.2', policies)).to.eql({
      duration: 13308317989,
      isSupported: false,
      message: 'violated: minor version must be within 6 months of latest',
      type: 'minor',
    });
    expect(supported(info, 'ember-cli@3.13.1', policies)).to.eql({
      duration: 17517994037,
      isSupported: false,
      message: 'violated: minor version must be within 6 months of latest',
      type: 'minor',
    });
    expect(supported(info, 'ember-cli@3.4.0', policies)).to.eql({
      duration: 50945222713,
      isSupported: false,
      message: 'violated: minor version must be within 6 months of latest',
      type: 'minor',
    });

    expect(() => supported(info, 'ember-cli@^3.0.0', policies)).to.throw(
      'version: [^3.0.0] has no published time',
    );
    expect(() => supported(info, 'ember-cli@3.0.x', policies)).to.throw(
      'version: [3.0.x] has no published time',
    );
    expect(() => supported(info, 'ember-cli@^2.0.0', policies)).to.throw(
      'version: [^2.0.0] has no published time',
    );
    expect(() => supported(info, 'ember-cli@1.0.0', policies)).to.throw(
      'version: [1.0.0] has no published time',
    );
  });
});

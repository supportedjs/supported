'use strict';

const chai = require('chai');
const { expect } = chai;
const {
  sortLibraries,
  checkNodeCompatibility,
  handleInput,
  getFetchUrl,
  inputHasGithubPrivate,
} = require('../lib/util');

chai.use(require('chai-datetime'));

describe('util test', function () {
  describe('sort packages', function () {
    it('sorts unsupported to top', function () {
      let input = [
        {
          isSupported: true,
          duration: 11,
          name: 'test1',
          type: 'major',
        },
        {
          isSupported: true,
          name: 'test2',
        },
        {
          isSupported: true,
          duration: 10,
          name: 'test3',
          type: 'minor',
        },
        {
          isSupported: false,
          duration: 10,
          name: 'test4',
          type: 'minor',
        },
        {
          isSupported: false,
          duration: 5,
          name: 'test5',
          type: 'minor',
        },
        {
          isSupported: true,
          name: 'test6',
        },
        {
          isSupported: false,
          duration: 5,
          name: 'test7',
          type: 'major',
        },
        {
          isSupported: true,
          duration: 7,
          name: 'test7',
          type: 'minor',
        },
      ];
      let result = [
        {
          isSupported: false,
          duration: 5,
          name: 'test7',
          type: 'major',
        },
        {
          isSupported: false,
          duration: 10,
          name: 'test4',
          type: 'minor',
        },
        {
          isSupported: false,
          duration: 5,
          name: 'test5',
          type: 'minor',
        },
        {
          isSupported: true,
          duration: 7,
          name: 'test7',
          type: 'minor',
        },
        {
          isSupported: true,
          duration: 10,
          name: 'test3',
          type: 'minor',
        },
        {
          isSupported: true,
          duration: 11,
          name: 'test1',
          type: 'major',
        },
        {
          isSupported: true,
          name: 'test2',
        },
        {
          isSupported: true,
          name: 'test6',
        },
      ];

      expect(input.sort(sortLibraries)).to.be.eql(result);
    });
  });

  describe('checkNodeCompatibility', function () {
    it(`throws error when node version is equal to 8.*`, function () {
      let regex = new RegExp(
        `Node v8.10.1 found, which does not satisfy the required version range: v10.* || 12.* || 14.* || >= 15. Please updated the node version.`,
      );
      expect(() => {
        checkNodeCompatibility('8.10.1');
      }).throws(regex);
    });

    it(`throws error when node version is below 8.*`, function () {
      let regex = new RegExp(
        `Node v7.10.1 found, which does not satisfy the required version range: v10.* || 12.* || 14.* || >= 15. Please updated the node version.`,
      );
      expect(() => {
        checkNodeCompatibility('7.10.1');
      }).throws(regex);
    });

    it(`do nothing when node is above 8.*`, function () {
      checkNodeCompatibility('10.1.1');
    });
  });

  describe('processDate', function () {
    const { processDate } = require('../lib/util');

    it('handles reasonable potential date inputs', function () {
      expect(processDate()).to.eql(undefined);
      expect(processDate(1)).to.eql(undefined);
      expect(processDate(new Date())).to.eql(undefined);
      expect(processDate('1 day')).to.be.instanceof(Date);
      expect(processDate('-1 day')).to.be.instanceof(Date);
      expect(processDate('Sept 16, 1986')).to.be.instanceof(Date);
      expect(() => processDate('EWUT')).to.throw(/could not parse date/);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(processDate('1 day')).to.equalDate(tomorrow);
      expect(processDate('-1 day')).to.equalDate(yesterday);
      expect(processDate('Sept 16, 1986')).to.equalDate(new Date('Sept 16, 1986'));
    });
  });

  describe('handleInput', function () {
    it('return the correct set of paths for various cli inputs', function () {
      expect(handleInput([], `${__dirname}/../`)).to.eql(['.']);
      expect(handleInput([], `${__dirname}/`)).to.eql([]);
      expect(handleInput([`${__dirname}/fixtures/supported-project/`], `${__dirname}/../`)).to.eql([
        `${__dirname}/fixtures/supported-project/`,
      ]);
      expect(
        handleInput(
          [`${__dirname}/fixtures/supported-project/`, `${__dirname}/fixtures/unsupported-project`],
          `${__dirname}/../`,
        ),
      ).to.eql([
        `${__dirname}/fixtures/supported-project/`,
        `${__dirname}/fixtures/unsupported-project`,
      ]);
    });
  });
  describe('getFetchUrl', function () {
    it('returns hosturl', function () {
      expect(getFetchUrl('test-url.com', { hostUrl: 'localhost:3400' })).to.be.eql(
        'localhost:3400/',
      );
    });
    it('returns github content url', function () {
      expect(getFetchUrl('https://github.com/stefanpenner/supported')).to.be.eql(
        'https://raw.githubusercontent.com/stefanpenner/supported/main/',
      );
    });
    it('returns github content url with given branch', function () {
      expect(
        getFetchUrl('https://github.com/stefanpenner/supported/tree/error-out-node'),
      ).to.be.eql('https://raw.githubusercontent.com/stefanpenner/supported/error-out-node/');
    });
    it('returns github content url private repo', function () {
      expect(
        getFetchUrl('https://test.githubprivate.com/stefanpenner/supported/', { token: 'a1b2c3' }),
      ).to.be.eql('https://a1b2c3@raw.test.githubprivate.com/stefanpenner/supported/master/');
    });
    it('returns github content url private repo with given branch', function () {
      expect(
        getFetchUrl('https://test.githubprivate.com/stefanpenner/supported/tree/error-out-node', {
          token: 'a1b2c3',
        }),
      ).to.be.eql(
        'https://a1b2c3@raw.test.githubprivate.com/stefanpenner/supported/error-out-node/',
      );
    });
    it('errors github content url private repo with no token', function () {
      expect(() => {
        getFetchUrl('https://test.githubprivate.com/stefanpenner/supported/tree/error-out-node');
      }).throws(
        /Private instances of github needs token. To generate token follow https:\/\/docs.github.com\/en\/github\/authenticating-to-github\/creating-a-personal-access-token/,
      );
    });
  });

  describe('inputHasGithubPrivate', function () {
    //setting token to true so that console.log won't appear.
    it('return true if github private instance present', function () {
      expect(
        inputHasGithubPrivate(
          { token: true },
          'https://test.githubprivate.com/stefanpenner/supported/',
        ),
      ).to.be.true;
    });
    it('return false if github private instance present', function () {
      expect(inputHasGithubPrivate({ token: true }, 'https://test.com/stefanpenner/supported/')).to
        .be.false;
    });
    it('return true if github private instance present in multiple inputs', function () {
      expect(
        inputHasGithubPrivate({ token: true }, [
          'https://test.com/stefanpenner/supported/',
          'https://test.githubprivate.com/stefanpenner/supported/',
        ]),
      ).to.be.true;
    });
  });
});

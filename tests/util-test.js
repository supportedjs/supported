'use strict';

const { expect } = require('chai');
const { sortLibraries, checkNodeCompatibility } = require('../lib/util');

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
});

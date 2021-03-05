'use strict';

const { expect } = require('chai');
const { sortLibraries } = require('../lib/util');

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
});

'use strict';

const { expect } = require('chai');
const isInSupportWindow = require('../lib/project');
const registries = require('./registries');

describe('project-1', function () {
  const root = `${__dirname}/fixtures`;

  beforeEach(function () {
    registries.startAll();
  });

  afterEach(function () {
    registries.stopAll();
  });

  it('reports supported if the project is within the support window', async function () {
    const result = await isInSupportWindow(`${root}/supported-project`, {
      policies: [],
    });

    expect(result).to.eql({
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
        {
          isSupported: true,
          latestVersion: '4.2.8',
          name: 'es6-promise',
          resolvedVersion: '4.2.8',
        },
        {
          isSupported: true,
          latestVersion: '1.0.3',
          name: '@stefanpenner/a',
          resolvedVersion: '1.0.3',
        },
        {
          isSupported: true,
          latestVersion: '1.0.4',
          name: '@eslint-ast/eslint-plugin-graphql',
          resolvedVersion: '1.0.4',
        },
      ],
    });
  });

  it('reports NOT supported if the project is NOT within the support window', async function () {
    const result = await isInSupportWindow(`${root}/unsupported-project`, {
      policies: [],
    });

    expect(result).to.eql({
      projectName: 'example',
      isInSupportWindow: false,
      supportChecks: [
        {
          duration: 54431779121,
          isSupported: false,
          latestVersion: '4.2.8',
          message: 'violated: major version must be within 1 year of latest',
          name: 'es6-promise',
          resolvedVersion: '3.3.1',
          type: 'major',
        },
        {
          duration: 27959197042,
          isSupported: false,
          latestVersion: '4.8.5',
          message: 'violated: major version must be within 1 year of latest',
          name: 'rsvp',
          resolvedVersion: '3.6.2',
          type: 'major',
        },
        {
          isSupported: true,
          latestVersion: '>=14.*',
          message: 'Using maintenance LTS. Update to latest LTS',
          name: 'node',
          resolvedVersion: '10.* || 12.* || 14.* || >= 15',
        },
        {
          isSupported: true,
          latestVersion: '1.0.3',
          name: '@stefanpenner/a',
          resolvedVersion: '1.0.3',
        },
        {
          isSupported: true,
          latestVersion: '1.0.4',
          name: '@eslint-ast/eslint-plugin-graphql',
          resolvedVersion: '1.0.4',
        },
      ],
    });
  });

  it('reports no node version mentioned in the project', async function () {
    const result = await isInSupportWindow(`${root}/no-node-version`, {
      policies: [],
    });

    expect(result).to.eql({
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
          latestVersion: '>=14.*',
          message: 'No node version mentioned in the package.json. Please add engines/volta',
          name: 'node',
          resolvedVersion: '0.0.0',
        },
        {
          isSupported: true,
          latestVersion: '4.2.8',
          name: 'es6-promise',
          resolvedVersion: '4.2.8',
        },
        {
          isSupported: true,
          latestVersion: '1.0.3',
          name: '@stefanpenner/a',
          resolvedVersion: '1.0.3',
        },
        {
          isSupported: true,
          latestVersion: '1.0.4',
          name: '@eslint-ast/eslint-plugin-graphql',
          resolvedVersion: '1.0.4',
        },
      ],
    });
  });
});

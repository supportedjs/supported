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
          name: 'rsvp',
          resolvedVersion: '4.8.5',
        },
        {
          isSupported: true,
          name: 'node',
          resolvedVersoon: '15.3.0'
        },
        {
          isSupported: true,
          name: 'es6-promise',
          resolvedVersion: '4.2.8',
        },
        {
          isSupported: true,
          name: '@stefanpenner/a',
          resolvedVersion: '1.0.3',
        },
        {
          isSupported: true,
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
          isSupported: false,
          message: 'violated: major version must be within 1 year of latest',
          name: 'rsvp',
          resolvedVersion: '3.6.2',
        },
        {
          isSupported: true,
          name: 'node',
          message: "Using maintenance LTS. Update to latest LTS",
          resolvedVersoon: '10.* || 12.* || 14.* || >= 15'
        },
        {
          isSupported: false,
          message: 'violated: major version must be within 1 year of latest',
          name: 'es6-promise',
          resolvedVersion: '3.3.1',
        },
        {
          isSupported: true,
          name: '@stefanpenner/a',
          resolvedVersion: '1.0.3',
        },
        {
          isSupported: true,
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
          name: 'rsvp',
          resolvedVersion: '4.8.5',
        },
        {
          isSupported: true,
          name: 'node',
          message: 'No node version mentioned in the package.json. Please add engines/volta',
          resolvedVersoon: '0.0.0'
        },
        {
          isSupported: true,
          name: 'es6-promise',
          resolvedVersion: '4.2.8',
        },
        {
          isSupported: true,
          name: '@stefanpenner/a',
          resolvedVersion: '1.0.3',
        },
        {
          isSupported: true,
          name: '@eslint-ast/eslint-plugin-graphql',
          resolvedVersion: '1.0.4',
        },
      ],
    });
  });
});

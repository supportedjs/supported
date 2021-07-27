'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const isInSupportWindow = require('../lib/project');
const setupProject = require('../lib/project/setup-project');
const { ProgressLogger, DEFAULT_PRIMARY_POLICY } = require('../lib/util');
const registries = require('./test-helpers/registries');

describe('project-1', function () {
  const root = `${__dirname}/fixtures`;

  beforeEach(function () {
    registries.startAll();
  });

  afterEach(function () {
    registries.stopAll();
  });

  it('reports supported if the project is within the support window', async function () {
    const { dependenciesToCheck, pkg } = await setupProject(`${root}/supported-project`);
    const result = await isInSupportWindow(dependenciesToCheck, pkg.name, {
      policies: {
        primary: DEFAULT_PRIMARY_POLICY,
      },
      progressLogger: new ProgressLogger(),
    });

    expect(result).to.eql({
      projectName: 'supported-project',
      isInSupportWindow: true,
      supportChecks: [
        {
          isSupported: true,
          name: '@eslint-ast/eslint-plugin-graphql',
          resolvedVersion: '1.0.4',
          latestVersion: '1.0.4',
        },
        {
          isSupported: true,
          name: '@stefanpenner/a',
          resolvedVersion: '2.0.0',
          latestVersion: '2.0.0',
        },
        {
          isSupported: true,
          name: 'es6-promise',
          resolvedVersion: '4.2.8',
          latestVersion: '4.2.8',
        },
        {
          isSupported: true,
          resolvedVersion: '15.3.0',
          latestVersion: '>=14.*',
          name: 'node',
        },
        {
          isSupported: true,
          name: 'rsvp',
          resolvedVersion: '4.8.5',
          latestVersion: '4.8.5',
        },
      ],
    });
  });

  it('reports NOT supported if the project is NOT within the support window', async function () {
    let spinner = {
      text: '',
    };
    const { dependenciesToCheck, pkg } = await setupProject(`${root}/unsupported-project`);
    const result = await isInSupportWindow(dependenciesToCheck, pkg.name, {
      policies: {
        primary: DEFAULT_PRIMARY_POLICY,
      },
      progressLogger: new ProgressLogger(spinner),
    });
    // purge out the duration from node entry from out
    // because we use `new Date` to calculate the duration
    result.supportChecks.forEach(pkg => {
      if (pkg.duration) {
        expect(pkg.duration).to.be.a('number');
        expect(pkg.deprecationDate).to.be.a('string');
        delete pkg['duration'];
        delete pkg['deprecationDate'];
      }
    });
    expect(spinner.text).to.includes('Total Dependencies');
    expect(result).to.eql({
      projectName: 'unsupported-project',
      isInSupportWindow: false,
      supportChecks: [
        {
          isSupported: false,
          message: 'violated: major version must be within 12 months of latest',
          type: 'major',
          name: 'es6-promise',
          resolvedVersion: '3.3.1',
          latestVersion: '4.2.8',
        },
        {
          isSupported: false,
          latestVersion: '2.0.0',
          message: 'violated: major version must be within 12 months of latest',
          name: '@stefanpenner/a',
          resolvedVersion: '1.0.3',
          type: 'major',
        },
        {
          isSupported: false,
          message: 'violated: major version must be within 12 months of latest',
          type: 'major',
          name: 'rsvp',
          resolvedVersion: '3.6.2',
          latestVersion: '4.8.5',
        },
        {
          isSupported: true,
          resolvedVersion: '10.* || 12.* || 14.* || >= 15',
          latestVersion: '>=14.*',
          message: 'Using maintenance LTS. Update to latest LTS',
          name: 'node',
        },
        {
          isSupported: true,
          name: '@eslint-ast/eslint-plugin-graphql',
          resolvedVersion: '1.0.4',
          latestVersion: '1.0.4',
        },
      ],
    });
  });

  it('reports no node version mentioned in the project', async function () {
    const { dependenciesToCheck, pkg } = await setupProject(`${root}/no-node-version`);
    const result = await isInSupportWindow(dependenciesToCheck, pkg.name, {
      policies: {
        primary: DEFAULT_PRIMARY_POLICY,
      },
      progressLogger: new ProgressLogger(),
    });

    expect(result).to.eql({
      projectName: 'no-node-version',
      isInSupportWindow: true,
      supportChecks: [
        {
          isSupported: true,
          name: '@eslint-ast/eslint-plugin-graphql',
          resolvedVersion: '1.0.4',
          latestVersion: '1.0.4',
        },
        {
          isSupported: true,
          name: '@stefanpenner/a',
          resolvedVersion: '2.0.0',
          latestVersion: '2.0.0',
        },
        {
          isSupported: true,
          name: 'es6-promise',
          resolvedVersion: '4.2.8',
          latestVersion: '4.2.8',
        },
        {
          isSupported: true,
          resolvedVersion: '0.0.0',
          latestVersion: '>=14.*',
          message: 'No node version mentioned in the package.json. Please add engines/volta',
          name: 'node',
        },
        {
          isSupported: true,
          name: 'rsvp',
          resolvedVersion: '4.8.5',
          latestVersion: '4.8.5',
        },
      ],
    });
  });

  it('reports dependencies that are expiring soon in the project', async function () {
    const { dependenciesToCheck, pkg } = await setupProject(`${root}/version-expire-soon`);
    const result = await isInSupportWindow(
      dependenciesToCheck,
      pkg.name,
      {
        policies: {
          primary: DEFAULT_PRIMARY_POLICY,
        },
        progressLogger: new ProgressLogger(),
      },
      new Date('April 10, 2021'),
    );
    // purge out the duration from node entry from out
    // because we use `new Date` to calculate the duration
    result.supportChecks.forEach(pkg => {
      if (pkg.duration) {
        expect(pkg.duration).to.be.a('number');
        expect(pkg.deprecationDate).to.be.a('string');
        delete pkg['duration'];
        delete pkg['deprecationDate'];
      }
    });
    expect(result).to.eql({
      projectName: 'version-expiring-soon',
      isInSupportWindow: true,
      supportChecks: [
        {
          isSupported: true,
          type: 'major',
          name: '@stefanpenner/b',
          resolvedVersion: '1.0.3',
          latestVersion: '2.0.0',
        },
        {
          isSupported: true,
          name: '@eslint-ast/eslint-plugin-graphql',
          resolvedVersion: '1.0.4',
          latestVersion: '1.0.4',
        },
        {
          isSupported: true,
          name: 'es6-promise',
          resolvedVersion: '4.2.8',
          latestVersion: '4.2.8',
        },
        {
          isSupported: true,
          latestVersion: '>=14.*',
          name: 'node',
          resolvedVersion: '14.0.0',
        },
        {
          isSupported: true,
          name: 'rsvp',
          resolvedVersion: '4.8.5',
          latestVersion: '4.8.5',
        },
      ],
    });
  });

  it('reports when node is expiring soon in the project', async function () {
    const { dependenciesToCheck, pkg } = await setupProject(`${root}/node-expire-soon`);
    const result = await isInSupportWindow(
      dependenciesToCheck,
      pkg.name,
      {
        policies: {
          primary: DEFAULT_PRIMARY_POLICY,
        },
        progressLogger: new ProgressLogger(),
      },
      new Date('March 31, 2021'),
    );
    // purge out the duration from node entry from out
    // because we use `new Date` to calculate the duration
    result.supportChecks.forEach(pkg => {
      if (pkg.duration) {
        expect(pkg.duration).to.be.a('number');
        expect(pkg.deprecationDate).to.be.a('string');
        delete pkg['duration'];
        delete pkg['deprecationDate'];
      }
    });
    expect(result).to.eql({
      projectName: 'version-expiring-soon',
      isInSupportWindow: true,
      supportChecks: [
        {
          isSupported: true,
          resolvedVersion: '10.0.0',
          latestVersion: '>=14.*',
          message: 'Using maintenance LTS. Update to latest LTS',
          name: 'node',
        },
        {
          isSupported: true,
          name: '@eslint-ast/eslint-plugin-graphql',
          resolvedVersion: '1.0.4',
          latestVersion: '1.0.4',
        },
        {
          isSupported: true,
          name: '@stefanpenner/b',
          resolvedVersion: '1.0.3',
          latestVersion: '2.0.0',
        },
        {
          isSupported: true,
          name: 'es6-promise',
          resolvedVersion: '4.2.8',
          latestVersion: '4.2.8',
        },
        {
          isSupported: true,
          name: 'rsvp',
          resolvedVersion: '4.8.5',
          latestVersion: '4.8.5',
        },
      ],
    });
  });

  it('throws nice error if provided folder does not include package.json', function () {
    return expect(setupProject(`${root}/invalid-project-folder`)).to.be.rejectedWith(
      /package.json does not exist/,
    );
  });

  it('throws nice error if provided package.json file is invalid', function () {
    return expect(setupProject(`${root}/package-is-not-json`)).to.be.rejectedWith(
      /package.json is not a valid JSON file/,
    );
  });

  it('throws nice error if provided package.json file is not a file', function () {
    return expect(setupProject(`${root}/package-is-folder`)).to.be.rejectedWith(
      /package.json is not a file/,
    );
  });
});

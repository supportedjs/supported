'use strict';

const { expect } = require('chai');
const execa = require('execa');
const { getBinPath } = require('get-bin-path');
const registries = require('./registries');

describe('CLI', function () {
  beforeEach(function () {
    registries.startAll();
  });

  afterEach(function () {
    registries.stopAll();
  });

  it('exits with status code 1 if no arguments are passed', async function () {
    const child = await execa('node', [await getBinPath()], {
      shell: true,
      reject: false,
    });
    expect(child.exitCode).to.eql(1);
    expect(child.stderr).to.eql('');
    expect(child.stdout).to.match(/supported/);
  });

  describe('default output', function () {
    it('works against a fully supported project', async function () {
      const child = await execa('node', [await getBinPath(), `${__dirname}/fixtures/supported-project`], {
        shell: true,
        reject: false,
      });
      expect(child.exitCode).to.eql(0);
      expect(child.stderr).to.eql('- working');
      expect(child.stdout).to.eql('');
    });

    it('works against a unsupported project', async function () {
      const child = await execa('node', [await getBinPath(), `${__dirname}/fixtures/unsupported-project`], {
        shell: true,
        reject: false,
      });
      expect(child.exitCode).to.eql(1);
      expect(child.stderr).to.eql('- working');
      expect(child.stdout).to.eql('');
    });
  });

  describe('--json', function () {
    it('works against a fully supported project', async function () {
      const child = await execa(
        'node',
        [await getBinPath(), `${__dirname}/fixtures/supported-project`, '--json'],
        {
          shell: true,
          reject: false,
        },
      );
      expect(child.exitCode).to.eql(0);
      expect(child.stderr).to.eql('- working');
      expect(JSON.parse(child.stdout)).to.eql({
        isInSupportWindow: true,
        project: {
          name: 'example',
          type: 'node_module',
          path: `${__dirname}/fixtures/supported-project`,
        },
        supportChecks: [
          {
            isSupported: true,
            name: 'rsvp',
            resolvedVersion: '4.8.5',
          },
          {
            isSupported: true,
            name: 'node',
            resolvedVersoon: '15.3.0',
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

    it('works against a unsupported project', async function () {
      const child = await execa(
        'node',
        [await getBinPath(), `${__dirname}/fixtures/unsupported-project`, '--json'],
        {
          shell: true,
          reject: false,
        },
      );
      expect(child.exitCode).to.eql(1);
      expect(child.stderr).to.eql('- working');
      expect(JSON.parse(child.stdout)).to.eql({
        isInSupportWindow: false,
        project: {
          name: 'example',
          path: `${__dirname}/fixtures/unsupported-project`,
          type: 'node_module',
        },
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
            message: 'Using maintenance LTS. Update to latest LTS',
            resolvedVersoon: '10.* || 12.* || 14.* || >= 15',
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
  });
});

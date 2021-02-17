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
      expect(child.stdout).to.includes('Congrats!');
    });

    it('works against a unsupported project', async function () {
      const child = await execa('node', [await getBinPath(), `${__dirname}/fixtures/unsupported-project`], {
        shell: true,
        reject: false,
      });
      expect(child.exitCode).to.eql(1);
      expect(child.stderr).to.eql('- working');
      expect(child.stdout).to.includes('Support Policy Problem Detected!');
      expect(child.stdout).to.includes(
        '✓ node LTS\n    ✗ SemVer (2 of 4)\n      ✗ MAJOR version [2 dependencie(s) 7 qtr(s) behind]',
      );
    });
  });

  describe('--verbose', function () {
    it('works against a unsupported project', async function () {
      const child = await execa(
        await getBinPath(),
        [`${__dirname}/fixtures/unsupported-project`, '--verbose'],
        {
          shell: true,
          reject: false,
        },
      );
      expect(child.exitCode).to.eql(1);
      expect(child.stderr).to.eql('- working');
      expect(child.stdout).to.includes('Support Policy Problem Detected!');
      expect(child.stdout).to.includes(
        '@eslint-ast/eslint-plugin-graphql  1.0.4                          1.0.4',
      );
      expect(child.stdout).to.includes(
        'rsvp                               3.6.2                          4.8.5',
      );
    });

    it('works against a supported project', async function () {
      const child = await execa(
        await getBinPath(),
        [`${__dirname}/fixtures/supported-project`, '-v'],
        {
          shell: true,
          reject: false,
        },
      );
      expect(child.exitCode).to.eql(0);
      expect(child.stderr).to.eql('- working');
      expect(child.stdout).to.includes('Congrats!');
      expect(child.stdout).to.includes('es6-promise');
      expect(child.stdout).to.includes('@eslint-ast/eslint-plugin-graphql');
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
            latestVersion: '4.8.5',
            resolvedVersion: '4.8.5',
          },
          {
            isSupported: true,
            latestVersion: '>=14.*',
            message: '',
            name: 'node',
            resolvedVersion: '15.3.0',
          },
          {
            isSupported: true,
            name: 'es6-promise',
            latestVersion: '4.2.8',
            resolvedVersion: '4.2.8',
          },
          {
            isSupported: true,
            name: '@stefanpenner/a',
            latestVersion: '1.0.3',
            resolvedVersion: '1.0.3',
          },
          {
            isSupported: true,
            name: '@eslint-ast/eslint-plugin-graphql',
            latestVersion: '1.0.4',
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
            duration: 54431779121,
            type: 'major',
            name: 'es6-promise',
            resolvedVersion: '3.3.1',
            latestVersion: '4.2.8',
          },
          {
            isSupported: false,
            message: 'violated: major version must be within 1 year of latest',
            duration: 27959197042,
            type: 'major',
            name: 'rsvp',
            resolvedVersion: '3.6.2',
            latestVersion: '4.8.5',
          },
          {
            isSupported: true,
            message: 'Using maintenance LTS. Update to latest LTS',
            resolvedVersion: '10.* || 12.* || 14.* || >= 15',
            latestVersion: '>=14.*',
            name: 'node',
          },
          {
            isSupported: true,
            name: '@stefanpenner/a',
            resolvedVersion: '1.0.3',
            latestVersion: '1.0.3',
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
  });
});

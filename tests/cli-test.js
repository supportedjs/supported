'use strict';

const { expect } = require('chai');
const execa = require('execa');
const fs = require('fs-extra');
const { getBinPath } = require('get-bin-path');
const registries = require('./registries');

let FILE_LIST = [
  '/supported/index.html',
  '/supported/jput.min.js',
  '/supported/jquery.js',
  '/supported/result.json',
]

describe('CLI', function () {
  beforeEach(function () {
    registries.startAll();
  });

  afterEach(function () {
    registries.stopAll();
  });

  it('exits with status code 1 if no arguments are passed', async function () {
    const child = await execa(await getBinPath(), {
      shell: true,
      reject: false,
    });
    expect(child.exitCode).to.eql(1);
    expect(child.stderr).to.eql('');
    expect(child.stdout).to.match(/supported/);
  });

  function checkFileExists(projectPath) {
    FILE_LIST.forEach((file) => {
      expect(fs.existsSync(`${projectPath}${file}`));
    });
  }

  describe('default output', function () {
    let projectPath = '';
    afterEach(() => {
      if (projectPath) {
        fs.removeSync(`${projectPath}/supported`);
      }
    });

    it('works against a fully supported project', async function () {
      projectPath = `${__dirname}/fixtures/supported-project`;
      const child = await execa(await getBinPath(), [projectPath], {
        shell: true,
        reject: false,
      });
      expect(child.exitCode).to.eql(0);
      expect(child.stderr).to.eql('- working');
      expect(child.stdout).to.eql(
        `Visit ${projectPath}/supported/index.html (​${projectPath}/supported/index.html​) to see the result`
      );
      checkFileExists(projectPath);
    });

    it('works against a unsupported project', async function () {
      projectPath = `${__dirname}/fixtures/unsupported-project`;
      const child = await execa(await getBinPath(), [projectPath], {
        shell: true,
        reject: false,
      });
      expect(child.exitCode).to.eql(1);
      expect(child.stderr).to.eql('- working');
      expect(child.stdout).to.eql(
        `Visit ${projectPath}/supported/index.html (​${projectPath}/supported/index.html​) to see the result`
      );
      checkFileExists(projectPath);
    });
  });

  describe('--json', function () {
    it('works against a fully supported project', async function () {
      const child = await execa(
        await getBinPath(),
        [`${__dirname}/fixtures/supported-project`, '--json'],
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
        await getBinPath(),
        [`${__dirname}/fixtures/unsupported-project`, '--json'],
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

'use strict';

const { expect } = require('chai');
const { setupProjectPath } = require('../lib/read-from-url');
const fileServer = require('./test-helpers/registries');

describe('read file from URL', function () {
  const FILE_SERVER_PORT_1 = 3454;
  const FILE_SERVER_PORT_2 = 3455;
  beforeEach(function () {
    let root = `./tests/fixtures`;
    fileServer.startAll([
      {
        name: 'supported-project',
        recordingRoot: `${root}/supported-project`,
        port: FILE_SERVER_PORT_1,
      },
      {
        name: 'not-found-project',
        recordingRoot: `${root}/not-found-project`,
        port: FILE_SERVER_PORT_2,
      },
    ]);
  });

  afterEach(function () {
    fileServer.stopAll();
  });

  it('package.json and yarn.lock and .npmrc is created', async function () {
    let projectInfo = await setupProjectPath(
      `http://github.com:${FILE_SERVER_PORT_1}/supported-project`,
      {
        hostUrl: `http://localhost:${FILE_SERVER_PORT_1}`,
      },
    );
    expect(projectInfo.packageJSON.name).to.equal('supported-project');
    expect(projectInfo['yarn.lock']).to.include('# yarn lockfile v1');
    expect(projectInfo['.npmrc']).to.include('@stefanpenner:registry=http://0.0.0.0:3001');
  });

  it('throws file not found error', async function () {
    try {
      await setupProjectPath(`http://github.com:${FILE_SERVER_PORT_2}/supported-projects`, {
        hostUrl: `http://localhost:${FILE_SERVER_PORT_2}`,
      });
    } catch (e) {
      expect(e.code).to.eq(404);
    }
  });
});

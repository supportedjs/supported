'use strict';

const { expect } = require('chai');
const fs = require('fs');
const { setupProjectPath } = require('../lib/read-from-url');
const fileServer = require('./raw-file-server');

describe('read file from URL', function () {
  beforeEach(function () {
    fileServer.startAll()
  });

  afterEach(function () {
    fileServer.stopAll();
  });

  it('package.json and yarn.lock is created', async function () {
    let projectPath = await setupProjectPath(`http://github.com:${fileServer.FILE_SERVER_PORT_1}/supported-project`, 'localhost');
    expect(fs.existsSync(projectPath + '/package.json')).to.be.true;
    expect(fs.existsSync(projectPath + '/yarn.lock')).to.be.true;
  });
  it('package.json and yarn.lock is created', async function () {
    try {
      let projectPath = await setupProjectPath(`http://github.com:${fileServer.FILE_SERVER_PORT_2}/supported-projects`, 'localhost');
    } catch (e) {
      expect(e.code).to.eq('E404');
    }
  });
});
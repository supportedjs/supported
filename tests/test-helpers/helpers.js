'use strict';

const { existsSync, readdirSync } = require('fs');
const { join } = require('path');

function getTestProjectPath(projectName) {
  const root = `${__dirname}/../fixtures`;
  const projectPath = join(root, projectName);
  if (existsSync(projectPath)) {
    return projectPath;
  }
  throw new Error(`Unable to find ${projectName} at ${root}`);
}

function getAvaiableTestProjects() {
  return readdirSync(`${__dirname}/../fixtures`, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== 'recordings')
    .map(dirent => dirent.name);
}

module.exports = {
  getTestProjectPath,
  getAvaiableTestProjects,
};

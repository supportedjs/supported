'use strict';

const { existsSync, readdirSync, writeFileSync } = require('fs');
const { join } = require('path');

function getTestProjectPath(projectName) {
  const root = `${__dirname}/../fixtures`;
  const projectPath = join(root, projectName);
  if (existsSync(projectPath)) {
    // when project tar ball skips packaging of npmrc file. So we will have to create the file if it isn't present
    let npmRc = join(projectPath, '.npmrc');
    if (!existsSync(npmRc)) {
      writeFileSync(
        npmRc,
        `
      registry=http://0.0.0.0:3000
      @stefanpenner:registry=http://0.0.0.0:3001`,
      );
    }
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

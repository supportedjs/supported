'use strict';
const tmp = require('tmp');
const fetch = require('minipass-fetch');
const fs = require('fs');
const debug = require('debug')('supported:read-from-url');

const RAW_CONTENT_HOST = 'raw.githubusercontent.com';

async function setupProjectPath(_url, rawFileHost) {
  let tempDir = tmp.dirSync();

  let url = new URL(_url);
  url.host = rawFileHost || RAW_CONTENT_HOST;
  if (url.pathname.indexOf('tree') == -1) {
    url.pathname += '/master/package.json';
  }

  debug(`packageJSON url: ${url.toString()}`);
  const packageJSON = await fetch(url.toString()).then(async request => {
    if (request.status === 200) {
      return request.json();
    } else if (request.status === 404) {
      const { error } = await request.json();
      const e = new Error(
        `[${error.code}][http.status=${request.status}] url:${url} ${error.summary}\n${error.details}`,
      );
      e.code = error.code;
      throw e;
    } else {
      throw new Error(`[http.status=${request.status}] url:${url}`);
    }
  });

  url.pathname = url.pathname.replace('package.json', 'yarn.lock');
  const yarnLock = await fetch(url.toString()).then(async request => {
    if (request.status === 200) {
      return request.text();
    } else if (request.status === 404) {
      const { error } = await request.json();
      const e = new Error(
        `[${error.code}][http.status=${request.status}] url:${url} ${error.summary}\n${error.details}`,
      );
      e.code = error.code;
      throw e;
    } else {
      throw new Error(`[http.status=${request.status}] url:${url}`);
    }
  });

  let projectPath = `${tempDir.name}/${packageJSON.name}`;
  fs.mkdirSync(projectPath);
  fs.writeFileSync(`${projectPath}/package.json`, JSON.stringify(packageJSON), 'UTF-8');
  fs.writeFileSync(`${projectPath}/yarn.lock`, yarnLock, 'UTF-8');

  debug(`Project path set to: ${projectPath}`);
  return projectPath;
}

module.exports = {
  setupProjectPath,
};

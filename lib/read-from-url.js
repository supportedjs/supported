'use strict';
const fetch = require('minipass-fetch');
const debug = require('debug')('supported:read-from-url');
const { default: PQueue } = require('p-queue');
const allSettled = require('promise.allsettled');
const os = require('os');
const { getFetchUrl } = require('./util');
const chalk = require('chalk');

async function setupProjectPath(_url, options = {}) {
  let url = getFetchUrl(_url, options);

  const work = [];
  const queue = new PQueue({
    concurrency: os.cpus().length,
  });
  let result = Object.create(null);
  let packageJSON;
  // check if the code moved to main or still using master
  // https://github.com/SparshithNR/doc-tester/blob/master/package.json
  // https://github.com/stefanpenner/supported/blob/main/package.json
  try {
    packageJSON = await runFetch(url + 'package.json', true);
  } catch (e) {
    if (e.code === 404) {
      url = url.replace('main', 'master');
      packageJSON = await runFetch(url + 'package.json', true);
    } else {
      throw e;
    }
  }
  for (const fileName of ['yarn.lock', '.npmrc']) {
    work.push(
      queue.add(async () => {
        const requestURL = url + fileName;
        result[fileName] = await runFetch(requestURL);
      }),
    );
  }
  await queue.onIdle();
  for (const settled of await allSettled(work)) {
    if (settled.status === 'rejected') {
      throw settled.reason;
    }
  }

  debug(`packageJSON url: ${url.toString()}`);

  return {
    packageJSON,
    ...result,
  };
}

async function runFetch(requestURL, isJson) {
  let response;
  try {
    response = await fetch(requestURL);
  } catch (e) {
    let error = new Error(chalk`{red Couldn't reach server, please check the URL provided.}
    ${e.message}`);
    throw error;
  }
  if (response.status === 200) {
    if (isJson) {
      return response.json();
    }
    return response.text();
  } else if (response.status === 404) {
    if (!requestURL.includes('.npmrc')) {
      const text = await response.buffer();
      const e = new Error(`[http.status=${response.status}] url:${requestURL} : error: ${text}`);
      e.code = response.status;
      throw e;
    } else {
      debug(`Fetch failed for .npmrc , ${await response.buffer()}`);
    }
  } else {
    throw new Error(`[http.status=${response.status}] url:${requestURL}`);
  }
}

module.exports = {
  setupProjectPath,
};

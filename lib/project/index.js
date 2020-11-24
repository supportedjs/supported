'use strict';

const fs = require('fs');
const os = require('os');
const YarnLockfile = require('@yarnpkg/lockfile');
const fetch = require('minipass-fetch');
const npa = require('npm-package-arg');
const debug = require('debug')('supported:project');
const path = require('path');

const { default: PQueue } = require('p-queue');
const { supportedRanges, supported } = require('../time/index');
const npmConfig = require('../npm/config');

module.exports = async function isInSupportWindow(projectRoot) {
  const config = await npmConfig(projectRoot); // kinda slow, TODO: re-implement as standalone lib
  // const { policies } = options;
  const pkg = JSON.parse(fs.readFileSync(`${projectRoot}/package.json`, 'utf-8'));
  const lockfilePath = path.join(projectRoot, 'yarn.lock');
  // TODO: npm support
  const { object: lockfile } = YarnLockfile.parse(fs.readFileSync(lockfilePath, 'utf-8'));

  const dependenciesToCheck = [];
  for (const [name, version] of Object.entries(pkg.dependencies)) {
    const key = `${name}@${version}`;

    if (!(key in lockfile)) {
      throw new Error(`could not find: '${key}' in '${lockfilePath}'`);
    }

    dependenciesToCheck.push({
      name,
      version,
      type: 'dependency',
      resolvedVersion: lockfile[key].version,
    });
  }
  for (const [name, version] of Object.entries(pkg.devDependencies)) {
    const key = `${name}@${version}`;

    if (!(key in lockfile)) {
      throw new Error(`could not find: '${key}' in '${lockfilePath}'`);
    }

    dependenciesToCheck.push({
      name,
      version,
      type: 'devDependency',
      resolvedVersion: lockfile[key].version,
    });
  }

  const queue = new PQueue({
    concurrency: os.cpus().length,
  });

  const supportChecks = [];
  const work = [];
  for (const { resolvedVersion, name } of dependenciesToCheck) {
    work.push(
      queue.add(async () => {
        // TODO: likely extract this function for testing
        // TODO: test GH/Repo
        const spec = npa(name);

        let registry;
        if (spec.scope) {
          registry = config[`${spec.scope}:registry`] || config.registry;
        } else {
          registry = config.registry;
        }

        if (registry.charAt(registry.length - 1) === '/') {
          registry.slice(0, -1);
        }

        const meta = {
          name,
          registry,
        };
        debug('npmFetch[begin] %o', meta);

        const url = new URL(registry);
        url.pathname = `${url.pathname}${spec.name}`;
        try {
          // TODO: cache + retries
          // make-promise-happen and npmFetch both leaked sockets, and I didn't have time to debug...
          const info = await fetch(url.toString()).then(async request => {
            if (request.status === 200) {
              return request.json();
            } else if (request.status === 404) {
              // try parsing
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
          debug('npmFetch[end] %o', meta);

          const result = supported(
            info,
            `${name}@${resolvedVersion}`,
            supportedRanges(info.time[info['dist-tags'].latest]),
          );
          supportChecks.push({ ...result, name, resolvedVersion });
        } catch (e) {
          debug('npmFetch[fail] %o %o', meta, e);
          throw e;
        }
      }),
    );
  }

  debug('npmFetch[waiting]');
  await queue.onIdle();
  for (const settled of await Promise.allSettled(work)) {
    if (settled.status === 'rejected') {
      throw settled.reason;
    }
  }

  debug('npmFetch[complete]');

  supportChecks.sort((a, b) => b.name.localeCompare(a.name));

  return {
    isInSupportWindow: !supportChecks.find(({ isSupported }) => isSupported === false),
    supportChecks,
    projectName: pkg.name,
  };
};

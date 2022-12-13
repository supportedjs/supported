'use strict';

const semverCoerce = require('semver/functions/coerce');
const YarnLockfile = require('@yarnpkg/lockfile');
const npa = require('npm-package-arg');
const fs = require('fs');
const path = require('path');
const debug = require('debug')('supported:project');

const npmConfig = require('../npm/config');

class YarnLock {
  constructor(lockfilePath) {
    this.lockfilePath = lockfilePath;
    const { isClassic, lockfile } = parseLockfile(lockfilePath);
    this.isClassic = isClassic;
    this.lockFileContents = lockfile;
    this.lockFileKeys = Object.keys(lockfile);
  }

  resolvedVersion(name, packageJsonVersion) {
    if (this.isClassic) {
      const key = `${name}@${packageJsonVersion}`;

      if (!(key in this.lockFileContents)) {
        throw new Error(`could not find: '${key}' in '${this.lockfilePath}'`);
      }

      return this.lockFileContents[key].version;
    } else {
      const targetResolution = `${name}@npm:${packageJsonVersion}`;
      const resolvedEntries = this.lockFileKeys.filter(key => {
        return key === targetResolution || key.split(', ').includes(targetResolution);
      });
      if (resolvedEntries.length < 1) {
        const possibleEntries = this.lockFileKeys.filter(key => {
          return key.startsWith(`${name}@`);
        });
        if (possibleEntries.length < 1) {
          throw new Error(`could not find: '${targetResolution}' in '${this.lockfilePath}'`);
        } else if (possibleEntries.length === 1) {
          return this.lockFileContents[possibleEntries[0]].version;
        } else {
          // Its possible for this case to look like:
          // 'graphql@^15.5.1',
          // 'graphql@npm:^14.7.0 || ^15.0.0 || ^16.0.0'
          for (let i = 0; i < possibleEntries.length; i++) {
            if (
              possibleEntries[i].includes(`${name}@${packageJsonVersion}`) ||
              (possibleEntries[i].includes(`${name}@`) &&
                possibleEntries[i].includes(`${packageJsonVersion}`))
            ) {
              return this.lockFileContents[possibleEntries[i]].version;
            }
          }

          throw new Error(
            `Found unexpected multiple resolutions of: '${targetResolution}' in '${this.lockfilePath}'`,
          );
        }
      }
      if (resolvedEntries.length > 1) {
        throw new Error(
          `Found unexpected multiple resolutions of: '${targetResolution}' in '${this.lockfilePath}'`,
        );
      }
      return this.lockFileContents[resolvedEntries[0]].version;
    }
  }
}

function parseLockfile(lockfilePath) {
  try {
    const { object: lockfile } = YarnLockfile.parse(fs.readFileSync(lockfilePath, 'utf-8'));
    return {
      isClassic: true,
      lockfile,
    };
  } catch (_e) {
    return {
      isClassic: false,
      lockfile: require('@yarnpkg/parsers').parseSyml(fs.readFileSync(lockfilePath, 'utf-8')),
    };
  }
}

module.exports = async function setupProject(projectRoot) {
  const config = await npmConfig(projectRoot); // kinda slow, TODO: re-implement as standalone lib
  // const { policies } = options;
  const pkgPath = `${projectRoot}/package.json`;
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`${pkgPath} does not exist, are you sure this is a valid package?`);
  }
  if (!fs.statSync(pkgPath).isFile()) {
    throw new Error(`${pkgPath} is not a file, are you sure this is a valid package?`);
  }
  const file = fs.readFileSync(pkgPath, 'utf-8');
  let pkg;
  try {
    pkg = JSON.parse(file);
  } catch (e) {
    throw new Error(`${pkgPath} is not a valid JSON file, are you sure this is a valid package?`);
  }
  const lockfilePath = path.join(projectRoot, 'yarn.lock');
  // TODO: npm support
  const lockfile = new YarnLock(lockfilePath);
  const dependenciesToCheck = [];
  if (pkg.dependencies) {
    for (const [name, version] of Object.entries(pkg.dependencies)) {
      const resolvedVersion = lockfile.resolvedVersion(name, version);

      if (semverCoerce(version)) {
        dependenciesToCheck.push({
          name,
          version,
          type: 'dependency',
          resolvedVersion,
          url: getURL(name, config),
        });
      } else {
        debug('Invalid version/local link found for %o %o ', name, version);
      }
    }
  }
  if (pkg.devDependencies) {
    for (const [name, version] of Object.entries(pkg.devDependencies)) {
      const resolvedVersion = lockfile.resolvedVersion(name, version);
      if (semverCoerce(version)) {
        dependenciesToCheck.push({
          name,
          version,
          type: 'devDependency',
          resolvedVersion,
          url: getURL(name, config),
        });
      } else {
        debug('Invalid version/local link found for %o %o ', name, version);
      }
    }
  }

  dependenciesToCheck.push(getNodeInfo(pkg));

  return {
    dependenciesToCheck,
    config,
    pkg,
  };
};

function getURL(name, config) {
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
  debug('npmFetch[args] %o', meta);

  const url = new URL(registry);
  url.pathname = `${url.pathname}${spec.name}`;
  return url;
}

function getNodeInfo(pkg) {
  let nodeVersion = '0.0.0';
  if (pkg.volta) {
    nodeVersion = pkg.volta.node;
  } else if (pkg.engines) {
    nodeVersion = pkg.engines.node;
  }
  return {
    name: 'node',
    version: nodeVersion,
    type: 'node',
  };
}

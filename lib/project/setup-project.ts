'use strict';

    import semverCoerce from 'semver/functions/coerce';
    import YarnLockfile from '@yarnpkg/lockfile';
/* @ts-expect-error @rehearsal TODO TS7016: Could not find a declaration file for module 'npm-package-arg'. '/Users/akusuma/workspace/opensource/supported/node_modules/npm-package-arg/npa.js' implicitly has an 'any' type..  Try `npm i --save-dev @types/npm-package-arg` if it exists or add a new declaration (.d.ts) file containing `declare module 'npm-package-arg';` */
    import npa from 'npm-package-arg';
    import fs from 'fs';
    import path from 'path';
const debug = require('debug')('supported:project');

/* @ts-expect-error @rehearsal TODO TS1192: Module '"/Users/akusuma/workspace/opensource/supported/lib/npm/config"' has no default export. */
    import npmConfig from '../npm/config';

class YarnLock {
  lockfilePath: string;
    isClassic: boolean;
    lockFileKeys: string[];
    lockFileContents: string;
  constructor(lockfilePath: string) {
    this.lockfilePath = lockfilePath;
    const { isClassic, lockfile } = parseLockfile(lockfilePath);
    this.isClassic = isClassic;
    this.lockFileContents = lockfile;
    this.lockFileKeys = Object.keys(lockfile);
  }

  resolvedVersion(name: string, packageJsonVersion: unknown) {
    if (this.isClassic) {
      const key = `${name}@${packageJsonVersion}`;

/* @ts-expect-error @rehearsal TODO TS2322: Type 'string' is being returned or assigned, but type 'object' is expected. Please convert type 'string' to type 'object', or return or assign a variable of type 'object' */
      if (!(key in this.lockFileContents)) {
        throw new Error(`could not find: '${key}' in '${this.lockfilePath}'`);
      }

/* @ts-expect-error @rehearsal TODO TS7015: Element implicitly has an 'any' type because index expression is not of type 'number'. */
      return this.lockFileContents[key].version;
    } else {
      const targetResolution = `${name}@npm:${packageJsonVersion}`;
      const resolvedEntries = this.lockFileKeys.filter((key: string) => {
        return key === targetResolution || key.split(', ').includes(targetResolution);
      });
      if (resolvedEntries.length < 1) {
        const possibleEntries = this.lockFileKeys.filter((key: string) => {
          return key.startsWith(`${name}@`);
        });
        if (possibleEntries.length < 1) {
          throw new Error(`could not find: '${targetResolution}' in '${this.lockfilePath}'`);
        } else if (possibleEntries.length === 1) {
/* @ts-expect-error @rehearsal TODO TS2538: Type 'undefined' cannot be used as an index type. */
          return this.lockFileContents[possibleEntries[0]].version;
        } else {
          // Its possible for this case to look like:
          // 'graphql@^15.5.1',
          // 'graphql@npm:^14.7.0 || ^15.0.0 || ^16.0.0'
          for (let i = 0; i < possibleEntries.length; i++) {
            if (
/* @ts-expect-error @rehearsal TODO TS2532: Object is possibly 'undefined'. */
              possibleEntries[i].includes(`${name}@${packageJsonVersion}`) ||
/* @ts-expect-error @rehearsal TODO TS2532: Object is possibly 'undefined'. */
              (possibleEntries[i].includes(`${name}@`) &&
/* @ts-expect-error @rehearsal TODO TS2532: Object is possibly 'undefined'. */
                possibleEntries[i].includes(`${packageJsonVersion}`))
            ) {
/* @ts-expect-error @rehearsal TODO TS2538: Type 'undefined' cannot be used as an index type. */
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
/* @ts-expect-error @rehearsal TODO TS2538: Type 'undefined' cannot be used as an index type. */
      return this.lockFileContents[resolvedEntries[0]].version;
    }
  }
}

function parseLockfile(lockfilePath: fs.PathOrFileDescriptor) {
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

module.exports = setupProject;
export async function setupProject(projectRoot: string) {
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
/* @ts-expect-error @rehearsal TODO TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | SemVer | null | undefined'. Consider specifying type of argument to be 'string | number | SemVer | null | undefined', using type assertion: '(version as string | number | SemVer | null | undefined)', or using type guard: 'if (version instanceof string | number | SemVer | null | undefined) { ... }'. */
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
/* @ts-expect-error @rehearsal TODO TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | SemVer | null | undefined'. Consider specifying type of argument to be 'string | number | SemVer | null | undefined', using type assertion: '(version as string | number | SemVer | null | undefined)', or using type guard: 'if (version instanceof string | number | SemVer | null | undefined) { ... }'. */
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

/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'config' implicitly has an 'any' type. */
function getURL(name: string, config): URL  {
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

/* @ts-expect-error @rehearsal TODO TS2304: Cannot find name 'st'. */
function getNodeInfo(pkg: { volta: { node: string; }; engines: { node: string; }; }): { name: string; version: st...  {
  let nodeVersion = '0.0.0';
  if (pkg.volta) {
    nodeVersion = pkg.volta.node;
  } else if (pkg.engines) {
    nodeVersion = pkg.engines.node;
  }
  return {
    name: 'node',
    version: nodeVersion,
/* @ts-expect-error @rehearsal TODO TS2322: Type 'name: string; version: string; type: string' is being returned or assigned, but type 'name: string; version: st' is expected. Please convert type 'name: string; version: string; type: string' to type 'name: string; version: st', or return or assign a variable of type 'name: string; version: st' */
    type: 'node',
  };
}

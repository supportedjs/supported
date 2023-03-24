'use strict';

    import os from 'os';
/* @ts-expect-error @rehearsal TODO TS7016: Could not find a declaration file for module 'minipass-fetch'. '/Users/akusuma/workspace/opensource/supported/node_modules/minipass-fetch/lib/index.js' implicitly has an 'any' type..  Try `npm i --save-dev @types/minipass-fetch` if it exists or add a new declaration (.d.ts) file containing `declare module 'minipass-fetch';` */
    import fetch from 'minipass-fetch';
const debug = require('debug')('supported:project');
    import allSettled from 'promise.allsettled';

    import { default as PQueue } from 'p-queue';
    import { supportedRanges, supported } from '../time/index';
    import { isLtsOrLatest } from '../lts';
/* @ts-expect-error @rehearsal TODO TS2305: Module '"../util"' has no exported member 'isLtsPackage'. */
    import { sortLibraries, getLatest, isLtsPackage } from '../util';
const CACHE = {};

module.exports = async function isInSupportWindow(
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'dependenciesToCheck' implicitly has an 'any' type. */
  dependenciesToCheck,
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'projectName' implicitly has an 'any' type. */
  projectName,
/* @ts-expect-error @rehearsal TODO TS7031: Binding element 'progressLogger' implicitly has an 'any' type. */
  { progressLogger, policies },
  today: Date,
) {
  const queue = new PQueue({
    concurrency: os.cpus().length,
  });

/* @ts-expect-error @rehearsal TODO TS7034: Variable 'supportChecks' implicitly has type 'any[]' in some locations where its type cannot be determined. */
  const supportChecks = [];
  const work = [];

  let isSemVerSupported = true;
  let isSemVerExpiring = false;
  for (const moduleMeta of dependenciesToCheck) {
    const { resolvedVersion, name, url } = moduleMeta;
    work.push(
      queue.add(async () => {
        // TODO: likely extract this function for testing
        // TODO: test GH/Repo

        if (name === 'node') {
          let result = isLtsOrLatest(moduleMeta, moduleMeta.version, today);
          supportChecks.push({
            ...result,
            name: name,
          });
          progressLogger.updateSpinner(
            name,
            result.isSupported,
/* @ts-expect-error @rehearsal TODO TS2339: Property 'duration' does not exist on type '{ isSupported: boolean; }'. */
            result.isSupported && (result.duration || result.message),
          );
          return;
        }

        try {
          // TODO: retries
          // make-promise-happen and npmFetch both leaked sockets, and I didn't have time to debug...
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{}'. */
          let info = CACHE[url.toString()];
          if (!info) {
            debug('npmFetch[cache miss] %o', url.toString());
            debug('npmFetch[begin] %o', url.toString());
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'request' implicitly has an 'any' type. */
            info = await fetch(url.toString()).then(async (request) => {
              if (request.status === 200) {
                return request.json();
              } else if (request.status === 404) {
                // try parsing
                const { error } = await request.json();
                const e = new Error(
                  `[${error.code}][http.status=${request.status}] url:${url} ${error.summary}\n${error.details}`,
                );
/* @ts-expect-error @rehearsal TODO TS2339: Property 'code' does not exist on type 'Error'. */
                e.code = error.code;
                throw e;
              } else {
                throw new Error(`[http.status=${request.status}] url:${url}`);
              }
            });
            debug('npmFetch[end] %o', url.toString());
/* @ts-expect-error @rehearsal TODO TS7053: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{}'. */
            CACHE[url.toString()] = info;
          } else {
            debug('npmFetch[cache hit] %o', url.toString());
          }

          let result = '';
          if (isLtsPackage(name, 'ember')) {
/* @ts-expect-error @rehearsal TODO TS2322: The variable 'result' has type 'string', but 'isSupported: boolean' is assigned. Please convert 'isSupported: boolean' to 'string' or change variable's type. */
            result = isLtsOrLatest(info, resolvedVersion, today);
          } else {
            let { upgradeBudget } = policies.primary;
            let effectiveReleaseDate;
            if (policies.custom && policies.custom[name]) {
              upgradeBudget = policies.custom[name].upgradeBudget || upgradeBudget;
              effectiveReleaseDate = policies.custom[name].effectiveReleaseDate || today;
              debug(
                `name: ${name}, effectiveReleaseDate: ${effectiveReleaseDate}, upgradeBudget: ${upgradeBudget}`,
              );
            } else if (policies.primary.effectiveReleaseDate) {
              effectiveReleaseDate = policies.primary.effectiveReleaseDate;
            }
            result = supported(
              info,
              `${name}@${resolvedVersion}`,
              supportedRanges(
                info.time[getLatest(info, policies.ignorePrereleases)],
                upgradeBudget,
              ),
              today,
              effectiveReleaseDate,
              upgradeBudget,
              policies.ignorePrereleases,
            );
/* @ts-expect-error @rehearsal TODO TS2339: Property 'isSupported' does not exist on type 'string'. */
            if (isSemVerSupported && !result.isSupported) {
              isSemVerSupported = false;
            }
/* @ts-expect-error @rehearsal TODO TS2339: Property 'isSupported' does not exist on type 'string'. */
            if (!isSemVerExpiring && result.isSupported && result.duration) {
              isSemVerExpiring = true;
            }
          }
          supportChecks.push({
/* @ts-expect-error @rehearsal TODO TS2698: Spread types may only be created from object types. */
            ...result,
            name,
            resolvedVersion,
            latestVersion: getLatest(info, policies.ignorePrereleases),
          });
          progressLogger.updateSpinner(
            name,
/* @ts-expect-error @rehearsal TODO TS2339: Property 'isSupported' does not exist on type 'string'. */
            result.isSupported,
/* @ts-expect-error @rehearsal TODO TS2339: Property 'isSupported' does not exist on type 'string'. */
            result.isSupported && (result.duration || result.message),
          );
        } catch (e) {
          debug('npmFetch[fail] %o %o', url.toString(), e);
          throw e;
        }
      }),
    );
  }

  debug('npmFetch[waiting]');
  await queue.onIdle();
  for (const settled of await allSettled(work)) {
    if (settled.status === 'rejected') {
      throw settled.reason;
    }
  }
  progressLogger.updateSpinner('SemVer', isSemVerSupported, isSemVerExpiring);

  debug('npmFetch[complete]');

/* @ts-expect-error @rehearsal TODO TS7005: Variable 'supportChecks' implicitly has an 'any[]' type. */
  supportChecks.sort(sortLibraries);

  return {
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'supportChecks' implicitly has an 'any[]' type. */
    isInSupportWindow: !supportChecks.find(({ isSupported }) => isSupported === false),
/* @ts-expect-error @rehearsal TODO TS7005: Variable 'supportChecks' implicitly has an 'any[]' type. */
    supportChecks,
    projectName,
  };
};

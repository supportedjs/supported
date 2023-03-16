'use strict';

    import { default as PQueue } from 'p-queue';
    import allSettled from 'promise.allsettled';
    import os from 'os';

/* @ts-expect-error @rehearsal TODO TS1192: Module '"/Users/akusuma/workspace/opensource/supported/lib/project/index"' has no default export. */
    import isInSupportWindow from './index';
    import { isProjectExpiringSoon } from '../output/cli-output';
/* @ts-expect-error @rehearsal TODO TS2305: Module '"../util"' has no exported member 'ProgressLogger'. */
    import { ProgressLogger } from '../util';
    import { getPolicyRules } from './../policy-rules';
import type { Ora } from 'ora';
import { setupProject as defaultSetupProject } from './setup-project';

export interface PolicyResults {
  isInSupportWindow: boolean;
  expiringSoonCount: number;
  projects: {}[];
}

module.exports.processPolicies = processPolicies;
export async function processPolicies(projectPaths: string[], setupProjectFn: typeof defaultSetupProject | undefined, spinner: Ora, today: Date | undefined, config): Promise<PolicyResults> {
  const policyRules = getPolicyRules(config);
  const setupProject = setupProjectFn ? setupProjectFn : defaultSetupProject;
  let result = {
    isInSupportWindow: true,
    expiringSoonCount: 0,
    projects: [],
  };
  if (!Array.isArray(projectPaths)) {
/* @ts-expect-error @rehearsal TODO TS7022: 'projectPaths' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer. */
    const projectPaths = [projectPaths];
  }
  const work = [];
  const queue = new PQueue({
    concurrency: os.cpus().length,
  });
  let isMultipleProduct = projectPaths.length > 1;
  let progressLogger = new ProgressLogger(spinner, isMultipleProduct);
  const ignoredDependencies =
    (policyRules.primary && policyRules.primary.ignoredDependencies) || [];
  for (const projectPath of projectPaths) {
    work.push(
      queue.add(async () => {
        let { dependenciesToCheck, pkg } = await setupProject(projectPath);
        let dependenciesToCheckAfterIgnore = dependenciesToCheck.filter(
            (          dep) => !ignoredDependencies.includes(dep.name),
        );
        progressLogger.updateTotalDepCount(dependenciesToCheck.length);
        progressLogger.updateIgnoredDepCount(
          dependenciesToCheck.length - dependenciesToCheckAfterIgnore.length,
        );
        let auditResult = await isInSupportWindow(
          dependenciesToCheckAfterIgnore,
          pkg.name,
          {
            progressLogger,
            policies: policyRules,
          },
          today,
        );
        if (!auditResult.isInSupportWindow && result.isInSupportWindow) {
          result.isInSupportWindow = false;
        }
        if (auditResult.isInSupportWindow) {
          auditResult.isExpiringSoon = isProjectExpiringSoon(auditResult);
          if (auditResult.isExpiringSoon) {
            result.expiringSoonCount++;
          }
        }
        progressLogger.updatePrefixTextForMultipleProject(
          pkg.name,
          auditResult.isInSupportWindow,
          auditResult.isExpiringSoon,
        );
        auditResult.projectPath = projectPath;
/* @ts-expect-error @rehearsal TODO TS2345: Argument of type 'any' is not assignable to parameter of type 'never'. Consider verifying both types, using type assertion: '(auditResult as string)', or using type guard: 'if (auditResult instanceof string) { ... }'. */
        result.projects.push(auditResult);
      }),
    );
  }
  await queue.onIdle();
  for (const settled of await allSettled(work)) {
    if (settled.status === 'rejected') {
      throw settled.reason;
    }
  }
  return result;
}

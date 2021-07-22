'use strict';

const { default: PQueue } = require('p-queue');
const allSettled = require('promise.allsettled');
const os = require('os');

const isInSupportWindow = require('./index');
const { isProjectExpiringSoon } = require('../output/cli-output');
const { ProgressLogger } = require('../util');
const { getPolicyRules } = require('./../policy-rules');
const DEFAULT_SETUP_FILE = './setup-project';

module.exports.processPolicies = processPolicies;
async function processPolicies(projectPaths, setupProjectFn, spinner, today, config) {
  const policyRules = getPolicyRules(config);
  const setupProject = setupProjectFn ? setupProjectFn : require(DEFAULT_SETUP_FILE);
  let result = {
    isInSupportWindow: true,
    expiringSoonCount: 0,
    projects: [],
  };
  if (!Array.isArray(projectPaths)) {
    projectPaths = [projectPaths];
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
          dep => !ignoredDependencies.includes(dep.name),
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

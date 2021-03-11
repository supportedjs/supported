'use strict';

const { default: PQueue } = require('p-queue');
const allSettled = require('promise.allsettled');
const os = require('os');

const isInSupportWindow = require('./index');
const { isProjectExpiringSoon } = require('../output/cli-output');
const { ProgressLogger } = require('../util');

module.exports = {
  isAllInSupportWindow,
};

async function isAllInSupportWindow(projectPaths, setupProject, spinner) {
  let result = {
    isInSupportWindow: true,
    expiringSoonCount: 0,
    projects: [],
  };
  const work = [];
  const queue = new PQueue({
    concurrency: os.cpus().length,
  });
  let isMultipleProduct = projectPaths.length > 1;
  let progressLogger = new ProgressLogger(spinner, isMultipleProduct);
  for (const projectPath of projectPaths) {
    work.push(
      queue.add(async () => {
        let { dependenciesToCheck, pkg } = await setupProject(projectPath);
        progressLogger.updateTotalDepCount(dependenciesToCheck.length);
        let auditResult = await isInSupportWindow(dependenciesToCheck, pkg.name, {
          progressLogger,
        });
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

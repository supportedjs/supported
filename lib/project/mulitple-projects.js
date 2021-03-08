'use strict';

const { default: PQueue } = require('p-queue');
const allSettled = require('promise.allsettled');
const os = require('os');

const isInSupportWindow = require('./index');
const { isProjectExpiringSoon } = require('../output/cli-output');

module.exports = {
  isAllInSupportWindow,
};

async function isAllInSupportWindow(projectPaths, setupProject) {
  let result = {
    isInSupportWindow: true,
    expiringSoonCount: 0,
    mps: [],
  };
  const work = [];
  const queue = new PQueue({
    concurrency: os.cpus().length,
  });
  for (const projectPath of projectPaths) {
    work.push(
      queue.add(async () => {
        let { dependenciesToCheck, pkg } = await setupProject(projectPath);
        let auditResult = await isInSupportWindow(dependenciesToCheck, pkg.name);
        if (!auditResult.isInSupportWindow && result.isInSupportWindow) {
          result.isInSupportWindow = false;
        }
        if (auditResult.isInSupportWindow) {
          auditResult.isExpiringSoon = isProjectExpiringSoon(auditResult);
          if (auditResult.isExpiringSoon) {
            result.expiringSoonCount++;
          }
        }
        auditResult.projectPath = projectPath;
        result.mps.push(auditResult);
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

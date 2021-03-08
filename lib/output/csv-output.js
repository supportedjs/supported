'use strict';

const { Parser } = require('json2csv');
const stripAnsi = require('strip-ansi');
const { writeFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');
const chalk = require('chalk');
const { makeConsoleReport } = require('./cli-output');
const { MILLSINQUARTER } = require('../util');
const { getQtrLocale } = require('./messages');

const HOMEDIR = require('os').homedir();
const AUDIT_SAVE_DIR = join(HOMEDIR, `support-policy-audit`);

module.exports = {
  convertToCsv,
  generateCsv,
};
function convertToCsv(result, policyDetails) {
  const fields = [
    {
      label: 'Name',
      value: 'name',
    },
    {
      label: 'Supported',
      value: 'isSupported',
    },
    {
      label: 'Status',
      value: row => {
        if (!row.isSupported) {
          return `${row.type} version violated`;
        } else if (row.isSupported && row.duration) {
          return `${row.type ? row.type : ''} version expiring soon`;
        } else {
          return `up-to-date`;
        }
      },
    },
    {
      label: 'Resolved Version',
      value: 'resolvedVersion',
    },
    {
      label: 'Latest Version',
      value: 'latestVersion',
    },
    {
      label: 'End of Support',
      value: row => {
        if (row.deprecationDate) {
          return new Date(row.deprecationDate).toDateString();
        } else {
          return `-`;
        }
      },
    },
    {
      label: 'Unsupported Since/In',
      value: row => {
        if (row.duration) {
          const qtrs = Math.ceil(row.duration / MILLSINQUARTER);
          return `${qtrs} ${getQtrLocale(qtrs)}`;
        } else {
          return `-`;
        }
      },
    },
  ];

  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(result.supportChecks);
  const { title, head } = makeConsoleReport(result, {}, policyDetails);
  const fileContent = `${stripAnsi(title)}${stripAnsi(head)}

  ${csv}
  `;
  return fileContent;
}

function generateCsv(projectPaths, results, POLICIY_DETAILS) {
  if (projectPaths.length > 1) {
    if (!existsSync(AUDIT_SAVE_DIR)) {
      mkdirSync(AUDIT_SAVE_DIR);
    }
  }
  results.mps.forEach(result => {
    let filename = `${sanitizeFilename(result.projectName)}-support-audit.csv`;
    let filePath = join(AUDIT_SAVE_DIR, filename);
    if (existsSync(result.projectPath)) {
      filename = `${sanitizeFilename(result.projectName)}-support-audit.csv`;
      filePath = join(result.projectPath, filename);
    }
    writeFileSync(filePath, convertToCsv(result, POLICIY_DETAILS), 'utf-8');
    console.log(chalk`Report for {bold ${result.projectName}} created at ${filePath}`);
  });
}

function sanitizeFilename(filename) {
  let parsedName = filename.split('/');
  return parsedName[parsedName.length - 1];
}

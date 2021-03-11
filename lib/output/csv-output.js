'use strict';

const { Parser } = require('json2csv');
const stripAnsi = require('strip-ansi');
const { makeConsoleReport } = require('./cli-output');
const { MILLSINQUARTER } = require('../util');
const { getQtrLocale } = require('./messages');

module.exports = {
  writeToCsv,
};
function writeToCsv(result, policyDetails) {
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

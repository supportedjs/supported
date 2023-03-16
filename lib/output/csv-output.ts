'use strict';

    import { Parser } from 'json2csv';
    import stripAnsi from 'strip-ansi';
    import { writeFileSync, existsSync, mkdirSync, PathLike } from 'fs';
    import { join } from 'path';
    import chalk from 'chalk';
    import { makeConsoleReport } from './cli-output';
    import { MS_IN_QTR } from '../util';
    import { getQtrLocale } from './messages';

const HOMEDIR = require('os').homedir();
const AUDIT_SAVE_DIR = join(HOMEDIR, `support-policy-audit`);

module.exports.convertToCsv = convertToCsv;
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'result' implicitly has an 'any' type. */
function convertToCsv(result, policyDetails: string): string  {
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
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'row' implicitly has an 'any' type. */
      value: (row) => {
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
      value: (row: { deprecationDate: string | number | Date; }): { deprecationDate: string | number | Date; } => {
        if (row.deprecationDate) {
/* @ts-expect-error @rehearsal TODO TS2322: The function expects to return 'deprecationDate: string | number | Date', but 'string' is returned. Please convert 'string' value to 'deprecationDate: string | number | Date' or update the function's return type. */
          return new Date(row.deprecationDate).toDateString();
        } else {
/* @ts-expect-error @rehearsal TODO TS2322: The function expects to return 'deprecationDate: string | number | Date', but 'string' is returned. Please convert 'string' value to 'deprecationDate: string | number | Date' or update the function's return type. */
          return `-`;
        }
      },
    },
    {
      label: 'Unsupported Since/In',
      value: (row: { duration: number; }): { duration: number; } => {
        if (row.duration) {
          const qtrs = Math.ceil(row.duration / MS_IN_QTR);
/* @ts-expect-error @rehearsal TODO TS2322: The function expects to return 'duration: number', but 'string' is returned. Please convert 'string' value to 'duration: number' or update the function's return type. */
          return `${qtrs} ${getQtrLocale(qtrs)}`;
        } else {
/* @ts-expect-error @rehearsal TODO TS2322: The function expects to return 'duration: number', but 'string' is returned. Please convert 'string' value to 'duration: number' or update the function's return type. */
          return `-`;
        }
      },
    },
  ];

/* @ts-expect-error @rehearsal TODO TS2322: Type 'label: string; value: string; } | { label: string; value: (row: any) => string; } | { label: string; value: (row: { deprecationDate: string | number | Date; }) => { deprecationDate: string | number | Date' is being returned or assigned, but type 'string | FieldInfo<{ deprecationDate: string | number | Date' is expected. Please convert type 'label: string; value: string; } | { label: string; value: (row: any) => string; } | { label: string; value: (row: { deprecationDate: string | number | Date; }) => { deprecationDate: string | number | Date' to type 'string | FieldInfo<{ deprecationDate: string | number | Date', or return or assign a variable of type 'string | FieldInfo<{ deprecationDate: string | number | Date' */
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(result.supportChecks);
  const { title, head } = makeConsoleReport(result, {}, policyDetails);
  const fileContent = `${stripAnsi(title)}${stripAnsi(head)}

  ${csv}
  `;
  return fileContent;
}

module.exports.generateCsv = generateCsv;
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'projectPaths' implicitly has an 'any' type. */
export function generateCsv(projectPaths, results: { projects: { projectName: unknown; projectPath: PathLike; }[]; }, POLICY_DETAILS: string): void  {
  if (projectPaths.length > 1) {
    if (!existsSync(AUDIT_SAVE_DIR)) {
      mkdirSync(AUDIT_SAVE_DIR);
    }
  }
/* @ts-expect-error @rehearsal TODO TS2355: A function whose declared type is neither 'void' nor 'any' must return a value. */
  results.projects.forEach((result: { projectName: unknown; projectPath: PathLike; }): { projectName: unknown; projectPath: PathLike; } => {
    let filename = `${sanitizeFilename(result.projectName)}-support-audit.csv`;
    let filePath = join(AUDIT_SAVE_DIR, filename);
    if (existsSync(result.projectPath)) {
      filename = `${sanitizeFilename(result.projectName)}-support-audit.csv`;
/* @ts-expect-error @rehearsal TODO TS2345: Argument of type 'PathLike' is not assignable to parameter of type 'string'. Consider verifying both types, using type assertion: '(result.projectPath as string)', or using type guard: 'if (result.projectPath instanceof string) { ... }'. */
      filePath = join(result.projectPath, filename);
    }
    writeFileSync(filePath, convertToCsv(result, POLICY_DETAILS), 'utf-8');
    console.log(chalk`Report for {bold ${result.projectName}} created at ${filePath}`);
  });
}

function sanitizeFilename(filename: unknown) {
/* @ts-expect-error @rehearsal TODO TS18046: 'filename' is of type 'unknown'. */
  let parsedName = filename.split('/');
  return parsedName[parsedName.length - 1];
}

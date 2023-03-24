'use strict';

import execa from 'execa';
import camelCaseKeys from 'camelcase-keys';

/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'cwd' implicitly has an 'any' type. */
module.exports = async function (cwd) {
  const child = execa.sync('npm', ['config', 'list', '--json'], {
    cwd,
    // shell: true,
  });
  let jsonConfigOutput = '';

  try {
    jsonConfigOutput = JSON.parse(child.stdout);
  } catch (e) {
    throw new Error(
      `'npm config list --json' did not return a valid JSON result. Please make sure you are on npm v7 or greater.`,
    );
  }

  /* @ts-expect-error @rehearsal TODO TS2769: No overload matches this call..  Overload 1 of 2, '(input: readonly { [key: string]: any; }[], options?: Options | undefined): readonly { [key: string]: any; }[]', gave the following error..    Argument of type 'string' is not assignable to parameter of type 'readonly { [key: string]: any; }[]'..  Overload 2 of 2, '(input: { [key: string]: any; }, options?: Options | undefined): { [key: string]: any; }', gave the following error..    Argument of type 'string' is not assignable to parameter of type '{ [key: string]: any; }'. */
  return camelCaseKeys(jsonConfigOutput);
};

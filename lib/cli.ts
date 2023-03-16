'use strict';
//check for node version as first thing
/* @ts-expect-error @rehearsal TODO TS2305: Module '"../lib/util"' has no exported member 'handleInput'. */
    import { checkNodeCompatibility, processDate, handleInput } from '../lib/util';
/* @ts-expect-error @rehearsal TODO TS2554: Expected 1 arguments, but got 0. */
checkNodeCompatibility();

// proceed iff the node version is good.
    import ora from 'ora';
    import fs from 'fs';
    import { displayResults } from '../lib/output/cli-output';
    import { processPolicies } from '../lib/project/multiple-projects';
/* @ts-expect-error @rehearsal TODO TS2305: Module '"./output/messages"' has no exported member 'DEFAULT_SUPPORT_MESSAGE'. */
    import { DEFAULT_SUPPORT_MESSAGE } from './output/messages';
    import { generateCsv } from '../lib/output/csv-output';

    import meow, { AnyFlags, BooleanFlag, Options, Result, StringFlag } from 'meow';

interface MainConfig {
  policyDetails: string;
  setupProjectFn: () => void;
  config: {};
}

type CliFlags = {
  currentDate: StringFlag;
  verbose: BooleanFlag;
  json: BooleanFlag;
  unsupported: BooleanFlag;
  supported: BooleanFlag;
  expiring: BooleanFlag;
  configFile: StringFlag;
};

async function main(cli: Result<CliFlags>, { policyDetails, setupProjectFn, config }: MainConfig): Promise<void>  {
  const projectPaths = handleInput(cli.input, process.cwd());

  if (projectPaths.length === 0) {
    cli.showHelp(1);
  } else {
    const currentDate = processDate(cli.flags.currentDate as string) || undefined;

    const configuration =
      (cli.flags.configFile && JSON.parse(fs.readFileSync(cli.flags.configFile as string, 'utf-8'))) ||
      config;

    const spinner = ora('working').start();
    let result;
    let processed = false;
    try {
      result = await processPolicies(
        projectPaths,
        setupProjectFn,
        spinner,
        currentDate,
        configuration,
      );
      if (result.isInSupportWindow === false) {
        process.exitCode = 1;
      }
      processed = true;
    } finally {
      if (processed) {
        spinner.stopAndPersist({
          symbol: '✨',
        });
      } else {
/* @ts-expect-error @rehearsal TODO TS2554: Expected 0 arguments, but got 1. */
        spinner.stop({
          symbol: '✨',
        });
      }
    }

    if (cli.flags.json && result) {
      console.log(JSON.stringify(result, null, 2));
    } else if (cli.flags.csv && result) {
/* @ts-expect-error @rehearsal TODO TS2345: Argument of type '{0}' is not assignable to parameter of type 'projects: { projectName: unknown; projectPath: PathLike'. Consider verifying both types, using type assertion: '( result as string)', or using type guard: 'if ( result instanceof string) { ... }'. */
      generateCsv(projectPaths, result, policyDetails);
    } else {
      displayResults(result, cli.flags, policyDetails);
    }
  }
}

/**
 *
 * @param {string} policyDetails Custom message that needs to be passed regarding the support audit run
 * @param {*} setupProjectFn if the way project is setup is different then use this method to override.
 */
module.exports = run;
async function run(
  policyDetails = DEFAULT_SUPPORT_MESSAGE(),
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'setupProjectFn' implicitly has an 'any' type. */
  setupProjectFn,
  help = require('./help')(),
/* @ts-expect-error @rehearsal TODO TS7006: Parameter 'config' implicitly has an 'any' type. */
  config,
): Promise<void>  {
  const meowOptions: Options<CliFlags> = {
    importMeta: import.meta,
    flags: {
      verbose: {
        type: 'boolean',
        alias: 'd',
      },
      json: {
        type: 'boolean',
        alias: 'j',
      },
      unsupported: {
        type: 'boolean',
        alias: 'u',
      },
      supported: {
        type: 'boolean',
        alias: 's',
      },
      expiring: {
        type: 'boolean',
        alias: 'e',
      },
      currentDate: {
        type: 'string',
        alias: 'c',
      },
      configFile: {
        type: 'string',
        alias: 'f',
      },
    },
  };
  await main(
    meow(help, meowOptions),
    { policyDetails, setupProjectFn, config },
  );
}

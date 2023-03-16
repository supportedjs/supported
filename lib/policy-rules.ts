/* @ts-expect-error @rehearsal TODO TS2305: Module '"./util"' has no exported member 'DEFAULT_PRIMARY_POLICY'. */
    import { DEFAULT_PRIMARY_POLICY } from './util';
    import Ajv from 'ajv/dist/jtd';
const ajv = new Ajv();
const validateConfigSchema = ajv.compile(require('./config-schema.json'));

function validateConfig(config: NodeJS.ProcessConfig): void  {
  const valid = validateConfigSchema(config);
  if (!valid) {
/* @ts-expect-error @rehearsal TODO TS18049: 'validateConfigSchema.errors' is possibly 'null' or 'undefined'. */
    validateConfigSchema.errors.forEach(err => {
      console.error(`Field "${err.instancePath}": ${err.message}`);
    });
    throw new Error('Invalid configuration file');
  }
}

export function getPolicyRules(configuration: NodeJS.ProcessConfig) {
  const policyRules = {
    primary: DEFAULT_PRIMARY_POLICY,
  };
  if (configuration) {
    validateConfig(configuration);
/* @ts-expect-error @rehearsal TODO TS2339: Property 'ignorePrereleases' does not exist on type '{ primary: any; }'. */
    policyRules.ignorePrereleases = configuration.ignorePrereleases;
/* @ts-expect-error @rehearsal TODO TS2339: Property 'primary' does not exist on type 'ProcessConfig'. */
    if (configuration.primary) {
/* @ts-expect-error @rehearsal TODO TS2339: Property 'primary' does not exist on type 'ProcessConfig'. */
      policyRules.primary = configuration.primary;
      policyRules.primary.ignoredDependencies = policyRules.primary.ignoredDependencies || [];
    }
/* @ts-expect-error @rehearsal TODO TS2339: Property 'custom' does not exist on type 'ProcessConfig'. */
    if (configuration.custom) {
/* @ts-expect-error @rehearsal TODO TS2339: Property 'custom' does not exist on type '{ primary: any; }'. */
      policyRules.custom = {};
/* @ts-expect-error @rehearsal TODO TS2339: Property 'custom' does not exist on type 'ProcessConfig'. */
      configuration.custom.forEach((policy) => {
/* @ts-expect-error @rehearsal TODO TS2355: A function whose declared type is neither 'void' nor 'any' must return a value. */
        policy.dependencies.forEach((dep: string | number): string | number => {
/* @ts-expect-error @rehearsal TODO TS2339: Property 'custom' does not exist on type '{ primary: any; }'. */
          if (policyRules.custom[dep]) {
            throw new Error(
              `The dependency ${dep} was found multiple times in the config file. Please refer Rules section in configuration.md`,
            );
          }
          if (policyRules.primary.ignoredDependencies.includes(dep)) {
            throw new Error(
              `The dependency ${dep} was found in ignoredDependencies and custom configuration. Please refer Rules section in configuration.md`,
            );
          }
/* @ts-expect-error @rehearsal TODO TS2339: Property 'custom' does not exist on type '{ primary: any; }'. */
          policyRules.custom[dep] = {
            upgradeBudget: policy.upgradeBudget,
            effectiveReleaseDate:
              policy.effectiveReleaseDate && new Date(policy.effectiveReleaseDate),
          };
        });
      });
    }
  }
  return policyRules;
}

module.exports = {
  validateConfig,
  getPolicyRules,
};

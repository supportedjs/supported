const { DEFAULT_PRIMARY_POLICY } = require('./util');
const Ajv = require('ajv/dist/jtd');
const ajv = new Ajv();
const validateConfigSchema = ajv.compile(require('./config-schema.json'));

function validateConfig(config) {
  const valid = validateConfigSchema(config);
  if (!valid) {
    validateConfigSchema.errors.forEach(err => {
      console.error(`Field "${err.instancePath}": ${err.message}`);
    });
    throw new Error('Invalid configuration file');
  }
}

function getPolicyRules(configuration) {
  const policyRules = {
    primary: DEFAULT_PRIMARY_POLICY,
  };
  if (configuration) {
    validateConfig(configuration);
    policyRules.ignorePrereleases = configuration.ignorePrereleases;
    if (configuration.primary) {
      policyRules.primary = configuration.primary;
      policyRules.primary.ignoredDependencies = policyRules.primary.ignoredDependencies || [];
    }
    if (configuration.custom) {
      policyRules.custom = {};
      configuration.custom.forEach(policy => {
        policy.dependencies.forEach(dep => {
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

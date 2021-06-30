const Ajv = require('ajv/dist/jtd');
const ajv = new Ajv();
const validateConfigSchema = ajv.compile(require('./config-schema.json'));

module.exports = function validateConfig(config) {
  const valid = validateConfigSchema(config);
  if (!valid) {
    validateConfigSchema.errors.forEach(err => {
      console.error(`Field "${err.instancePath}": ${err.message}`);
    });
    throw new Error('Invalid configuration file');
  }
};

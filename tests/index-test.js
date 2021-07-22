'use strict';

const registries = require('./test-helpers/registries');

const chai = require('chai');
const { expect } = chai;
const { processPolicies } = require('../index');

describe('processPolicies', function () {
  this.timeout(4000);
  beforeEach(function () {
    registries.startAll();
  });

  afterEach(function () {
    registries.stopAll();
  });

  it('verifies supported project', async function () {
    const result = await processPolicies(`${__dirname}/fixtures/supported-project`);
    expect(result.isInSupportWindow).to.be.ok;
  });

  it('notifies of unsupported project', async function () {
    const result = await processPolicies(`${__dirname}/fixtures/unsupported-project`);
    expect(result.isInSupportWindow).to.not.be.ok;
  });

  it('accepts configuration to ignore dependencies', async function () {
    const result = await processPolicies(`${__dirname}/fixtures/unsupported-project`);
    expect(result.isInSupportWindow).to.not.be.ok;

    const result2 = await processPolicies(
      `${__dirname}/fixtures/unsupported-project`,
      undefined,
      undefined,
      undefined,
      {
        primary: {
          ignoredDependencies: ['es6-promise', '@stefanpenner/a', 'rsvp'],
        },
      },
    );
    expect(result2.isInSupportWindow).to.be.ok;
  });
});

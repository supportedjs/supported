'use strict';

const chai = require('chai');
const { expect } = chai;
const { writeToHtml } = require('../lib/html-report');

describe('Test generated HTML', function () {
  it('generates a valid html', function () {
    let dataJson = {
      "supportChecks": [
        {
          "isSupported": true,
          "name": "terminal-link",
          "resolvedVersion": "2.1.1"
        },
        {
          "isSupported": true,
          "name": "semver",
          "resolvedVersion": "7.3.4"
        },
        {
          "isSupported": true,
          "name": "resolve-path",
          "resolvedVersion": "1.4.0"
        },
        {
          "isSupported": true,
          "name": "prettier",
          "resolvedVersion": "2.2.0"
        }
      ]
    };
    let projectName = 'test-app';
    let htmlContent = writeToHtml(projectName, dataJson);
    expect(htmlContent).to.include(`<script src="./jquery.js"></script>`);
    expect(htmlContent).to.include(`<script src="./jput.min.js"></script>`);
    expect(htmlContent).to.include(` <h1>Support for ${projectName}</h1>`);
  });
});
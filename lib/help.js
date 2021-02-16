'use strict';

const chalk = require('chalk');
const terminalLink = require('terminal-link');
const pkg = require('../package.json');

module.exports = chalk`
{bold ${terminalLink('supported', pkg.homepage)}}
  {bold Usage}
    {gray $} {cyan supported <input-file>}
  {bold Options}
    {cyan --help, -h} this output
    {cyan --json, -j} output as json
    {cyan --verbose, -v} outputs detailed report of support audit
  {bold Examples}
    {gray $} {cyan  supported ./path/to/project/}
`;

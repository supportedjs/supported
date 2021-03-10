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
    {cyan --verbose, -d} outputs detailed report of support audit
    {cyan --unsupported, -u} outputs detailed report of unsupport packages only
    {cyan --expiring, -e} outputs detailed report of expiring packages only
    {cyan --supported, -s} outputs detailed report of support packages only
    {cyan --csv}          outputs csv file in the project path
  {bold Examples}
    {gray $} {cyan  supported ./path/to/project/}
`;

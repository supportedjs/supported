'use strict';

const chalk = require('chalk');
const terminalLink = require('terminal-link');
const pkg = require('../package.json');

module.exports = (commandName = 'supported', packageLink = pkg.homepage) => {
  return chalk`
{bold ${terminalLink(commandName, packageLink)}}
  {bold Usage}
    {gray $} {cyan ${commandName} <input-file>}
  {bold Options}
    {cyan --help, -h}         this output
    {cyan --json, -j}         output as json
    {cyan --verbose, -d}      outputs detailed report of support audit
    {cyan --unsupported, -u}  outputs detailed report of unsupported packages only
    {cyan --expiring, -e}     outputs detailed report of expiring packages only
    {cyan --supported, -s}    outputs detailed report of supported packages only
    {cyan --csv}              outputs csv file in the project path
    {cyan --current-date, -c} optional current date to use when calculating support
    {cyan --config-file, -f}  optional config file to override the default setup
    {cyan --ignored-dependencies, -i} optional list of dependencies to be ignored while running the policy, ex: -r 'test','tester'
  {bold Examples}
    {gray $} {cyan  ${commandName} ./path/to/project/}
`;
};

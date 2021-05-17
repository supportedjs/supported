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
    {cyan --token, -t}        token to access raw file from github private instance
    {cyan --hostUrl}          URL endpoint that returns package.json, yarn.lock and npmrc files.
  {bold Examples}
    {gray $} {cyan  ${commandName} ./path/to/project/}
    {gray $} {cyan  ${commandName} https://github.com/stefanpenner/supported}
    {gray $} {cyan  ${commandName} https://test.githubprivate.com/stefanpenner/supported -t $TOKEN}
    {gray $} {cyan  ${commandName} supported --hostUrl=https://raw.githubusercontent.com/stefanpenner/supported/main/}
`;
};

'use strict';

const fs = require('fs');
const terminalLink = require('terminal-link');
const path = require('path');

function setUpHTMLOutput(supportResult, projectPath) {
  const { projectName } = supportResult;
  delete supportResult.projectName;
  let resultPath = `${projectPath}/supported`;
  fs.mkdirSync(resultPath);
  let indexHtml = `${resultPath}/index.html`;
  fs.writeFileSync(indexHtml, writeToHtml(projectName, supportResult), 'utf-8');
  fs.copyFileSync('vendor/jput.min.js', `${resultPath}/jput.min.js`);
  fs.copyFileSync('vendor/jquery.js', `${resultPath}/jquery.js`);
  fs.writeFileSync(`${resultPath}/result.json`, JSON.stringify(
    { ...supportResult, project: { name: projectName, path: projectPath, type: 'node_module' } },
    null,
    2,
  ));
  const link = terminalLink(path.resolve(indexHtml), path.resolve(indexHtml));
  console.log(`Visit ${link} to see the result`);
}

function writeToHtml(projectName, supportResult) {
  return `<html>
  <script src="./jquery.js"></script>
  <script src="./jput.min.js"></script>
  <script>
    let data = ${JSON.stringify(supportResult)};
    $(document).ready(function(){
        jPut.result.data = data.supportChecks;
    });
    function filterResult(ev) {
      let selected = ev.target.value;
      let filteredList = data.supportChecks;
      if (ev.target.value !== 'all') {
        let selectedFilter = ev.target.value == "true";
        filteredList = data.supportChecks.filter(ele => ele.isSupported == selectedFilter);
      }
      jPut.result.clear();
      jPut.result.data = filteredList;
    }
  </script>
  <style>
    .supported {
      background-color: limegreen;
    }
    .not-supported {
      background-color: #F08080;
    }
    table {
      margin: auto;
    }
    td {
      padding: 4px;
    }
    .top {
      width: 50%;
      margin: auto;
    }
  </style>
  <div class="top">
    <h1>Support for ${projectName}</h1>
    <select name="support" id="support" onchange="filterResult(event);">
      <option value="all">All</option>
      <option value="true">Supported</option>
      <option value="false">Not supported</option>

    </select>
  </div>
  <table border="1">
    <thead>
        <tr>
            <td>isSupported</td>
            <td>Name </td>
            <td>Resolved Version</td>
            <td>Message</td>
        </tr>
    </thead>
    <tbody jput="result" jput-jsondata='[]'>
        <tr class="{{json.isSupported == true ? 'supported': 'not-supported'}}">
          <td>{{json.isSupported}}</td>
          <td>{{json.name}}</td>
          <td>{{json.resolvedVersion}}</td>
          <td>{{json.message ? json.message : ""}}</td>
        </tr>
    </tbody>
  </table>
</html>
  `
}

module.exports = { writeToHtml, setUpHTMLOutput };
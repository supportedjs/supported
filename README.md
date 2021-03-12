
# supported ![CI](https://github.com/stefanpenner/supported/workflows/CI/badge.svg)




## Usage


```sh
npx supported <path/to/node_module>
npx supported <[array/of/node_modules]>
```

### As a node module


```js
const { isAllInSupportWindow } = require('supported');
const  projectPaths = ['test/fixtures/unsupported-project', 'test/fixtures/supported-project' ];
const  jsonResult = await isAllInSupportWindow(projectPaths);
const  projectPaths_2 = 'test/fixtures/unsupported-project';
const  jsonResult_2 = await isAllInSupportWindow(projectPaths_2);
```



Developers can pass custom setupProjectFn which will return a object as below

```js
// setupProject can be custom function which returns dependenciesToCheck, pkg is package.json
// isAllInSupportWindow runs this fuction as shown below.
let { dependenciesToCheck, pkg } = await setupProject(projectPath);
```



`dependenciesToCheck`: an array of all the dependenicies which you want to verify.
`pkg` is an package.json like object, which must have "name" attribute.

Each item in `dependenciesToCheck` array is an object containing the following

```ts
{
	name: string, //[required]
	version: string, // [required] version in Package.JSON
	resolvedVersion: string,// [required] resolved version from Lock file
	url: URL, // [optional] Artifactory Registry URL, if not provided code use the open-source npm registry
	type: string, // [optional] if you would like to identify the type of dependencies like devDep/node/dep
}
```
Customizing the `isAllInSupportWindow` is as follows
```js
const { isAllInSupportWindow } = require('supported');
const { readFileSync } = require('fs');
function setupProject(projectPath) {
	let packageJson = JSON.parse(fs.readFileSync(`${projectPath}/package.json`, 'utf-8'));
	let dependenciesToCheck = [];
	for (const [name, version] of  Object.entries(pkg.dependencies) {
		dependenciesToCheck.push({
			name,
			version,
			resolvedVersion: getReslovedFromPackageLock(name),
			url: 'http://custom-npm-registry.com',
			type:  'dependency',
		});
	};
	return {
		dependenciesToCheck,
		pkg: packageJson,
	}
}
const  jsonResult = await isAllInSupportWindow(projectPaths, setupProject);
```
You can extend the CLI and keep the same option, want to change the name of the tool then do the following,
```js
// bin/custom-support-cli
#!/usr/bin/env node
const { run } = require('supported');
const  helpFn = require('supported/lib/help');
function setupProjectCustom(projectPath) {
	let packageJson = JSON.parse(fs.readFileSync(`${projectPath}/package.json`, 'utf-8'));
	let dependenciesToCheck = [];
	for (const [name, version] of  Object.entries(pkg.dependencies) {
		dependenciesToCheck.push({
			name,
			version,
			resolvedVersion: getReslovedFromPackageLock(name),
			url: 'http://custom-npm-registry.com',
			type:  'dependency',
		});
	};
	return {
		dependenciesToCheck,
		pkg: packageJson,
	}
}
const  CUSTOM_POLICIY_DETAILS = ` For more information see: http://custom-message.link`
run(POLICIY_DETAILS, setupProjectCustom, helpFn(`support-custom-cli`, `http://custom-message.link`));
```
## Contributing

Clone the project, make changes and run the tests
```bash
git clone git@github.com:stefanpenner/supported.git
cd supported
yarn
yarn test
```
You can test against the local test fixtures
```bash
yarn start:registry
bin/supported tests/fixtures/supported-project
bin/supported tests/fixtures/supported-project tests/fixtures/unsupported-project
```
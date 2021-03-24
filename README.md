
# supported [![CI](https://github.com/stefanpenner/supported/workflows/CI/badge.svg)](https://github.com/stefanpenner/supported/actions/workflows/ci.yml)




## Usage


```sh
npx supported <path/to/node_module>
npx supported <[array/of/node_modules]>
```

### As a node module


```js
const { processPolicies } = require('supported');
const projectPaths = ['test/fixtures/unsupported-project', 'test/fixtures/supported-project' ];
const jsonResult = await processPolicies(projectPaths);
const projectPaths_2 = 'test/fixtures/unsupported-project';
const jsonResult_2 = await processPolicies(projectPaths_2);
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

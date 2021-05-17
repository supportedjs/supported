
# supported [![CI](https://github.com/stefanpenner/supported/workflows/CI/badge.svg)](https://github.com/stefanpenner/supported/actions/workflows/ci.yml)

## Usage

```sh
npx supported <path/to/node_module>
npx supported <[array/of/node_modules]>
// Generate token using https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token
npx supported https://github.com/stefanpenner/supported
npx supported https://github.com/stefanpenner/supported/tree/some-branch
npx supported https://test.githubprivate.com/stefanpenner/supported -t $TOKEN
npx supported supported --hostUrl=https://raw.githubusercontent.com/stefanpenner/supported/main/
```

### Optional Flags

#### current date
The `--current-date` (`-c`) flag enables a form of limited time travel, and attempts to run
the tools internal date calculations based on a specified date, rather then the
current date.

Some examples:

* `--current-date="March 31, 2011"` runs the tool as if it was March 31, 2021
* `--current-date="-3 weeks"` runs the tool as if it was 3 weeks ago
* `--current-date="3 weeks"` runs the tool as if it was 3 weeks from now

The date micro-syntax is described as:

Anything that `new Date(input)` parses, or if that fails it will assume to be a
relative duration starting today parsed by
[parse-duration@^1.0.0's own micro-syntax](https://github.com/jkroso/parse-duration#available-unit-types-are).

#### hostURL
The `--hostURL` flag enables a way to provide a valid URL which will return package.json, lock file and npmrc file if exists.
some examples:

* `--hostUrl=https://raw.githubusercontent.com/stefanpenner/supported/main/`, gets the above listed file from the provided URL.
* `--hostUrl=https://${TOKEN}@raw.githubprivate.com/stefanpenner/supported/main/`, gets the above listed file from the private instance URL provided,
private instance needs token, that must be passed as part of URL.

#### token
The `--token` (`-t`) is to pass the token generated to access the private instances of the github. This will enable this tool to evaluate
the github private instance repositories. Generating a personal access token is explained in detail [here](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token).

Example:
`supported https://test.githubprivate.com/stefanpenner/supported -t $TOKEN`

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

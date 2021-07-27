# `supported` Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2021-7-26

### Breaking
- End of support dates are now always rounded to the end of the quarter

## [0.5.0] - 2021-7-22

### Added
- Added support for `effectiveReleaseDate` in `primary` policy
- Added support for passing configuration to `run()`

### Breaking
- Dropped support for Node 10, which is no longer LTS
- `processPolicies()` 5th argument now takes the exact shape defined in `CONFIGURATION.md`, rather than the previous policies argument and ignoredDependencies argument.

## [0.4.0] - 2021-7-22
### Added
- Add [configuration file](https://github.com/supportedjs/supported/blob/main/CONFIGURATION.md) feature
- Add `ignorePrereleases` feature to handle proprietary npm repositories [#34](https://github.com/supportedjs/supported/issues/34)
- Improve CI tool UX [#18](https://github.com/supportedjs/supported/issues/18)
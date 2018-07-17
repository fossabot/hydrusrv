# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

+ Added correct default values for `HYDRUS_TAG_REPOSITORY` and
  `HYDRUS_FILE_REPOSITORY` in readme

## [2.5.0] - 2018-07-15

### Changed

+ Switched to an Alpine-based Node image for a smaller resulting image size

## [2.4.0] - 2018-07-15

### Added

+ Added default values for `HYDRUS_TAG_REPOSITORY` and `HYDRUS_FILE_REPOSITORY`

### Removed

+ Removed unnecessary details about Docker deployment

### Fixed

+ Fixed hydrusrv trying to move to next route after setting `OPTIONS` response

## [2.3.0] - 2018-07-15

### Added

+ Added check if hydrus server has already set up its repositories when
  creating temporary tables. This change causes hydrusrv to keep running
  (instead of crashing) and to try again after the period set via
  `DATA_UPDATE_INTERVAL`
+ Added Docker compatibility

### Changed

+ Updated dependencies

### Fixed

+ Fixed hydrusrv ignoring files without tags completely

## [2.2.0] - 2018-06-30

### Added

+ Added (pseudo)-random sorting – it stays the same for any given query until
  hydrusrv updates its temporary data

### Changed

+ Removed version number from hydrus server dummy and adjusted wording to avoid
  confusion
+ Adjusted copyright notice in license to comply with the standard
+ Updated dependencies

## [2.1.0] - 2018-06-03

### Added

+ Joined current files table when selecting mappings to prevent possible
  foreign key constraint errors after deleting files because hydrus server
  has not already updated the current mappings

### Changed

+ Renamed mappings configuration to avoid confusion

### Fixed

+ Fixed broken anchor in readme

## [2.0.1] - 2018-06-03

### Fixed

+ Removed debug time logging from data sync function

## [2.0.0] - 2018-06-03

### Added

+ Added temporary data table creation to allow for faster on-demand queries and
  more extensive sorting options

### Changed

+ Rewrote database queries to use the new temporary data tables
+ Optimized sorting via multiple namespaces (thanks to the new temporary data
  tables)
+ Set more appropriate default settings
+ Added various small optimizations throughout the application

### Fixed

+ Fixed wrong table used in several locations

## [1.5.1] - 2018-05-29

### Fixed

+ Fixed getting files by tags query failing when the same tag was provided
  multiple times
+ Fixed getting files by tags sorted by namespace query not working correctly
  when one or more of the provided tags also contained the namespace

## [1.5.0] - 2018-05-28

### Changed

+ Removed the previously required token on media file and thumbnail routes –
  this made it impossible to load files/thumbnails via `<img>` tag or the like
  and the long hash alone should be enough to make those routes nearly
  impossible to guess
+ Made current password a requirement when updating user
+ Updated dependencies

## [1.4.0] - 2018-05-13

### Added

+ Added JavaScript Standard Style badge

### Changed

+ Refactored code
+ Added separate model for tokens
+ Switched to Yarn and updated dependencies

### Fixed

+ Fixed CORS headers

## [1.3.2] - 2018-05-11

### Fixed

+ Added additional missing CORS headers

## [1.3.1] - 2018-05-11

### Fixed

+ Added missing CORS preflight handling

## [1.3.0] - 2018-05-11

### Added

+ Added CORS headers

### Changed

+ Refactored the handling of `true/false` environment variables

## [1.2.0] - 2018-05-10

### Added

+ Added [Snyk](https://snyk.io) integration

### Changed

+ Refactored several `if/else` constructs
+ Updated dependencies

### Fixed

+ Fixed wrong indentation in error response example
+ Fixed lines unnecessarily exceeding character limit in some cases

## [1.1.2] - 2018-05-10

### Fixed

+ Fixed broken tests after adding additional output to file lists

## [1.1.1] - 2018-05-10

### Fixed

+ Removed impossible errors when creating users from API docs

## [1.1.0] - 2018-05-10

### Added

+ Added base route
+ Added additional output to file lists

## [1.0.1] - 2018-05-09

### Fixed

+ Fixed check if registration is enabled

## 1.0.0 - 2018-05-07

### Added

+ Initial release

[Unreleased]: https://github.com/mserajnik/hydrusrv/compare/2.5.0...develop
[2.5.0]: https://github.com/mserajnik/hydrusrv/compare/2.4.0...2.5.0
[2.4.0]: https://github.com/mserajnik/hydrusrv/compare/2.3.0...2.4.0
[2.3.0]: https://github.com/mserajnik/hydrusrv/compare/2.2.0...2.3.0
[2.2.0]: https://github.com/mserajnik/hydrusrv/compare/2.1.0...2.2.0
[2.1.0]: https://github.com/mserajnik/hydrusrv/compare/2.0.1...2.1.0
[2.0.1]: https://github.com/mserajnik/hydrusrv/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/mserajnik/hydrusrv/compare/1.5.1...2.0.0
[1.5.1]: https://github.com/mserajnik/hydrusrv/compare/1.5.0...1.5.1
[1.5.0]: https://github.com/mserajnik/hydrusrv/compare/1.4.0...1.5.0
[1.4.0]: https://github.com/mserajnik/hydrusrv/compare/1.3.2...1.4.0
[1.3.2]: https://github.com/mserajnik/hydrusrv/compare/1.3.1...1.3.2
[1.3.1]: https://github.com/mserajnik/hydrusrv/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/mserajnik/hydrusrv/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/mserajnik/hydrusrv/compare/1.1.2...1.2.0
[1.1.2]: https://github.com/mserajnik/hydrusrv/compare/1.1.1...1.1.2
[1.1.1]: https://github.com/mserajnik/hydrusrv/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/mserajnik/hydrusrv/compare/1.0.1...1.1.0
[1.0.1]: https://github.com/mserajnik/hydrusrv/compare/1.0.0...1.0.1

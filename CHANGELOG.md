# Changelog

All notable changes **after `0.4.1`** will be documented in this file following 
the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format. This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

-   Tests for every Blade component, plus JavaScript unit and browser tests
-   Support for `algoliasearch` v5 when `bundle_algolia` is disabled (v3.27.1+ and v4 are
    still supported and now tested)
-   `bundle_all_connectors` config option: set it to `false` for smaller bundles that only
    include the connectors this package's components use

### Changed

-   Requires PHP 8.1+ and Laravel 10+
-   JavaScript is now written in TypeScript and built with Vite
-   Bundles now ship `algoliasearch` v5, `instantsearch.js` 4.120 and Alpine.js 3.17

### Fixed

-   The bundled Alpine.js is now started when the app doesn't load its own copy
-   Widgets no longer create a dynamic `$id` property (deprecated in PHP 8.2)
-   `menu-select` and `range-slider` now use InstantSearch.js connectors that exist
    (`connectMenu` and `connectRange`)
-   A clear error when a widget asks for a connector that isn't available

## [0.7.0] - 2026-03-23

## [0.6.0] - 2025-07-16

## [0.5.2] - 2025-05-12

## [0.5.1] - 2025-05-12

## [0.5.0] - 2024-03-12

### Added

-   Added Laravel 11 support
-   Added basic tests

# Keep a Changelog Syntax

-   `Added` for new features.
-   `Changed` for changes in existing functionality.
-   `Deprecated` for soon-to-be removed features.
-   `Removed` for now removed features.
-   `Fixed` for any bug fixes. 
-   `Security` in case of vulnerabilities.

[Unreleased]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.7.0...HEAD

[0.7.0]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.6.0...0.7.0

[0.6.0]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.5.2...0.6.0

[0.5.2]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.5.1...0.5.2

[0.5.1]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.5.0...0.5.1

[0.5.0]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.4.1...0.5.0

[0.4.1]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.4.0...0.4.1

[0.4.0]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.3.0...0.4.0

[0.3.0]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.2.0...0.3.0

[0.2.0]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.1.2...0.2.0

[0.1.2]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.1.1...0.1.2

[0.1.1]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.1.0...0.1.1

[0.0.1]: https://github.com/InterNACHI/blade-alpine-instantsearch/compare/0.1.0...0.1.0

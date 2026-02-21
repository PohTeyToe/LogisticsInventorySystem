# Changelog

## [Unreleased] - 2026-03

### Added
- Architecture decisions documentation in README
- Known issues and roadmap section
- CONTRIBUTING.md with development and testing guide
- GitHub issue and PR templates
- Quick-start guide with common setup issues
- Validation edge case tests for CSV import

### Changed
- Updated EF Core packages to latest patch versions
- Improved validation error responses with detailed field-level errors

### Fixed
- CSV import validation now rejects rows with negative quantities
- Controller returns structured error response instead of generic 500

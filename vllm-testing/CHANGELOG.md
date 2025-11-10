# Changelog

All notable changes to `@queeraoke/vllm-testing` will be documented in this file.

## [0.1.0] - 2025-01-27

### Added
- Initial release of `@queeraoke/vllm-testing` package
- Core VLLM judge functionality (`VLLMJudge`, `validateScreenshot`)
- Configuration system with multi-provider support (Gemini, OpenAI, Claude)
- File-based caching for VLLM responses
- Multi-modal validation utilities
- Temporal aggregation for time-series analysis
- Environment variable loader (`load-env.mjs`)
- Example test file demonstrating usage

### Changed
- Refactored from monolithic `vllm-screenshot-judge.mjs` into modular package
- Extracted `temporal-aggregator.mjs` into `temporal.mjs`
- Extracted `vllm-cache.mjs` into `cache.mjs`
- Extracted multi-modal validation into `multi-modal.mjs`
- Centralized configuration in `config.mjs`

### Removed
- Old `test/vllm-screenshot-judge.mjs` (replaced by package)
- Old `test/helpers/temporal-aggregator.mjs` (replaced by package)
- Old `test/helpers/vllm-cache.mjs` (replaced by package)

### Migration
- All 27+ test files updated to use new package
- Backward compatibility layer (`vllm-compat.mjs`) provided for gradual migration
- See `MIGRATION.md` for detailed migration guide


# Changelog

All notable changes to @visual-ai/validate will be documented in this file.

## [0.1.0] - 2025-01-27

### Added
- Initial release of VLLM Testing package
- Core VLLM judge functionality (`VLLMJudge`, `validateScreenshot`)
- Configuration system with multi-provider support (Gemini, OpenAI, Claude)
- File-based caching for VLLM responses
- Multi-modal validation utilities
- Temporal aggregation for time-series analysis
- Environment variable loader (`load-env.mjs`)
- Example test file demonstrating usage
- Vercel serverless API for remote validation
- Health check endpoint
- Standalone web interface

### Changed
- Refactored from monolithic implementation into modular package
- Extracted temporal aggregation into `temporal.mjs`
- Extracted caching into `cache.mjs`
- Extracted multi-modal validation into `multi-modal.mjs`
- Centralized configuration in `config.mjs`
- Renamed package from `@queeraoke/vllm-testing` to `@vllm-testing/core` for general-purpose use

### Removed
- Project-specific references
- Queeraoke-specific naming

### Migration
- Package is now standalone and general-purpose
- Can be used in any project requiring visual testing with AI validation
- Vercel API allows remote validation without local installation


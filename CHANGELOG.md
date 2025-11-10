# Changelog

All notable changes to ai-browser-test will be documented in this file.

## [0.1.1] - 2025-01-27

### Changed
- Renamed package from `ai-screenshot-test` to `ai-browser-test`
- Updated description to reflect browser/Playwright integration and multi-modal validation
- Added persona-based experience testing with human-interpreted time scales
- Updated keywords to better reflect capabilities
- Renamed directory to match npm package name (`ai-browser-test`)
- Updated git remote to `henrywallace/ai-browser-test`
- Fixed all temporal test edge cases (null safety)

### Added
- `experiencePageAsPersona()` - Test page experience from persona perspective
- `experiencePageWithPersonas()` - Test page experience with multiple personas
- Human-interpreted time scales (reading time, interaction time) vs mechanical fps
- Comprehensive test suite (81 tests passing)

## [0.1.0] - 2025-01-27

### Added
- Initial release of VLLM Testing package
- Core validation functions (`validateScreenshot`, `VLLMJudge`)
- Multi-modal validation (`extractRenderedCode`, `multiPerspectiveEvaluation`)
- Temporal aggregation (`aggregateTemporalNotes`, `formatNotesForPrompt`)
- Score tracking (`ScoreTracker`)
- Batch optimization (`BatchOptimizer`)
- Feedback aggregation (`aggregateFeedback`, `generateRecommendations`)
- Context compression (`compressContext`, `compressStateHistory`)
- Structured data extraction (`extractStructuredData`)
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
- Renamed package from `@queeraoke/ai-browser-test` to `@ai-browser-test/core` for general-purpose use

### Removed
- Project-specific references
- Queeraoke-specific naming

### Migration
- Package is now standalone and general-purpose
- Can be used in any project requiring visual testing with AI validation
- Vercel API allows remote validation without local installation


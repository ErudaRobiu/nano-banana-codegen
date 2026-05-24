# Changelog

All notable changes to this skill will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.2.0] - 2026-05-24

### Changed
- **Breaking**: Migrated from legacy `@google/generative-ai` SDK to the new unified `@google/genai` SDK
- Default model changed from `gemini-3-pro-image-preview` to `gemini-3.1-flash-image-preview` for better speed/cost balance
- Aspect ratio and resolution are now first-class API parameters via `responseFormat`, no longer hacked into the prompt text

### Added
- `imageSize` resolution control: `512`, `1K`, `2K`, `4K` (4K available on Gemini 3 image models, 512 on 3.1 Flash only)
- Full aspect ratio list: `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9`
- Reference image support for product/character consistency (up to 14 per call on Gemini 3 image models)
- Image editing workflow (modify existing image via reference + prompt)
- Pro prompting guidance: semantic negative prompts, hyper-specificity, cinematography terms
- Quick decision tree at the bottom of `SKILL.md` for picking the right model/ratio/resolution
- Notes on SynthID watermark, language support (German included), and platform limitations

## [0.1.0] - 2026-05-24

### Added
- Initial release of the `nano-banana-codegen` skill
- 5-step workflow: audit, prompt, generate, embed, clean up
- Support for `gemini-3-pro-image-preview`, `gemini-3.1-flash-image-preview`, and `gemini-2.5-flash-image`
- Example `generate-images.js` starter script
- Documentation for aspect ratios, error handling, and rate limits

# nano-banana-codegen

A Claude Code skill (and standalone toolkit) for generating, editing, and embedding real images via Google's Nano Banana (Gemini) API. No more placeholder divs, gradient backgrounds, or empty `<img>` tags.

## What's in this repo

```
nano-banana-codegen/
├── SKILL.md              ← The skill, read by Claude Code
├── lib/
│   └── nano-banana.js    ← Shared library wrapping the Gemini SDK
├── examples/
│   ├── generate-basic.js          ← Text-to-image, single or batch
│   ├── generate-with-references.js ← Same subject across multiple shots
│   ├── edit-image.js              ← Modify an existing image
│   ├── chat-iterate.js            ← Multi-turn refinement
│   ├── with-google-search.js      ← Use real-time web data
│   └── generate-and-optimize.js   ← Generate then compress to WebP
├── package.json
├── README.md
├── CHANGELOG.md
└── LICENSE
```

## Why this exists

By default, Claude Code avoids generating images and falls back to coloured divs, CSS gradients, or `[placeholder]` comments. This skill flips that behaviour: when a real photograph would make the page better, Claude Code will actually go and make one — and it now ships with a full toolkit so it doesn't have to re-derive the API patterns each time.

## Capabilities

| Capability | Function |
|---|---|
| Text-to-image | `generate()` |
| Reference images (consistency) | `generateWithReferences()` — up to 14 refs |
| Image editing | `edit()` |
| Multi-turn iterative chat | `startChat().send()` |
| Google Search grounding | `generate({ googleSearch: true })` |
| Image Search grounding | `generate({ imageSearch: true })` (3.1 Flash) |
| Batch generation | `generateBatch()` — rate-limit aware |
| Optimization | `optimize()` — JPEG/mozjpeg or WebP |

## Quality presets

| Preset | Model | Cost | Use for |
|---|---|---|---|
| `draft` | `gemini-2.5-flash-image` | Free tier | Prototyping |
| `standard` | `gemini-3.1-flash-image-preview` | ~$0.03 | Default, cards, sections |
| `hero` | `gemini-3-pro-image-preview` | ~$0.13 | Brand-critical hero shots |

## Installation

### For Claude Code (recommended)

```bash
cd ~/.claude/skills
git clone https://github.com/ErudaRobiu/nano-banana-codegen.git
```

Claude Code picks it up on next start.

### For Claude.ai (web/desktop)

Upload `SKILL.md` to a Claude Project's skills panel.

### As a standalone library

```bash
cd your-project
npm install @google/genai
# Then import from a clone of this repo, or copy lib/nano-banana.js into your project
```

## Setup

```bash
export GEMINI_API_KEY=your_key_here
```

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

## Usage with Claude Code

Just ask naturally:

- "Add real images to this landing page"
- "Generate hero images for this project using Nano Banana"
- "Make the same product visible in 5 different scenes" (reference images)
- "Change the time of day in the hero from night to morning" (edit)
- "Refine the infographic — make the gold more matte" (chat iteration)

Claude Code will audit the project, write prompts, call the library, embed images, and clean up.

## Usage as a standalone library

```javascript
import { generate, generateBatch, edit, startChat } from "./lib/nano-banana.js";

// Single image
await generate({
  prompt: "Cinematic wide shot of an empty Vienna street at dawn...",
  output: "assets/images/hero.jpg",
  aspectRatio: "16:9",
  imageSize: "2K",
  quality: "hero",
});

// Batch
await generateBatch([
  { prompt: "...", output: "a.jpg", aspectRatio: "16:9", imageSize: "2K", quality: "hero" },
  { prompt: "...", output: "b.jpg", aspectRatio: "1:1", imageSize: "1K", quality: "standard" },
]);

// Edit existing
await edit({
  input: "hero.jpg",
  output: "hero-foggy.jpg",
  prompt: "Change night to foggy early morning, everything else identical.",
});

// Iterate via chat
const chat = startChat({ quality: "hero" });
await chat.send("Initial prompt...", "v1.jpg");
await chat.send("Make it warmer.", "v2.jpg");
```

## Running the examples

```bash
git clone https://github.com/ErudaRobiu/nano-banana-codegen.git
cd nano-banana-codegen
npm install
export GEMINI_API_KEY=your_key

npm run example:basic        # text-to-image
npm run example:references   # multi-image consistency
npm run example:edit         # modify existing image
npm run example:chat         # multi-turn iteration
npm run example:search       # Google Search grounding
npm run example:optimize     # generate + compress to WebP
```

## Aspect ratios

`1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9`

Note: `1:4`, `4:1`, `1:8`, `8:1` require Gemini 3.1 Flash (use `quality: "standard"`).

## Resolutions

`512` (3.1 Flash only), `1K`, `2K`, `4K`. Always uppercase K.

## Limitations

- All generated images include an invisible SynthID watermark
- No transparent backgrounds
- No audio/video inputs
- Image Search grounding cannot search for people
- 15 prompt languages best supported (German included)

## Roadmap

- [ ] Style presets (luxury, SaaS, lifestyle, editorial) for prompt templates
- [ ] Gemini Batch API mode (24hr async for 20+ images)
- [ ] CLI binary (`npx nano-banana generate ...`)
- [ ] Better thinking mode controls exposed via the lib
- [ ] Validation/preview mode that estimates cost before generating

PRs welcome.

## Related

- [`nano-banana-prompt`](https://github.com/ErudaRobiu/nano-banana-prompt) — companion skill for crafting prompt JSON

## License

MIT. See [LICENSE](LICENSE).

---
name: nano-banana-codegen
description: Automatically generate real images for web projects using the Nano Banana (Gemini) API and embed them into the codebase. Use this skill whenever Claude Code is building or editing a website, landing page, component, or any frontend project that needs images — hero images, backgrounds, cards, product shots, section visuals, and so on. Trigger this skill instead of using placeholder divs, gradient backgrounds, or CSS workarounds when real images would improve the project. Also trigger when the user says things like "add real images", "generate images for this project", "use Nano Banana to make images", or "I want actual photos not placeholders". This skill replaces Claude Code's default behavior of avoiding images entirely.
---

# Nano Banana Image Generation for Claude Code

This skill enables Claude Code to generate, edit, and iterate on real images via the Nano Banana (Gemini) API and embed them directly into web projects.

It ships with a shared library (`lib/nano-banana.js`) and example scripts so Claude Code doesn't have to re-derive the API patterns each time.

---

## Prerequisites

The user needs a Gemini API key in their environment:

```bash
export GEMINI_API_KEY=your_key_here
```

Get one free at: **aistudio.google.com/apikey**.

If the key is not set, tell the user to add it to `.zshrc`/`.bashrc` before proceeding. Do not proceed without it.

---

## Capabilities

| Capability | What it does | When to use |
|---|---|---|
| **Text-to-image** | Generate a brand new image from a prompt | Hero images, backgrounds, illustrations from scratch |
| **Reference images** | Generate using 1–14 source images so the subject stays consistent | Same product/car/character across multiple shots |
| **Image editing** | Modify an existing image (recolor, time-of-day, add/remove elements) | Variants of a hero, A/B versions, dark/light modes |
| **Multi-turn chat** | Iterate on the same image conversationally | Refinement passes, translations, mood shifts |
| **Google Search grounding** | Use real-time web data in the image | Current weather, recent events, live sports |
| **Image Search grounding** | Use real web images as visual context (3.1 Flash only) | Reference-accurate species, products, landmarks |
| **Batch generation** | Generate many images with rate-limit-aware pacing | 5+ images at once |
| **Optimization** | Compress JPEG with mozjpeg or convert to WebP | Production-ready assets, faster page loads |

---

## Quality presets

Always pick a preset rather than the raw model name — keeps prompts cleaner and lets the skill swap models centrally.

| Preset | Model | Cost | When to use |
|---|---|---|---|
| `draft` | `gemini-2.5-flash-image` | Free tier | Prototyping prompts, throwaway shots, free-tier-only users |
| `standard` | `gemini-3.1-flash-image-preview` | ~$0.03 | **Default**. Cards, thumbnails, section visuals, batch generation |
| `hero` | `gemini-3-pro-image-preview` | ~$0.13 | Hero images, brand assets, anything where quality matters most |

**Heuristics:**
- Hero / above-the-fold / brand asset → `hero`
- Editorial section image / product card / background → `standard`
- Quick test / throwaway / prototype → `draft`

---

## Workflow

### Step 1 — Audit the project

Before generating anything, scan files and identify every image needed. Look for:

- Hero sections with no `<img>` or a placeholder `src`
- Cards, grids, galleries missing real visuals
- CSS `background-image` URLs that don't exist on disk
- `background-color` where a photo would be better
- `[IMAGE]`, `placeholder`, `TODO`, or `/* image here */` comments
- Empty `<div>` wrappers clearly meant to hold images
- `object-fit: cover` containers with no source

Output a table for confirmation, e.g.:

| # | Purpose | Aspect | Size | Quality | Path |
|---|---|---|---|---|---|
| 1 | Hero background | 16:9 | 2K | hero | `assets/images/hero.jpg` |
| 2 | Service card 1 | 4:3 | 1K | standard | `assets/images/service-1.jpg` |
| 3 | Service card 2 | 4:3 | 1K | standard | `assets/images/service-2.jpg` |

Get approval before generating.

### Step 2 — Install dependencies

```bash
npm install @google/genai
```

For optimization (optional):
```bash
npm install sharp
```

### Step 3 — Write prompts

Use **descriptive paragraphs**, not keyword lists. The model's strength is language understanding.

**Rules:**
- Hero images: cinematic, atmospheric, wide. No people unless they add story.
- Card / thumbnail: clear subject, clean composition, readable at small sizes.
- Background: subtle, leaves room for text overlays.
- Product / service: hyper-realistic, professional, studio-lighting language ("three-point softbox", "diffused highlights").
- No text or logos unless explicitly requested.
- Always include: lighting, camera angle, mood, quality ("8K", "hyper-realistic", "cinematic").
- Match the site's aesthetic — luxury = dark/moody, SaaS = clean/minimal, lifestyle = warm/editorial.

**Pro techniques:**
- Semantic negatives: "an empty deserted street with no signs of traffic" beats "no cars".
- Hyper-specificity: "ornate elven plate armor etched with silver leaf patterns" beats "fantasy armor".
- Cinematography terms: `wide-angle shot`, `macro`, `low-angle`, `golden hour`, `85mm portrait lens`.
- Step-by-step for complex scenes: "First create the background... Then add..."

Aspect ratio and resolution go in the API config, NOT in the prompt text.

### Step 4 — Use the library

The repo includes `lib/nano-banana.js` with all the API patterns wrapped. Import what you need.

**Basic text-to-image:**
```javascript
import { generate } from "./lib/nano-banana.js"; // adjust path as needed

await generate({
  prompt: "Cinematic wide shot of a black luxury sedan on rain-wet Vienna cobblestone at night...",
  output: "assets/images/hero.jpg",
  aspectRatio: "16:9",
  imageSize: "2K",
  quality: "hero",
});
```

**Batch generation:**
```javascript
import { generateBatch } from "./lib/nano-banana.js";

const jobs = [
  { prompt: "...", output: "assets/images/a.jpg", aspectRatio: "16:9", imageSize: "2K", quality: "hero" },
  { prompt: "...", output: "assets/images/b.jpg", aspectRatio: "4:3", imageSize: "1K", quality: "standard" },
];

await generateBatch(jobs, {
  onProgress: (job, i, total) => console.log(`[${i + 1}/${total}] ${job.output}`),
});
```

**Reference images (consistency):**
```javascript
import { generateWithReferences } from "./lib/nano-banana.js";

await generateWithReferences({
  prompt: "Place this exact car parked at Schloss Schönbrunn at golden hour. Match the references.",
  output: "assets/images/car-schoenbrunn.jpg",
  references: ["assets/reference/car-1.jpg", "assets/reference/car-2.jpg"],
  aspectRatio: "3:2",
  imageSize: "2K",
  quality: "hero",
});
```

**Editing an existing image:**
```javascript
import { edit } from "./lib/nano-banana.js";

await edit({
  input: "assets/images/hero.jpg",
  output: "assets/images/hero-foggy.jpg",
  prompt: "Change the time of day from night to a foggy early morning. Keep everything else identical.",
  aspectRatio: "16:9",
  imageSize: "2K",
  quality: "hero",
});
```

**Multi-turn chat:**
```javascript
import { startChat } from "./lib/nano-banana.js";

const chat = startChat({ quality: "hero" });

await chat.send(
  "Create a vibrant flat-illustration infographic of how airport transfers work, navy/gold palette.",
  "assets/images/v1.jpg",
  { aspectRatio: "4:5", imageSize: "2K" },
);

await chat.send(
  "Make the gold more matte. Keep everything else the same.",
  "assets/images/v2.jpg",
  { aspectRatio: "4:5", imageSize: "2K" },
);
```

**Google Search grounding:**
```javascript
await generate({
  prompt: "Modern weather chart for the next 5 days in Vienna with daily outfit suggestion.",
  output: "assets/images/weather.jpg",
  aspectRatio: "16:9",
  imageSize: "2K",
  quality: "standard",
  googleSearch: true,
});
```

**Optimization:**
```javascript
import { optimize } from "./lib/nano-banana.js";

await optimize("assets/images/hero.jpg", "assets/images/hero.jpg", { quality: 82 });
await optimize("assets/images/hero.jpg", "assets/images/hero.jpg", { webp: true, quality: 82 });
```

### Step 5 — Embed in the project

```html
<!-- Before -->
<div class="hero-bg"></div>

<!-- After -->
<img src="assets/images/hero.jpg" alt="Vienna luxury chauffeur at night" loading="lazy" width="1920" height="1080">
```

```css
.hero {
  background-image: url('assets/images/hero.jpg');
  background-size: cover;
  background-position: center;
}
```

Always add: `alt` text, `loading="lazy"` below the fold, `width`/`height` to prevent layout shift. Prefer `<picture>` with a WebP source when an optimized WebP exists:

```html
<picture>
  <source srcset="assets/images/hero.webp" type="image/webp">
  <img src="assets/images/hero.jpg" alt="..." loading="lazy" width="1920" height="1080">
</picture>
```

### Step 6 — Clean up

After embedding:
1. Move generation scripts to `/scripts` or delete them
2. Consider adding generated images to `.gitignore` and keeping a regenerate script in the repo instead
3. Remove `@google/genai` and `sharp` from runtime deps if they're only used at build time

---

## Aspect ratios

| Use case | Ratio |
|---|---|
| Hero / banner | `16:9` |
| Ultra-wide cinematic | `21:9` |
| Card thumbnail | `4:3`, `3:2` |
| Square (grid, profile, social) | `1:1` |
| Mobile portrait hero | `9:16` |
| Tall card | `3:4`, `4:5` |
| Wide narrow banner (3.1 Flash) | `4:1`, `8:1` |
| Tall narrow skyscraper (3.1 Flash) | `1:4`, `1:8` |

## Resolutions

- `512` — 3.1 Flash only, smallest
- `1K` — default, thumbnails and cards
- `2K` — heroes and full-width
- `4K` — print or very large displays only

**Must be uppercase K** (`2K` not `2k`). `512` has no K suffix.

---

## Rate limits and batching

- Free tier ~10 requests/minute. `generateBatch()` defaults to 6-second delays.
- For 20+ images, consider the Gemini Batch API (24hr turnaround, higher limits). See https://ai.google.dev/gemini-api/docs/batch-api.

---

## Limitations to remember

- **All generated images include a SynthID watermark** (invisible, but legally present). Tell clients if they ask.
- **No transparent backgrounds** — model can't do them. Generate on white, key out in post if needed.
- **No audio/video inputs.**
- **15 supported languages** for prompting: EN, ar-EG, de-DE, es-MX, fr-FR, hi-IN, id-ID, it-IT, ja-JP, ko-KR, pt-BR, ru-RU, ua-UA, vi-VN, zh-CN. German works well for Vienna clients.
- **Text in images**: generate the text first as a string, then prompt for the image containing it. More accurate than asking for both at once.
- **Image Search grounding** can't search for images of people.

---

## Error reference

| Error | Fix |
|---|---|
| `GEMINI_API_KEY is not set` | User exports key in `.zshrc`/`.bashrc` |
| `model not found` | Verify model ID. Fall back to `quality: "draft"` (gemini-2.5-flash-image) |
| `billing required` | Free tier exhausted. Fall back to `quality: "draft"` or enable billing |
| `No image returned` | Prompt too vague or flagged. Refine and retry |
| `rate limit exceeded` | Increase `delayMs` in `generateBatch` to 10000+ |
| `INVALID_ARGUMENT: imageSize` | Use uppercase K (`2K` not `2k`), verify model supports the size |
| `Optimization requires sharp` | `npm install sharp` |

---

## Decision tree

```
ONE image, brand-critical hero?
  → generate({ quality: "hero", aspectRatio: "16:9", imageSize: "2K" })

MANY images for a site (5-20), balanced quality/speed?
  → generateBatch with mostly quality: "standard", hero only for the actual hero

SAME car/product/character across multiple shots?
  → generateWithReferences({ references: [...], quality: "hero" })

Need to tweak an existing generated image?
  → edit({ input, prompt: "change X, keep everything else identical" })

Iterating with the user ("warmer", "now in German", "add a person")?
  → startChat(), then chat.send() repeatedly

Image needs current real-world data (weather, news, sports)?
  → generate({ googleSearch: true })

Production assets that need to be lightweight?
  → optimize() after generation, ideally also write a WebP variant

20+ images at once?
  → Suggest Gemini Batch API to the user instead
```

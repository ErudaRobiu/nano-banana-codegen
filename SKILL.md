---
name: nano-banana-codegen
description: Automatically generate real images for web projects using the Nano Banana (Gemini) API and embed them into the codebase. Use this skill whenever Claude Code is building or editing a website, landing page, component, or any frontend project that needs images — hero images, backgrounds, cards, product shots, section visuals, and so on. Trigger this skill instead of using placeholder divs, gradient backgrounds, or CSS workarounds when real images would improve the project. Also trigger when the user says things like "add real images", "generate images for this project", "use Nano Banana to make images", or "I want actual photos not placeholders". This skill replaces Claude Code's default behavior of avoiding images entirely.
---

# Nano Banana Image Generation for Claude Code

This skill enables Claude Code to generate real, high-quality images via the Nano Banana (Gemini) API and embed them directly into web projects — no placeholders, no gradients, no empty divs.

---

## Prerequisites

The user needs a Gemini API key stored as an environment variable:

```bash
export GEMINI_API_KEY=your_key_here
```

Get one free at: **aistudio.google.com/apikey**

If the key is not set, tell the user to get one and add it to their shell config (`.bashrc`, `.zshrc`, etc.) before proceeding. Do not proceed without it.

---

## Model selection

There are three Nano Banana models. Pick based on the job:

| Model ID | Name | Use when | Notes |
|---|---|---|---|
| `gemini-3-pro-image-preview` | **Nano Banana Pro** | Professional asset production, hero images, complex multi-element compositions, accurate text rendering | Best quality, slower, ~$0.13/image, supports up to 14 reference images (6 objects + 5 characters max) |
| `gemini-3.1-flash-image-preview` | **Nano Banana 2** | Most general use cases, batch generation, when you need 4K or Image Search grounding | Fast, ~$0.03/image, supports up to 14 reference images (10 objects + 4 characters), adds 1:4/4:1/1:8/8:1 ratios and 512 (0.5K) resolution |
| `gemini-2.5-flash-image` | **Nano Banana** (original) | Free tier, simple shots, fallback when others are rate-limited | Fastest, best for prototyping, max 3 input images |

**Default to `gemini-3.1-flash-image-preview`** for most web projects — good balance of quality, speed, and feature support. Use `gemini-3-pro-image-preview` for hero images and assets where quality really matters. Use `gemini-2.5-flash-image` only if billing/rate limit issues hit.

---

## Step 1 — Audit the Project for Image Needs

Before generating anything, scan the project files and identify every place that needs an image. Look for:

- Hero sections with no `<img>` or a placeholder `src`
- Cards, grids, or galleries missing real visuals
- Background images referenced in CSS that don't exist
- `background-color` used where a photo would be more appropriate
- `[IMAGE]`, `placeholder`, `TODO`, or `/* image here */` comments
- Empty `<div>` wrappers that are clearly meant to hold images
- `object-fit: cover` containers with no actual image source

Output a numbered list of every image needed before generating anything. For each one, note:
1. What it's for (hero background, card thumbnail, etc.)
2. Best aspect ratio (`16:9`, `1:1`, `9:16`, `3:4`, etc.)
3. Best resolution (`1K` for thumbnails, `2K` for heroes, `4K` only when needed)
4. The file path where it should be saved

Get confirmation or adjustments from the user if the list is long or ambiguous.

---

## Step 2 — Write Image Prompts

For each image needed, write a **descriptive paragraph**, not a list of keywords. The model's core strength is language understanding — a narrative prompt almost always beats disconnected words.

### Prompt rules for web images:

- **Hero images**: cinematic, wide, atmospheric. No people required unless they add to the story.
- **Card/thumbnail images**: clear subject, clean composition, works at small sizes.
- **Background images**: subtle, not distracting, works behind text. Mention negative space if text will overlay.
- **Product/service images**: precise, professional, hyper-realistic. Use studio-lighting language ("three-point softbox setup", "diffused highlights").
- **No text or logos** in generated images by default — Nano Banana CAN render text well, but only ask for it when explicitly needed.
- Always include: lighting type, camera angle, mood, quality level (`8K`, `hyper-realistic`, `cinematic`).
- Match the site's aesthetic — luxury = dark/moody, SaaS = clean/minimal, lifestyle = warm/editorial.

### Pro prompting techniques

- **Use semantic negative prompts**: instead of "no cars", say "an empty, deserted street with no signs of traffic".
- **Be hyper-specific**: "ornate elven plate armor, etched with silver leaf patterns, with a high collar and pauldrons shaped like falcon wings" beats "fantasy armor".
- **Provide context and intent**: "Create a logo for a high-end, minimalist skincare brand" beats "Create a logo".
- **Use cinematography terms**: `wide-angle shot`, `macro shot`, `low-angle perspective`, `golden hour`, `85mm portrait lens`.
- **For step-by-step composition**: break complex scenes into ordered instructions ("First, create the background... Then, in the foreground, add...").

### Example prompt:

```
A hyper-realistic cinematic wide shot of a sleek black Mercedes-Benz S-Class parked on a rain-wet Vienna cobblestone street at night. City lights reflected on the wet ground. Moody, atmospheric. Shot on a DSLR with a 24mm wide lens, low angle, golden ambient light from street lamps, deep shadows, bokeh background of historic Viennese architecture. Ultra-detailed.
```

Note: aspect ratio and resolution are NOT in the prompt text — they go in the API config (see Step 3).

---

## Step 3 — Generate Images via Gemini API

Use the **new `@google/genai` SDK** (not the legacy `@google/generative-ai`).

### Install the SDK (once per project):

```bash
npm install @google/genai
```

### Generation script pattern:

```javascript
// generate-images.js
import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "node:path";

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey");
  process.exit(1);
}

const ai = new GoogleGenAI({});

const images = [
  {
    prompt: "YOUR DETAILED PROMPT HERE",
    filename: "hero-bg.jpg",
    outputDir: "assets/images",
    aspectRatio: "16:9",   // see ratio list below
    imageSize: "2K",       // "512", "1K", "2K", "4K"
    model: "gemini-3.1-flash-image-preview",
  },
  // add more as needed
];

async function generateImage({ prompt, filename, outputDir, aspectRatio, imageSize, model }) {
  console.log(`Generating: ${filename} (${aspectRatio} ${imageSize})...`);

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
      responseFormat: {
        image: {
          aspectRatio,
          imageSize,
        },
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      fs.mkdirSync(outputDir, { recursive: true });
      const fullPath = path.join(outputDir, filename);
      fs.writeFileSync(fullPath, buffer);
      console.log(`Saved: ${fullPath}`);
      return fullPath;
    }
  }

  console.warn(`No image data returned for ${filename}. Try refining the prompt.`);
}

for (const img of images) {
  try {
    await generateImage(img);
    // Pause between requests to respect rate limits (free tier ~10/min)
    await new Promise((r) => setTimeout(r, 6000));
  } catch (err) {
    console.error(`Failed: ${img.filename} — ${err.message}`);
  }
}
```

Run with:
```bash
node generate-images.js
```

### Available aspect ratios

| Use case | Ratio | Notes |
|---|---|---|
| Hero / banner | `16:9` | Wide cinematic |
| Ultra-wide hero | `21:9` | Cinemascope |
| Card thumbnail | `4:3` or `3:2` | Works at small sizes |
| Square card | `1:1` | Grids, profiles |
| Mobile hero / portrait | `9:16` | Full-screen mobile |
| Tall card | `3:4` or `4:5` | Vertical layouts |
| Banner (3.1 Flash only) | `4:1` or `8:1` | Wide narrow banners |
| Skyscraper (3.1 Flash only) | `1:4` or `1:8` | Tall narrow images |

### Available resolutions

- `512` — 0.5K, smallest, only `gemini-3.1-flash-image-preview` supports this
- `1K` — default, fine for thumbnails and most cards
- `2K` — heroes, banners, anything full-width
- `4K` — only when truly needed (print, very large displays)

**Must use uppercase K** (`1K`, `2K`, `4K`). The `512` value has no K suffix.

### Rate limits

Free tier ~10 requests/minute. Always add a delay between requests:
```javascript
await new Promise(r => setTimeout(r, 6000));
```

For 20+ images, consider the Batch API (24hr turnaround, higher rate limits) — see https://ai.google.dev/gemini-api/docs/batch-api.

---

## Step 4 — Advanced: Reference images for consistency

When you need the **same subject across multiple shots** (e.g. the same Mercedes S-Class in the hero, the about section, and a card grid for a chauffeur site), pass reference images.

```javascript
import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";

const ai = new GoogleGenAI({});

const referenceImage = fs.readFileSync("assets/reference/black-s-class.jpg");
const base64Ref = referenceImage.toString("base64");

const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-image-preview",
  contents: [
    { text: "Place this exact car parked in front of the Vienna State Opera at golden hour, cinematic wide shot, 24mm lens, hyper-realistic." },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Ref,
      },
    },
  ],
  config: {
    responseModalities: ["IMAGE"],
    responseFormat: { image: { aspectRatio: "16:9", imageSize: "2K" } },
  },
});
```

Limits per model:
- `gemini-3.1-flash-image-preview`: up to 10 object refs + 4 character refs (14 total)
- `gemini-3-pro-image-preview`: up to 6 object refs + 5 character refs (14 total)
- `gemini-2.5-flash-image`: max 3 input images

---

## Step 5 — Advanced: Image editing (existing image as input)

To modify an existing image instead of generating from scratch (recoloring, adding/removing elements, style transfer), pass the image as a reference and describe the change:

```javascript
const original = fs.readFileSync("assets/images/hero-bg.jpg");
const base64Original = original.toString("base64");

const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-image-preview",
  contents: [
    { text: "Change the time of day in this image from night to a foggy early morning. Keep the car, the street, and the architecture exactly the same. Only change the lighting and atmosphere." },
    {
      inlineData: { mimeType: "image/jpeg", data: base64Original },
    },
  ],
  config: {
    responseModalities: ["IMAGE"],
    responseFormat: { image: { aspectRatio: "16:9", imageSize: "2K" } },
  },
});
```

For complex multi-step edits (e.g. "first change the car color, then move it to a different location"), use the **chat API** for multi-turn iteration — see https://ai.google.dev/gemini-api/docs/image-generation#multi-turn_image_editing.

---

## Step 6 — Embed Images into the Project

After generation, update every reference in the HTML/CSS/JS to use the real image paths.

### HTML:
```html
<!-- Before -->
<div class="hero-bg"></div>

<!-- After -->
<img src="assets/images/hero-bg.jpg" alt="Vienna luxury chauffeur service at night" loading="lazy" width="1920" height="1080">
```

### CSS background-image:
```css
/* Before */
.hero { background-color: #1a1a1a; }

/* After */
.hero {
  background-image: url('assets/images/hero-bg.jpg');
  background-size: cover;
  background-position: center;
}
```

### Always add:
- `alt` text describing the image content (SEO + accessibility)
- `loading="lazy"` on images below the fold
- `width` and `height` attributes to prevent layout shift

---

## Step 7 — Clean Up

After embedding:
1. Delete `generate-images.js` (or move it to a `/scripts` folder if the user wants to reuse it)
2. Optionally remove `@google/genai` from `package.json` if it's not needed at runtime
3. Consider adding `/assets/images/*.jpg` to `.gitignore` if the user doesn't want generated images committed (and adding a regen script to the README instead)

---

## Important limitations

- **All generated images have a SynthID watermark** (invisible, but present — let the user know)
- **No transparent backgrounds** — Nano Banana can't generate them. Use white background and remove it in post if needed.
- **Best with these languages**: EN, ar-EG, de-DE, es-MX, fr-FR, hi-IN, id-ID, it-IT, ja-JP, ko-KR, pt-BR, ru-RU, ua-UA, vi-VN, zh-CN. German (de-DE) is supported, great for Vienna clients.
- **Text rendering tip**: when generating an image with text, first ask the model to write the text, then ask for an image containing it. This produces more accurate results.
- **No audio/video input** — image input only.
- **People search**: Image Search grounding can't be used to search for images of people.

---

## Error Handling

| Error | Fix |
|---|---|
| `GEMINI_API_KEY not set` | Tell user to export it in their terminal |
| `model not found` | Verify the model ID — these change. Try `gemini-2.5-flash-image` as fallback |
| `billing required` | Free tier exhausted — fall back to `gemini-2.5-flash-image` (free tier available) or have the user enable billing |
| `response has no image part` | Prompt may be too vague or content-flagged — refine the prompt and retry |
| `rate limit exceeded` | Increase delay to 10s+ between requests, or use Batch API for large jobs |
| `INVALID_ARGUMENT: imageSize` | Make sure resolution uses uppercase K (`2K` not `2k`), and that the model supports it |

---

## Quick decision tree

```
Need a single hero image, quality matters most?
  → gemini-3-pro-image-preview, 16:9, 2K

Need 5-20 images across a site, balanced quality/speed?
  → gemini-3.1-flash-image-preview, per-image ratio, 1K or 2K

Need a quick prototype or testing prompts?
  → gemini-2.5-flash-image, 1:1, 1K

Same product/car/character across multiple images?
  → Pass reference image, use gemini-3.1-flash-image-preview or 3-pro

Image needs current real-world info (weather, news, sports)?
  → Add google_search tool, see ai.google.dev/gemini-api/docs/google-search

Need 20+ images at once?
  → Batch API (24hr turnaround), see ai.google.dev/gemini-api/docs/batch-api
```

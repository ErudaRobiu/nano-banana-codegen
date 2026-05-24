---
name: nano-banana-codegen
description: Automatically generate real images for web projects using the Nano Banana Pro (Gemini) API and embed them into the codebase. Use this skill whenever Claude Code is building or editing a website, landing page, component, or any frontend project that needs images — hero images, backgrounds, cards, product shots, section visuals, and so on. Trigger this skill instead of using placeholder divs, gradient backgrounds, or CSS workarounds when real images would improve the project. Also trigger when the user says things like "add real images", "generate images for this project", "use Nano Banana to make images", or "I want actual photos not placeholders". This skill replaces Claude Code's default behavior of avoiding images entirely.
---

# Nano Banana Image Generation for Claude Code

This skill enables Claude Code to generate real, high-quality images via the Nano Banana Pro (Gemini) API and embed them directly into web projects — no placeholders, no gradients, no empty divs.

---

## Prerequisites

The user needs a Gemini API key stored as an environment variable:

```bash
export GEMINI_API_KEY=your_key_here
```

Get one free at: **aistudio.google.com/apikey**

If the key is not set, tell the user to get one and add it to their shell config (`.bashrc`, `.zshrc`, etc.) before proceeding. Do not proceed without it.

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
3. The file path where it should be saved

Get confirmation or adjustments from the user if the list is long or ambiguous.

---

## Step 2 — Write Image Prompts

For each image needed, write a detailed prompt following the **nano-banana-prompt skill** patterns. Do not write vague prompts.

### Prompt rules for web images:

- **Hero images**: cinematic, wide, atmospheric. No people required unless they add to the story.
- **Card/thumbnail images**: clear subject, clean composition, works at small sizes.
- **Background images**: subtle, not distracting, works behind text.
- **Product/service images**: precise, professional, hyper-realistic.
- **No text or logos** in any generated image.
- Always include: lighting type, camera angle, mood, quality level (`8K`, `hyper-realistic`, `cinematic`).
- Match the site's aesthetic — luxury = dark/moody, SaaS = clean/minimal, lifestyle = warm/editorial.

### Prompt format to send to the API:

Convert the JSON structure to a flat, detailed text string for the API call. Example:

```
Hyper-realistic cinematic wide shot of a sleek black Mercedes-Benz S-Class parked on a rain-wet Vienna cobblestone street at night. City lights reflected on the wet ground. Moody, atmospheric. Shot on DSLR 24mm wide lens, low angle, golden ambient light from street lamps, deep shadows, bokeh background of historic Viennese architecture. 8K ultra-detailed. No text, no logos.
```

---

## Step 3 — Generate Images via Gemini API

Use this Node.js script pattern. Run it with `node` inside the project directory.

### Install the SDK (once per project):

```bash
npm install @google/generative-ai
```

### Generation script pattern:

```javascript
// generate-images.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

const images = [
  {
    prompt: "YOUR DETAILED PROMPT HERE",
    filename: "hero-bg.jpg",
    outputDir: "assets/images"
  },
  // add more as needed
];

async function generateImage({ prompt, filename, outputDir }) {
  console.log(`Generating: ${filename}...`);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  });

  const response = result.response;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      const fullPath = path.join(outputDir, filename);
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(fullPath, buffer);
      console.log(`Saved: ${fullPath}`);
      return fullPath;
    }
  }
}

for (const img of images) {
  await generateImage(img);
}
```

Run with:
```bash
node generate-images.js
```

### Fallback — if ESM doesn't work, use CommonJS:

Replace `import` with `require` and use `.cjs` extension or add `"type": "commonjs"` to package.json.

### Rate limits:

- Free tier: ~10 requests/minute. Add a delay between requests if generating many images:
  ```javascript
  await new Promise(r => setTimeout(r, 6000)); // 6 second pause
  ```

---

## Step 4 — Embed Images into the Project

After generation, update every reference in the HTML/CSS/JS to use the real image paths.

### HTML:
```html
<!-- Before -->
<div class="hero-bg"></div>

<!-- After -->
<img src="assets/images/hero-bg.jpg" alt="Vienna luxury chauffeur service at night" loading="lazy">
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
- `alt` text describing the image content (important for SEO and accessibility)
- `loading="lazy"` on images below the fold
- `width` and `height` attributes where known to prevent layout shift

---

## Step 5 — Clean Up

After embedding:
1. Delete `generate-images.js` (or move it to a `/scripts` folder if the user wants to reuse it)
2. Optionally remove `@google/generative-ai` from `package.json` if it's not needed at runtime
3. Add `/assets/images/*.jpg` to `.gitignore` if the user doesn't want generated images committed

---

## Error Handling

| Error | Fix |
|---|---|
| `GEMINI_API_KEY not set` | Tell user to export it in their terminal |
| `model not found` | Try `gemini-2.5-flash-image` as fallback model |
| `billing required` | Free tier may be exhausted — suggest trying `gemini-2.5-flash-image` (cheaper) |
| `response has no image part` | Prompt may be too vague or flagged — refine the prompt and retry |
| `rate limit exceeded` | Add `await new Promise(r => setTimeout(r, 10000))` between requests |

---

## Model Options

| Model ID | Quality | Cost | Speed |
|---|---|---|---|
| `gemini-3-pro-image-preview` | Best (Nano Banana Pro) | ~$0.13/image paid | Slower |
| `gemini-3.1-flash-image-preview` | Great (Nano Banana 2) | ~$0.03/image paid | Fast |
| `gemini-2.5-flash-image` | Good (original Nano Banana) | Free tier available | Fastest |

Start with `gemini-3-pro-image-preview`. If rate limited or billing issues occur, fall back to `gemini-2.5-flash-image`.

---

## Quick Reference — Aspect Ratios for Web

| Use Case | Ratio | Notes |
|---|---|---|
| Hero / banner | 16:9 | Wide cinematic |
| Card thumbnail | 4:3 or 3:2 | Works at small sizes |
| Square card | 1:1 | Grids, profiles |
| Portrait / mobile hero | 9:16 | Full-screen mobile |
| Tall card | 3:4 | Vertical layouts |

The Gemini API currently generates at a default resolution — specify aspect ratio in the prompt text itself (e.g., "16:9 wide cinematic composition") since the `aspectRatio` parameter may not be supported in all SDK versions.

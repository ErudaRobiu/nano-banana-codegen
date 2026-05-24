/**
 * Edit an existing image (recolor, add/remove elements, style transfer).
 *
 * Edit the `edits` array, then:
 *   npm install @google/genai
 *   node examples/edit-image.js
 */

import { edit } from "../lib/nano-banana.js";

const edits = [
  {
    input: "assets/images/hero-bg.jpg",
    output: "assets/images/hero-bg-foggy.jpg",
    prompt:
      "Change the time of day in this image from night to a foggy early morning. Keep the car, the street, and the architecture exactly the same. Only change the lighting and atmosphere.",
    aspectRatio: "16:9",
    imageSize: "2K",
    quality: "hero",
  },
  {
    input: "assets/images/product-mug.jpg",
    output: "assets/images/product-mug-cream.jpg",
    prompt:
      "Change the color of the mug from matte black to a soft cream/off-white. Keep the lighting, background, steam, and composition identical.",
    aspectRatio: "1:1",
    imageSize: "1K",
    quality: "standard",
  },
];

for (let i = 0; i < edits.length; i++) {
  const e = edits[i];
  console.log(`[${i + 1}/${edits.length}] Editing ${e.input} -> ${e.output}`);
  try {
    await edit(e);
    console.log(`  Saved.`);
  } catch (err) {
    console.error(`  Failed: ${err.message}`);
  }
  if (i < edits.length - 1) {
    await new Promise((r) => setTimeout(r, 6000));
  }
}

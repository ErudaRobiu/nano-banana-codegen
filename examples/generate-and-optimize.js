/**
 * Generate then optimize: compress to JPEG (mozjpeg) or convert to WebP.
 * Cuts file size 40-70% with minimal quality loss.
 *
 *   npm install @google/genai sharp
 *   node examples/generate-and-optimize.js
 */

import { generate, optimize } from "../lib/nano-banana.js";

const output = "assets/images/hero-bg.jpg";

console.log("Generating...");
await generate({
  prompt:
    "Cinematic wide shot of an empty modern airport terminal at dawn. Floor-to-ceiling glass, soft pink and blue sky outside, polished floor reflecting the light. Architectural minimalism. Ultra-detailed.",
  output,
  aspectRatio: "21:9",
  imageSize: "4K",
  quality: "hero",
});

console.log("Optimizing JPEG...");
await optimize(output, output, { quality: 82 });

console.log("Also creating WebP version...");
await optimize(output, output, { webp: true, quality: 82 });

console.log("Done. JPEG and WebP variants ready.");

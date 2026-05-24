/**
 * Basic text-to-image generation.
 * Edit the `images` array, then:
 *   npm install @google/genai
 *   node examples/generate-basic.js
 */

import { generateBatch } from "../lib/nano-banana.js";

const images = [
  {
    prompt:
      "A hyper-realistic cinematic wide shot of a sleek black luxury sedan parked on a rain-wet cobblestone street at night. City lights reflected on the wet ground. Moody, atmospheric. Shot on a DSLR with a 24mm wide lens, low angle, golden ambient light from street lamps, deep shadows, bokeh background of historic European architecture. Ultra-detailed.",
    output: "assets/images/hero-bg.jpg",
    aspectRatio: "16:9",
    imageSize: "2K",
    quality: "hero", // uses gemini-3-pro-image-preview
  },
  {
    prompt:
      "A high-resolution studio product shot of a minimalist matte-black ceramic coffee mug on polished concrete. Three-point softbox lighting, slight 45-degree elevation, sharp focus, steam rising. Square composition.",
    output: "assets/images/product-mug.jpg",
    aspectRatio: "1:1",
    imageSize: "1K",
    quality: "standard",
  },
];

const results = await generateBatch(images, {
  onProgress: (job, i, total) =>
    console.log(`[${i + 1}/${total}] ${job.output}`),
});

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error("\nFailures:");
  failed.forEach((r) => console.error(`  ${r.job.output}: ${r.error}`));
}
console.log(`\nDone. ${results.length - failed.length}/${results.length} saved.`);

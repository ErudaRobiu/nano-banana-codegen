/**
 * Multi-image consistency using reference images.
 *
 * Use case: place the same product/car/character in multiple scenes,
 * keeping the subject visually identical across all shots.
 *
 * Edit the `references` array (the source images you have on disk) and
 * the `shots` array (the new scenes you want to generate).
 *
 *   npm install @google/genai
 *   node examples/generate-with-references.js
 */

import { generateBatch } from "../lib/nano-banana.js";

// Reference images you already have on disk. Up to 14 for Gemini 3 image models.
const references = [
  "assets/reference/black-s-class-1.jpg",
  "assets/reference/black-s-class-2.jpg",
];

const shots = [
  {
    prompt:
      "Place this exact car parked in front of the Vienna State Opera at golden hour. Cinematic wide shot, 24mm lens, hyper-realistic. The car must look identical to the reference images.",
    output: "assets/images/car-opera.jpg",
    aspectRatio: "16:9",
    imageSize: "2K",
  },
  {
    prompt:
      "The same car driving through the snowy Vienna Ringstrasse at dusk. Long exposure light trails from other cars. The car itself is sharp and identical to the references.",
    output: "assets/images/car-ringstrasse.jpg",
    aspectRatio: "21:9",
    imageSize: "2K",
  },
  {
    prompt:
      "Close-up three-quarter front view of the same car parked at Schloss Schönbrunn, morning fog, soft natural light. Match the references exactly.",
    output: "assets/images/car-schoenbrunn.jpg",
    aspectRatio: "3:2",
    imageSize: "2K",
  },
];

const jobs = shots.map((s) => ({
  ...s,
  references,
  quality: "hero", // hero quality is best for matching reference details
}));

const results = await generateBatch(jobs, {
  onProgress: (job, i, total) =>
    console.log(`[${i + 1}/${total}] ${job.output}`),
});

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error("\nFailures:");
  failed.forEach((r) => console.error(`  ${r.job.output}: ${r.error}`));
}
console.log(`\nDone. ${results.length - failed.length}/${results.length} saved.`);

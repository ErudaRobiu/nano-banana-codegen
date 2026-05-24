/**
 * generate-images.js
 *
 * Minimal starter script for generating images via Nano Banana Pro.
 * Edit the `images` array below, then run:
 *
 *   npm install @google/generative-ai
 *   node examples/generate-images.js
 *
 * Requires GEMINI_API_KEY in your environment.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

// ---- Edit this list ----
const images = [
  {
    prompt:
      "Hyper-realistic cinematic wide shot of a sleek black luxury sedan parked on a rain-wet cobblestone street at night. City lights reflected on the wet ground. Moody, atmospheric. Shot on DSLR 24mm wide lens, low angle, golden ambient light from street lamps, deep shadows, bokeh background of historic European architecture. 16:9 wide cinematic composition. 8K ultra-detailed. No text, no logos.",
    filename: "hero-bg.jpg",
    outputDir: "assets/images",
  },
  // add more entries here
];

// ---- Generation logic ----
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

async function run() {
  for (const img of images) {
    try {
      await generateImage(img);
      // Pause between requests to respect rate limits (free tier ~10/min)
      await new Promise((r) => setTimeout(r, 6000));
    } catch (err) {
      console.error(`Failed to generate ${img.filename}:`, err.message);
    }
  }
}

run();

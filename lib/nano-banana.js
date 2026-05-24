/**
 * lib/nano-banana.js
 *
 * Shared library for all Nano Banana image operations.
 * Wraps the @google/genai SDK with clean, opinionated helpers.
 *
 * Quality presets:
 *   draft    → gemini-2.5-flash-image (free tier, fastest, prototyping)
 *   standard → gemini-3.1-flash-image-preview (default, balanced)
 *   hero     → gemini-3-pro-image-preview (best quality, hero shots)
 */

import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "node:path";

const MODELS = {
  draft: "gemini-2.5-flash-image",
  standard: "gemini-3.1-flash-image-preview",
  hero: "gemini-3-pro-image-preview",
};

export function makeClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey",
    );
  }
  return new GoogleGenAI({});
}

function resolveModel({ quality = "standard", model }) {
  if (model) return model;
  if (!MODELS[quality]) {
    throw new Error(
      `Unknown quality "${quality}". Use one of: ${Object.keys(MODELS).join(", ")}`,
    );
  }
  return MODELS[quality];
}

function loadImageAsPart(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  const mimeType =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";

  return {
    inlineData: {
      mimeType,
      data: fs.readFileSync(filePath).toString("base64"),
    },
  };
}

function buildConfig({
  aspectRatio = "1:1",
  imageSize = "1K",
  thinkingLevel,
  includeThoughts = false,
  googleSearch = false,
  imageSearch = false,
}) {
  const config = {
    responseModalities: ["IMAGE"],
    responseFormat: {
      image: { aspectRatio, imageSize },
    },
  };

  if (thinkingLevel) {
    config.thinkingConfig = {
      thinkingLevel,
      includeThoughts,
    };
  }

  if (googleSearch || imageSearch) {
    const searchTypes = {};
    if (googleSearch) searchTypes.webSearch = {};
    if (imageSearch) searchTypes.imageSearch = {};
    config.tools = [{ googleSearch: { searchTypes } }];
  }

  return config;
}

async function extractImage(response, outputPath) {
  for (const part of response.candidates[0].content.parts) {
    if (part.thought) continue;
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, buffer);
      return outputPath;
    }
  }
  return null;
}

/**
 * Generate an image from a text prompt.
 *
 * @param {object} opts
 * @param {string} opts.prompt - Descriptive prompt
 * @param {string} opts.output - Full file path to save to (e.g. "assets/images/hero.jpg")
 * @param {string} [opts.aspectRatio="1:1"]
 * @param {string} [opts.imageSize="1K"]
 * @param {string} [opts.quality="standard"] - draft | standard | hero
 * @param {string} [opts.model] - Override quality preset with an explicit model ID
 * @param {string} [opts.thinkingLevel] - "minimal" | "high" (3.1 Flash only)
 * @param {boolean} [opts.googleSearch=false] - Enable Google Search grounding
 * @param {boolean} [opts.imageSearch=false] - Enable Image Search grounding (3.1 Flash only)
 * @param {GoogleGenAI} [opts.ai] - Pass an existing client to reuse
 */
export async function generate({
  prompt,
  output,
  aspectRatio = "1:1",
  imageSize = "1K",
  quality = "standard",
  model,
  thinkingLevel,
  googleSearch = false,
  imageSearch = false,
  ai,
}) {
  const client = ai || makeClient();
  const resolvedModel = resolveModel({ quality, model });

  const response = await client.models.generateContent({
    model: resolvedModel,
    contents: prompt,
    config: buildConfig({
      aspectRatio,
      imageSize,
      thinkingLevel,
      googleSearch,
      imageSearch,
    }),
  });

  const saved = await extractImage(response, output);
  if (!saved) {
    throw new Error(`No image returned for ${output}. Refine the prompt.`);
  }
  return saved;
}

/**
 * Generate using reference images for consistency (product, character, scene).
 *
 * @param {object} opts
 * @param {string} opts.prompt
 * @param {string} opts.output
 * @param {string[]} opts.references - Array of file paths to use as references
 * @param {string} [opts.aspectRatio="1:1"]
 * @param {string} [opts.imageSize="1K"]
 * @param {string} [opts.quality="standard"]
 * @param {string} [opts.model]
 * @param {GoogleGenAI} [opts.ai]
 */
export async function generateWithReferences({
  prompt,
  output,
  references = [],
  aspectRatio = "1:1",
  imageSize = "1K",
  quality = "standard",
  model,
  ai,
}) {
  if (!references.length) {
    throw new Error("generateWithReferences requires at least one reference image.");
  }

  const client = ai || makeClient();
  const resolvedModel = resolveModel({ quality, model });

  const refLimits = {
    "gemini-2.5-flash-image": 3,
    "gemini-3.1-flash-image-preview": 14,
    "gemini-3-pro-image-preview": 14,
  };
  const limit = refLimits[resolvedModel] || 3;
  if (references.length > limit) {
    throw new Error(
      `${resolvedModel} supports at most ${limit} reference images, got ${references.length}.`,
    );
  }

  const parts = [{ text: prompt }, ...references.map(loadImageAsPart)];

  const response = await client.models.generateContent({
    model: resolvedModel,
    contents: parts,
    config: buildConfig({ aspectRatio, imageSize }),
  });

  const saved = await extractImage(response, output);
  if (!saved) {
    throw new Error(`No image returned for ${output}. Refine the prompt.`);
  }
  return saved;
}

/**
 * Edit an existing image (recolor, add/remove elements, style transfer, etc.).
 * This is a convenience wrapper around generateWithReferences with one reference.
 */
export async function edit({
  prompt,
  input,
  output,
  aspectRatio = "1:1",
  imageSize = "1K",
  quality = "standard",
  model,
  ai,
}) {
  return generateWithReferences({
    prompt,
    output,
    references: [input],
    aspectRatio,
    imageSize,
    quality,
    model,
    ai,
  });
}

/**
 * Multi-turn chat for iterative image editing.
 * Returns a chat object you can call .send(prompt) on repeatedly.
 *
 * @param {object} opts
 * @param {string} [opts.quality="standard"]
 * @param {string} [opts.model]
 * @param {GoogleGenAI} [opts.ai]
 */
export function startChat({ quality = "standard", model, ai } = {}) {
  const client = ai || makeClient();
  const resolvedModel = resolveModel({ quality, model });

  const chat = client.chats.create({
    model: resolvedModel,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  return {
    /**
     * Send a message and save the resulting image.
     * @param {string} message
     * @param {string} output - Path to save the image
     * @param {object} [opts] - { aspectRatio, imageSize }
     */
    async send(message, output, opts = {}) {
      const config = opts.aspectRatio || opts.imageSize
        ? {
            responseFormat: {
              image: {
                aspectRatio: opts.aspectRatio || "1:1",
                imageSize: opts.imageSize || "1K",
              },
            },
          }
        : undefined;

      const response = await chat.sendMessage({ message, config });
      const saved = await extractImage(response, output);
      if (!saved) {
        throw new Error(`No image returned for ${output}.`);
      }
      return saved;
    },
  };
}

/**
 * Generate many images sequentially with rate-limit-friendly delays.
 *
 * @param {Array<object>} jobs - Array of generate() option objects
 * @param {object} [opts]
 * @param {number} [opts.delayMs=6000] - Delay between requests (free tier ~10/min)
 * @param {function} [opts.onProgress] - Called as (job, index, total)
 */
export async function generateBatch(jobs, { delayMs = 6000, onProgress } = {}) {
  const ai = makeClient();
  const results = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (onProgress) onProgress(job, i, jobs.length);

    try {
      const fn = job.references ? generateWithReferences : generate;
      const saved = await fn({ ...job, ai });
      results.push({ ok: true, output: saved, job });
    } catch (err) {
      results.push({ ok: false, error: err.message, job });
    }

    if (i < jobs.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}

/**
 * Optimize a generated image: compress + optionally convert to WebP.
 * Requires `sharp` to be installed.
 *
 * @param {string} input - Path to the source image
 * @param {string} [output] - Defaults to overwriting input
 * @param {object} [opts]
 * @param {boolean} [opts.webp=false] - Convert to WebP
 * @param {number} [opts.quality=82] - JPEG/WebP quality
 */
export async function optimize(input, output, { webp = false, quality = 82 } = {}) {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    throw new Error(
      "Optimization requires `sharp`. Install with: npm install sharp",
    );
  }

  const target = output || input;
  const pipeline = sharp(input);

  if (webp) {
    await pipeline.webp({ quality }).toFile(target.replace(/\.(jpg|jpeg|png)$/i, ".webp"));
  } else {
    const ext = path.extname(target).toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") {
      await pipeline.jpeg({ quality, mozjpeg: true }).toFile(target + ".tmp");
    } else if (ext === ".png") {
      await pipeline.png({ compressionLevel: 9 }).toFile(target + ".tmp");
    } else {
      await pipeline.toFile(target + ".tmp");
    }
    fs.renameSync(target + ".tmp", target);
  }

  return target;
}

export { MODELS };

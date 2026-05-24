/**
 * Multi-turn chat for iterative image refinement.
 *
 * Each .send() builds on the previous turn — perfect for "make it a bit warmer",
 * "now add a person in the foreground", "translate the text to German", etc.
 *
 *   npm install @google/genai
 *   node examples/chat-iterate.js
 */

import { startChat } from "../lib/nano-banana.js";

const chat = startChat({ quality: "hero" });

console.log("Turn 1: initial generation...");
await chat.send(
  "A vibrant infographic that explains how chauffeur airport transfers work as if it were a recipe. Three steps: book online, driver meets you at arrivals, door-to-door delivery. Style: clean modern flat illustration, navy and gold palette.",
  "assets/images/transfer-infographic-1.jpg",
  { aspectRatio: "4:5", imageSize: "2K" },
);

console.log("Turn 2: refinement...");
await chat.send(
  "Make the navy a bit darker and the gold more matte. Keep everything else the same.",
  "assets/images/transfer-infographic-2.jpg",
  { aspectRatio: "4:5", imageSize: "2K" },
);

console.log("Turn 3: translate to German...");
await chat.send(
  "Translate all the text in this infographic to German. Do not change any visual elements, colors, or layout.",
  "assets/images/transfer-infographic-de.jpg",
  { aspectRatio: "4:5", imageSize: "2K" },
);

console.log("Done.");

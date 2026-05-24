/**
 * Generate images grounded in real-time information via Google Search.
 *
 * Useful for: weather visuals, news graphics, sports recaps, anything
 * where the image needs to reflect current real-world data.
 *
 *   npm install @google/genai
 *   node examples/with-google-search.js
 */

import { generate } from "../lib/nano-banana.js";

await generate({
  prompt:
    "A clean modern weather chart visualizing the next 5 days in Vienna, Austria. Show daily temperature, weather icon, and a suggested outfit for each day. Navy/gold palette, minimal layout, large readable type.",
  output: "assets/images/vienna-weather.jpg",
  aspectRatio: "16:9",
  imageSize: "2K",
  quality: "standard",
  googleSearch: true,
});

console.log("Done. Image uses live weather data from Google Search.");

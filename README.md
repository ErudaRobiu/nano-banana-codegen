# nano-banana-codegen

A Claude Code skill that generates real images via Google's Nano Banana Pro (Gemini) API and embeds them directly into web projects. No more placeholder divs, gradient backgrounds, or empty `<img>` tags.

When this skill is installed, Claude Code will:

1. Scan the project for places that need images
2. Write detailed prompts for each one
3. Generate the images via the Gemini API
4. Save them into the project and update HTML/CSS/JS references
5. Clean up after itself

---

## Why this exists

By default, Claude Code avoids generating images and falls back to coloured divs, CSS gradients, or `[placeholder]` comments. This skill flips that behaviour: when a real photograph would make the page better, Claude Code will actually go and make one.

Use it for hero images, card thumbnails, backgrounds, product shots, section visuals — anything where a real image beats a placeholder.

---

## Installation

### Option A — install for Claude Code (recommended)

Clone this repo into your Claude Code skills directory:

```bash
cd ~/.claude/skills
git clone https://github.com/ErudaRobiu/nano-banana-codegen.git
```

Claude Code will pick it up automatically next time it starts.

### Option B — install per-project

If you only want the skill available in one project, clone it into the project's `.claude/skills/` folder:

```bash
cd your-project
mkdir -p .claude/skills
cd .claude/skills
git clone https://github.com/ErudaRobiu/nano-banana-codegen.git
```

### Option C — install for Claude.ai (web/desktop)

Upload the `SKILL.md` file directly into a Claude Project's custom instructions or skills panel.

---

## Setup

You need a Gemini API key. Get one free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

Add it to your shell config (`.bashrc`, `.zshrc`, etc.):

```bash
export GEMINI_API_KEY=your_key_here
```

Reload your shell or run `source ~/.zshrc`, then verify:

```bash
echo $GEMINI_API_KEY
```

---

## Usage

Once installed, just ask Claude Code naturally:

- "Add real images to this landing page"
- "Generate hero images for this project using Nano Banana"
- "I want actual photos, not placeholders"
- "Fill in the missing visuals on the homepage"

Claude Code will run through the full workflow: audit, prompt, generate, embed, clean up.

---

## What you get

The skill outputs:

- Real `.jpg` or `.png` files saved to your project (default: `assets/images/`)
- Updated HTML/CSS/JS that references them
- Proper `alt` text, `loading="lazy"`, and width/height attributes for performance and accessibility

---

## Example starter script

If you want to run image generation manually without the skill, see [`examples/generate-images.js`](examples/generate-images.js). It's a minimal Node.js script you can drop into any project, edit the prompts list, and run.

```bash
npm install @google/generative-ai
node examples/generate-images.js
```

---

## Models

| Model ID | Quality | Cost | Speed |
|---|---|---|---|
| `gemini-3-pro-image-preview` | Best (Nano Banana Pro) | ~$0.13/image paid | Slower |
| `gemini-3.1-flash-image-preview` | Great (Nano Banana 2) | ~$0.03/image paid | Fast |
| `gemini-2.5-flash-image` | Good (original Nano Banana) | Free tier available | Fastest |

The skill defaults to `gemini-3-pro-image-preview`. If you hit rate limits or billing issues, fall back to `gemini-2.5-flash-image`.

---

## Roadmap / ideas

Things to potentially add:

- [ ] Support for image editing (not just generation) using Nano Banana's edit endpoint
- [ ] Aspect ratio enforcement via SDK parameters once stable
- [ ] Automatic image optimization (compression, WebP conversion) after generation
- [ ] Style presets (luxury, SaaS, lifestyle, editorial) baked into prompt templates
- [ ] Multi-image consistency (same character/product across multiple shots)
- [ ] CLI mode so it can be used outside Claude Code

PRs welcome.

---

## Related

- [`nano-banana-prompt`](https://github.com/ErudaRobiu/nano-banana-prompt) — companion skill for crafting Nano Banana JSON prompts

---

## License

MIT. See [LICENSE](LICENSE).

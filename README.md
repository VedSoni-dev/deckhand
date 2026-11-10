# Deckhand

A free, open-source AI deck maker. Type a topic or paste your notes, fix the outline, and watch a designed slide deck write itself one card at a time. A free alternative to Gamma.

- **No credits, no watermark, no sign-up.** Decks are saved in your browser.
- **Real PowerPoint export.** Titles, bullets, cards and charts are native, editable objects, not pictures of slides.
- **Thirteen layouts, eight themes.** Stats, timelines, comparisons, charts, quotes, big numbers. Restyle the whole deck in one click.
- **It moves.** Slides build in with staggered motion, numbers count up, bars grow, and you pick the transition between slides.
- **Your deck as code.** Export one self-contained, animated `.html` file that plays in any browser.
- **Edit anything.** Click any text to change it, switch a slide's layout, or ask the AI to rewrite one slide.
- **Share by link.** The whole deck is packed into the URL; nothing is uploaded.
- **Bring any model.** publik API (no key to paste), your own OpenAI or Anthropic key, or any OpenAI-compatible endpoint such as OpenRouter or Ollama.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000, click **Set up AI**, and paste an OpenAI or Anthropic API key. Own keys stay in your browser and go straight to the provider; they never touch the server.

To offer publik API to your visitors, copy `.env.example` to `.env.local` and set `PUBLIK_APP_TOKEN`.

```bash
npm run build && npm start            # production
npm run build && PUBLIK_SELF_TEST=1 npm start   # prove the publik wiring, then exit
```

## How it works

1. **Outline.** The model plans the deck as one JSON object per line: a title and a one-sentence gist for each slide. You edit the plan before anything is built.
2. **Slides.** The model writes each slide as one line of JSON, choosing from thirteen layout shapes. A tolerant line parser renders every slide the moment its line completes, so cards appear while the rest is still being written.
3. **Render.** Slides are drawn on a fixed 1280×720 canvas from theme tokens, so restyling never touches content and print, present and export all match.

Slide JSON is normalised before it is drawn (`lib/parse.ts`), so a weaker model's sloppy output still produces a valid deck.

## Limits, honestly

- No images yet: artwork is generative and drawn from the theme.
- No accounts or collaboration. Decks live in one browser unless you share a link or export.
- PowerPoint export uses system fonts, so type differs slightly from the web view.
- The model can be wrong. The prompts forbid invented statistics, but check any number before you present it.

## Stack

Next.js (App Router), TypeScript, Tailwind, pptxgenjs. MIT licensed.

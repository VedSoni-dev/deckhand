# Research notes (10 Nov 2026)

What shaped Deckhand's v1. Prices and star counts were read on the date above and will drift.

## How Gamma works
- Flow: prompt or pasted notes → a plan/outline you approve → one theme for the deck → slides stream in → chat edits and one-click restyle.
- Fixed 16:9 canvas; layouts include grids, timelines, columns, galleries. Images come from AI models, stock libraries or uploads.
- Exports PDF, PNG, PPTX and Google Slides (via PPTX).
- Pricing: Free gets 400 credits once, never refilled, max 10 slides per prompt. Plus $12/mo (1,500 credits), Pro $25/mo (4,000), Ultra $100/mo (20,000), billed monthly.

## Open-source alternatives
- **Presenton** (~11.8k stars, Apache-2.0): Next.js + FastAPI, Docker/Electron. Outline → assign a layout per slide → stream slides. Each layout is a component with a Zod schema the model fills. Common issues: export failures, text clipping, JSON parse errors on weaker models.
- **ALLWEONE presentation-ai** (~3.1k stars, MIT): Next.js + Postgres + login. Model writes streamed XML sections. PPTX export is partial, no PDF.
- Others: ppt-master (agent skill, SVG → native PPTX), banana-slides (image-model slides), PPTAgent (research), Slidev and Marp (developer decks).

## How AI deck generators work
1. Two stages: outline first (title + intent per slide), then slides.
2. Slides are structured data, not prose: the model picks a layout and fills that layout's schema; the app owns all design.
3. Stream it, with a parser that tolerates partial and sloppy output.
4. Keep theme tokens separate from content. That is what makes restyle one click.

## Why people pick Gamma over asking ChatGPT or Claude directly
- A chat model gives a good outline but no designed, presentable file; code-built decks show rigid grids and export glitches.
- Gamma is built around the deck as a product: whole-deck generation, targeted edits, restyle, present, export.
- The gap is narrowing as the chat products add slide features.

## Top complaints about Gamma (where a free tool can win)
1. Broken PPTX export: shifted text, missing fonts, charts flattened to images.
2. Credits run out; failed attempts still cost credits.
3. Billing and support.
4. A recognisable "Gamma look", hit-or-miss AI images, watermark on free exports.
5. Slow, and hard to format by hand.

## What Deckhand does about it
- No credits: publik API balance or your own key.
- PPTX built from native text boxes, shapes and charts.
- No AI images in v1: generative artwork from the theme instead, so nothing is hallucinated.
- Slide JSON is normalised before drawing, so weak models still yield a valid deck.
- No watermark, no account.

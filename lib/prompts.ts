import type { Deck, OutlineItem, Slide } from "./types";

export const STYLES = ["Pitch", "Lesson", "Report", "Talk"] as const;
export type Style = (typeof STYLES)[number];

const STYLE_HINT: Record<Style, string> = {
  Pitch: "a persuasive pitch: problem, stakes, solution, proof, ask",
  Lesson: "a clear lesson: build from basics, one idea per slide, concrete examples",
  Report: "a crisp report: findings first, evidence, implications, next steps",
  Talk: "a conference talk: a strong hook, a narrative arc, memorable lines",
};

export function outlinePrompt(input: string, count: number, style: Style) {
  const system = `You plan slide decks. You output NDJSON only: one compact JSON object per line, no markdown, no code fences, no commentary.`;
  const user = `Plan a ${count}-slide deck shaped as ${STYLE_HINT[style]}.

The source material or topic from the user:
"""
${input.trim()}
"""

Output exactly ${count + 1} lines.
Line 1: {"deck":"<deck title, max 8 words>"}
Then one line per slide: {"title":"<slide title, max 9 words>","gist":"<what this slide says, one sentence, max 22 words>"}

Rules:
- The first slide is the opening, the last is a closing or call to action.
- Each slide makes one point. Titles are specific claims, not labels like "Introduction" or "Overview".
- If the user pasted notes, stay faithful to them. Do not invent facts, numbers or quotes.
- Write in the language of the user's input.`;
  return { system, user };
}

const SCHEMA = `Each line is one slide, one of these shapes (choose the layout that fits the content):
{"layout":"title","title":"","subtitle":""}
{"layout":"section","title":"","subtitle":""}
{"layout":"bullets","title":"","bullets":["3 to 5 bullets, max 14 words each"]}
{"layout":"cards","title":"","items":[{"title":"2-4 words","text":"max 18 words"}]}   (3 or 4 items: parallel ideas)
{"layout":"stats","title":"","items":[{"value":"72%","title":"what it measures, max 8 words"}]}   (2 to 4 items: only real numbers)
{"layout":"timeline","title":"","items":[{"title":"date or phase","text":"max 14 words"}]}   (3 to 5 items: sequence in time)
{"layout":"steps","title":"","items":[{"title":"2-4 words","text":"max 16 words"}]}   (3 to 5 items: a process)
{"layout":"compare","title":"","left":{"title":"","bullets":["2-4 bullets"]},"right":{"title":"","bullets":["2-4 bullets"]}}
{"layout":"quote","text":"a quote or a single striking line, max 30 words","by":"attribution or empty"}
{"layout":"statement","title":"one bold sentence, max 14 words","text":"one supporting sentence, max 26 words"}
{"layout":"chart","title":"","subtitle":"unit or source, short","items":[{"title":"label","value":"number only"}]}   (3 to 6 bars: only real, comparable numbers)
{"layout":"hero","value":"one number, like 3x or 40% or $2M","title":"what the number means, max 10 words","text":"one supporting sentence"}   (a single number that carries the slide: only a real number)
{"layout":"closing","title":"","subtitle":"the ask or the takeaway"}
Every slide may also carry "notes": one or two sentences of speaker notes.`;

const RULES = `Rules:
- Output NDJSON only: one compact JSON object per line. No markdown, no code fences, no text before or after.
- Vary layouts. Never use the same layout on two slides in a row, and use "bullets" for at most a third of the deck.
- Slide 1 uses "title". The last slide uses "closing".
- Never invent statistics, dates or quotes. Use "stats", "chart" and "hero" only for numbers given by the user or numbers you are certain of; otherwise pick a qualitative layout. Use "quote" with an empty "by" for an unattributed line.
- Slides are read from the back of a room: short, concrete, no filler, no emoji, no markdown inside strings.
- Write in the language of the outline.`;

export function slidesPrompt(title: string, source: string, outline: OutlineItem[], style: Style, offset = 0, total = outline.length) {
  const rules = offset > 0
    ? RULES.replace("Slide 1 uses \"title\". The last slide uses \"closing\".", "Do not use \"title\". The last slide uses \"closing\".")
    : RULES;
  const system = `You write slide decks as structured data for a renderer. ${rules}`;
  const user = `Write the deck "${title}", shaped as ${STYLE_HINT[style]}.

Source material or topic from the user:
"""
${source.trim().slice(0, 12000)}
"""

${offset > 0 ? `Slides 1 to ${offset} of ${total} are already written. Write only the remaining slides below.\n\n` : ""}Approved outline, one slide each, in this order:
${outline.map((o, i) => `${offset + i + 1}. ${o.title} — ${o.gist}`).join("\n")}

${SCHEMA}

Output exactly ${outline.length} lines.`;
  return { system, user };
}

export function rewritePrompt(deck: Deck, slide: Slide, instruction: string) {
  const system = `You revise one slide of a deck. ${RULES.replace("Slide 1 uses \"title\". The last slide uses \"closing\".", "Keep the slide's role in the deck.")}`;
  const { id: _id, ...bare } = slide;
  void _id;
  const user = `Deck: "${deck.title}"
Slide titles in order: ${deck.slides.map((s) => s.title || s.text || s.layout).join(" | ")}

The slide to revise:
${JSON.stringify(bare)}

Instruction: ${instruction}

${SCHEMA}

Output exactly 1 line: the revised slide.`;
  return { system, user };
}

export function addSlidePrompt(deck: Deck, about: string) {
  const system = `You add one slide to a deck. ${RULES.replace("Slide 1 uses \"title\". The last slide uses \"closing\".", "Do not use the \"title\" or \"closing\" layouts.")}`;
  const user = `Deck: "${deck.title}"
Original brief: """${deck.prompt.slice(0, 4000)}"""
Slide titles so far: ${deck.slides.map((s) => s.title || s.text || s.layout).join(" | ")}

Add one new slide about: ${about}

${SCHEMA}

Output exactly 1 line: the new slide.`;
  return { system, user };
}

import { LAYOUTS, uid, type Item, type Layout, type Slide } from "./types";

/** Feed it stream deltas; it hands back each complete JSON line once. Tolerates fences, prose and a JSON array wrapper. */
export class LineParser {
  private buf = "";
  push(delta: string): unknown[] {
    this.buf += delta;
    const out: unknown[] = [];
    let nl: number;
    while ((nl = this.buf.indexOf("\n")) >= 0) {
      const line = this.buf.slice(0, nl);
      this.buf = this.buf.slice(nl + 1);
      const v = parseLine(line);
      if (v !== undefined) out.push(v);
    }
    return out;
  }
  flush(): unknown[] {
    const v = parseLine(this.buf);
    this.buf = "";
    return v === undefined ? [] : [v];
  }
  /** Characters of the line being written right now, for the "writing…" hint. */
  get pending() {
    return this.buf;
  }
}

function parseLine(raw: string): unknown | undefined {
  let s = raw.trim();
  if (!s || s.startsWith("```")) return undefined;
  s = s.replace(/^[\[,]\s*/, "").replace(/[,\]]\s*$/, "");
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return undefined;
  try {
    return JSON.parse(s.slice(a, b + 1));
  } catch {
    return undefined;
  }
}

const str = (v: unknown, max = 400): string =>
  (typeof v === "string" ? v : typeof v === "number" ? String(v) : "")
    .replace(/\*\*|__|`/g, "")
    .trim()
    .slice(0, max);

const strs = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.map((x) => str(x, 240)).filter(Boolean).slice(0, max) : [];

function items(v: unknown, max: number): Item[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x): Item => {
      if (typeof x === "string") return { title: str(x, 120) };
      const o = (x ?? {}) as Record<string, unknown>;
      return {
        title: str(o.title ?? o.label ?? o.name ?? o.heading, 120),
        text: str(o.text ?? o.description ?? o.body, 260),
        value: str(o.value ?? o.number, 24),
      };
    })
    .filter((i) => i.title || i.text || i.value)
    .slice(0, max);
}

function column(v: unknown) {
  const o = (v ?? {}) as Record<string, unknown>;
  return { title: str(o.title, 80), bullets: strs(o.bullets ?? o.points, 5) };
}

/** Turn whatever the model wrote into a slide the renderer can always draw. */
export function normalizeSlide(raw: unknown): Slide | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  let layout = str(o.layout, 20).toLowerCase() as Layout;
  if (!LAYOUTS.includes(layout)) {
    if (o.bullets) layout = "bullets";
    else if (o.items) layout = "cards";
    else if (o.title) layout = "statement";
    else return null;
  }
  const s: Slide = { id: uid(), layout };
  const title = str(o.title, 160);
  const subtitle = str(o.subtitle, 220);
  const text = str(o.text ?? o.quote ?? o.body, 420);
  const notes = str(o.notes, 600);
  if (title) s.title = title;
  if (subtitle) s.subtitle = subtitle;
  if (text) s.text = text;
  if (notes) s.notes = notes;
  if (o.by) s.by = str(o.by, 80);

  switch (layout) {
    case "bullets":
      s.bullets = strs(o.bullets, 6);
      if (!s.bullets.length) s.layout = "statement";
      break;
    case "cards":
    case "steps":
    case "timeline":
      s.items = items(o.items, layout === "cards" ? 4 : 5);
      if (s.items.length < 2) s.layout = "statement";
      break;
    case "stats":
      s.items = items(o.items, 4).filter((i) => i.value);
      if (!s.items.length) s.layout = "statement";
      break;
    case "chart":
      s.items = items(o.items, 6).filter((i) => Number.isFinite(num(i.value)));
      if (s.items.length < 2) s.layout = "statement";
      break;
    case "compare":
      s.left = column(o.left);
      s.right = column(o.right);
      if (!s.left.bullets.length && !s.right.bullets.length) s.layout = "statement";
      break;
    case "quote":
      if (!s.text && s.title) { s.text = s.title; delete s.title; }
      if (!s.text) return null;
      break;
  }
  if (!s.title && !s.text && !s.items?.length && !s.bullets?.length) return null;
  return s;
}

export const num = (v: string | undefined) => parseFloat((v ?? "").replace(/[^0-9.\-]/g, ""));

/** Re-shape a slide's content when the user switches its layout by hand. */
export function convertLayout(s: Slide, to: Layout): Slide {
  const lines: string[] = [
    ...(s.bullets ?? []),
    ...(s.items ?? []).map((i) => [i.title, i.text].filter(Boolean).join(": ")),
    ...(s.left ? [s.left.title, ...s.left.bullets] : []),
    ...(s.right ? [s.right.title, ...s.right.bullets] : []),
  ].filter(Boolean);
  const its: Item[] =
    s.items?.length ? s.items
    : lines.map((l) => {
        const [a, ...rest] = l.split(": ");
        return rest.length ? { title: a, text: rest.join(": ") } : { title: l };
      });
  const title = s.title || s.text || "Untitled";
  const base: Slide = { id: s.id, layout: to, title, notes: s.notes };
  const fill = (n: number, mk: (i: number) => Item) =>
    Array.from({ length: Math.max(n, Math.min(its.length, 5)) }, (_, i) => its[i] ?? mk(i));
  switch (to) {
    case "title":
    case "section":
    case "closing":
      return { ...base, subtitle: s.subtitle || s.text || lines[0] || "" };
    case "statement":
      return { ...base, text: s.text && s.title ? s.text : s.subtitle || lines[0] || "" };
    case "quote":
      return { id: s.id, layout: to, text: s.text || s.title || lines[0] || "", by: s.by || "", notes: s.notes };
    case "bullets":
      return { ...base, bullets: lines.length ? lines.slice(0, 6) : ["First point", "Second point", "Third point"] };
    case "cards":
    case "steps":
    case "timeline":
      return { ...base, items: fill(3, (i) => ({ title: `Point ${i + 1}`, text: "Add detail" })).slice(0, to === "cards" ? 4 : 5) };
    case "stats":
      return { ...base, items: fill(3, () => ({ value: "0", title: "Label" })).slice(0, 4).map((i) => ({ ...i, value: i.value || "0" })) };
    case "chart":
      return { ...base, subtitle: s.subtitle || "", items: fill(3, (i) => ({ title: `Item ${i + 1}`, value: String((i + 1) * 10) })).slice(0, 6).map((i, k) => ({ ...i, value: Number.isFinite(num(i.value)) ? i.value : String((k + 1) * 10) })) };
    case "compare": {
      const half = Math.ceil(lines.length / 2) || 1;
      return {
        ...base,
        left: s.left ?? { title: "Before", bullets: lines.slice(0, half).length ? lines.slice(0, half) : ["Point"] },
        right: s.right ?? { title: "After", bullets: lines.slice(half).length ? lines.slice(half) : ["Point"] },
      };
    }
  }
}

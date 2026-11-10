import { num } from "./parse";
import { PPT_FONT, themeById } from "./themes";
import type { Deck, Slide } from "./types";

const px = (n: number) => n / 96; // the canvas is 1280×720 px = 13.333×7.5 in
const hex = (c: string) => c.replace("#", "").toUpperCase();

/** Builds a real .pptx: every title, bullet, card and chart is a native, editable PowerPoint object. */
export async function exportPptx(deck: Deck) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const t = themeById(deck.theme);
  const H = PPT_FONT[t.heading], B = PPT_FONT[t.body];
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = deck.title;

  deck.slides.forEach((s: Slide, idx) => {
    const inv = s.layout === "section" || s.layout === "closing";
    const bg = inv ? t.accent : t.bg, fg = inv ? t.bg : t.text, mute = inv ? t.bg : t.muted;
    const sl = pptx.addSlide();
    sl.background = { color: hex(bg) };
    if (s.notes) sl.addNotes(s.notes);
    const text = (v: string | undefined, o: Record<string, unknown>) => {
      if (v) sl.addText(v, { fontFace: B, color: hex(fg), valign: "top", margin: 0, fit: "shrink", ...o });
    };
    const rect = (x: number, y: number, w: number, h: number, color: string, extra: Record<string, unknown> = {}) =>
      sl.addShape(pptx.ShapeType.rect, { x: px(x), y: px(y), w: px(w), h: px(h), fill: { color: hex(color) }, line: { color: hex(color), width: 0 }, ...extra });
    const card = (x: number, y: number, w: number, h: number, fill = t.surface) =>
      sl.addShape(pptx.ShapeType.roundRect, { x: px(x), y: px(y), w: px(w), h: px(h), rectRadius: 0.12, fill: { color: hex(fill) }, line: { color: hex(fill === t.surface ? t.line : fill), width: 0.75 } });
    const heading = (y = 68, w = 1000) =>
      text(s.title, { x: px(76), y: px(y), w: px(w), h: px(120), fontFace: H, fontSize: 34, bold: true });
    const items = s.items ?? [];
    const top = 220, bottom = 644;

    switch (s.layout) {
      case "title":
      case "statement":
      case "section":
      case "closing": {
        if (s.layout === "title" || s.layout === "statement") rect(920, 0, 360, 720, t.surface);
        if (s.layout === "title") rect(76, 300, 88, 10, t.accent);
        text(s.title, { x: px(76), y: px(s.layout === "title" ? 340 : 230), w: px(800), h: px(200), fontFace: H, fontSize: (s.title ?? "").length > 48 ? 44 : 54, bold: true, valign: s.layout === "title" ? "top" : "bottom" });
        text(s.subtitle ?? s.text, { x: px(76), y: px(s.layout === "title" ? 550 : 450), w: px(760), h: px(110), fontSize: 20, color: hex(mute) });
        break;
      }
      case "bullets":
        rect(920, 0, 360, 720, t.surface);
        heading(68, 780);
        sl.addText((s.bullets ?? []).map((b) => ({ text: b, options: { bullet: { characterCode: "25A0" }, breakLine: true, paraSpaceAfter: 12 } })), {
          x: px(76), y: px(top), w: px(780), h: px(bottom - top), fontFace: B, fontSize: (s.bullets?.length ?? 0) > 4 ? 18 : 21, color: hex(fg), valign: "middle", margin: 0, fit: "shrink",
        });
        break;
      case "cards": {
        heading();
        const cols = items.length === 4 ? 2 : items.length, rows = items.length === 4 ? 2 : 1, gap = 22;
        const w = (1128 - gap * (cols - 1)) / cols, h = (bottom - top - gap * (rows - 1)) / rows;
        items.forEach((it, i) => {
          const x = 76 + (i % cols) * (w + gap), y = top + Math.floor(i / cols) * (h + gap);
          card(x, y, w, h);
          text(String(i + 1).padStart(2, "0"), { x: px(x + 28), y: px(y + 24), w: px(80), h: px(30), fontFace: H, fontSize: 15, color: hex(t.accent) });
          text(it.title, { x: px(x + 28), y: px(y + (rows === 2 ? 60 : h * 0.42)), w: px(w - 56), h: px(70), fontFace: H, fontSize: 21, bold: true, valign: "bottom" });
          text(it.text, { x: px(x + 28), y: px(y + (rows === 2 ? 134 : h * 0.42 + 78)), w: px(w - 56), h: px(rows === 2 ? h - 150 : h * 0.4), fontSize: 15, color: hex(t.muted) });
        });
        break;
      }
      case "stats": {
        heading();
        const gap = 40, w = (1128 - gap * (items.length - 1)) / items.length;
        items.forEach((it, i) => {
          const x = 76 + i * (w + gap);
          rect(x, 330, w, 4, t.accent);
          text(it.value, { x: px(x), y: px(356), w: px(w), h: px(110), fontFace: H, fontSize: items.length > 3 ? 48 : 66, bold: true, color: hex(t.accent) });
          text(it.title, { x: px(x), y: px(476), w: px(w), h: px(80), fontSize: 17 });
        });
        break;
      }
      case "timeline": {
        heading();
        const w = 1128 / items.length;
        rect(76, 349, 1128, 3, t.line);
        items.forEach((it, i) => {
          const x = 76 + i * w;
          sl.addShape(pptx.ShapeType.ellipse, { x: px(x), y: px(339), w: px(22), h: px(22), fill: { color: hex(t.accent) }, line: { color: hex(t.bg), width: 3 } });
          text(it.title, { x: px(x), y: px(386), w: px(w - 26), h: px(44), fontFace: H, fontSize: 21, bold: true });
          text(it.text, { x: px(x), y: px(436), w: px(w - 26), h: px(170), fontSize: 14, color: hex(t.muted) });
        });
        break;
      }
      case "steps": {
        heading();
        const h = (bottom - top) / items.length;
        items.forEach((it, i) => {
          const y = top + i * h;
          rect(76, y, 1128, 1, t.line);
          text(String(i + 1), { x: px(76), y: px(y + 10), w: px(70), h: px(h - 20), fontFace: H, fontSize: 28, bold: true, color: hex(t.accent), valign: "middle" });
          text(it.title, { x: px(156), y: px(y + 10), w: px(320), h: px(h - 20), fontFace: H, fontSize: 20, bold: true, valign: "middle" });
          text(it.text, { x: px(496), y: px(y + 10), w: px(700), h: px(h - 20), fontSize: 16, color: hex(t.muted), valign: "middle" });
        });
        break;
      }
      case "compare": {
        heading();
        (["left", "right"] as const).forEach((side, i) => {
          const c = s[side];
          if (!c) return;
          const x = 76 + i * 577, right = side === "right";
          card(x, top, 551, bottom - top, right ? t.accent : t.surface);
          text(c.title, { x: px(x + 34), y: px(top + 30), w: px(483), h: px(56), fontFace: H, fontSize: 24, bold: true, color: hex(right ? t.bg : t.text) });
          sl.addText(c.bullets.map((b) => ({ text: b, options: { bullet: { characterCode: "25A0" }, breakLine: true, paraSpaceAfter: 8 } })), {
            x: px(x + 34), y: px(top + 100), w: px(483), h: px(bottom - top - 130), fontFace: B, fontSize: 16, color: hex(right ? t.bg : t.text), valign: "top", margin: 0, fit: "shrink",
          });
        });
        break;
      }
      case "quote":
        rect(920, 0, 360, 720, t.surface);
        text("“", { x: px(76), y: px(150), w: px(160), h: px(140), fontFace: H, fontSize: 130, color: hex(t.accent) });
        text(s.text, { x: px(76), y: px(290), w: px(790), h: px(230), fontFace: H, fontSize: (s.text ?? "").length > 110 ? 28 : 36 });
        text(s.by ? `— ${s.by}` : "", { x: px(76), y: px(540), w: px(790), h: px(40), fontSize: 17, color: hex(t.muted) });
        break;
      case "chart": {
        heading();
        text(s.subtitle, { x: px(76), y: px(150), w: px(1000), h: px(30), fontSize: 14, color: hex(t.muted) });
        const rev = [...items].reverse(); // PowerPoint draws horizontal bars bottom-up
        sl.addChart(pptx.ChartType.bar, [{ name: s.title ?? "Values", labels: rev.map((i) => i.title ?? ""), values: rev.map((i) => num(i.value) || 0) }], {
          x: px(76), y: px(196), w: px(1128), h: px(450), barDir: "bar", chartColors: [hex(t.accent)], barGapWidthPct: 45,
          catAxisLabelColor: hex(t.text), catAxisLabelFontFace: B, catAxisLabelFontSize: 14, valAxisHidden: true, valGridLine: { style: "none" },
          showValue: true, dataLabelColor: hex(t.text), dataLabelFontFace: H, dataLabelFontSize: 14, dataLabelPosition: "outEnd", showLegend: false,
        });
        break;
      }
    }
    sl.addText(`${idx + 1} / ${deck.slides.length}`, { x: px(1080), y: px(672), w: px(164), h: px(24), align: "right", fontFace: B, fontSize: 9, color: hex(mute), margin: 0 });
  });

  await pptx.writeFile({ fileName: `${deck.title.replace(/[^\w\- ]+/g, "").trim() || "deck"}.pptx` });
}

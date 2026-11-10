import { TRANSITION_LEAD, TRANSITION_MS, runCounts, transitionOf } from "./motion";
import { themeById } from "./themes";
import type { Deck } from "./types";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;600&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;600&display=swap";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Every stylesheet rule that draws or animates a slide, read back from the live page. */
function slideCss(): string {
  const keep = /\.sl[-\s.:,{>~+\[)]|\.sl$|\.tr-|\.stage|@keyframes (sl|tr)-/;
  const out: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list: CSSRuleList) => {
      for (const r of Array.from(list)) {
        if (r instanceof CSSMediaRule) { if (r.conditionText.includes("reduced-motion") && keep.test(r.cssText)) out.push(r.cssText); }
        else if ("cssRules" in r && (r as CSSGroupingRule).cssRules?.length && !(r instanceof CSSKeyframesRule)) walk((r as CSSGroupingRule).cssRules);
        else if (keep.test(r.cssText)) out.push(r.cssText);
      }
    };
    walk(rules);
  }
  return out.join("\n");
}

/** The player that ships inside the exported file. Plain browser JavaScript, no dependencies. */
function player(lead: number, ms: number) {
  const stage = document.querySelector(".stage") as HTMLElement;
  const fit = document.querySelector(".fit") as HTMLElement;
  const layers = Array.from(document.querySelectorAll(".tr-layer")) as HTMLElement[];
  const curtain = document.querySelector(".tr-curtain") as HTMLElement;
  const bar = document.querySelector(".progress i") as HTMLElement;
  let cur = -1;
  let timer = 0;
  const resize = function () {
    const k = Math.min(innerWidth / 1280, innerHeight / 720);
    fit.style.transform = "translate(-50%, -50%) scale(" + k + ")";
  };
  const show = function (next: number, first: boolean) {
    next = Math.max(0, Math.min(layers.length - 1, next));
    if (next === cur) return;
    const prev = cur;
    cur = next;
    clearTimeout(timer);
    stage.style.setProperty("--d", String(next > prev ? 1 : -1));
    layers.forEach(function (l, i) {
      const sl = l.firstElementChild as HTMLElement;
      l.className = "tr-layer" + (i === cur ? (first ? "" : " tr-in") : i === prev ? " tr-out" : "");
      l.style.display = i === cur || i === prev ? "" : "none";
      sl.classList.remove("sl-play");
      if (i === cur) {
        sl.style.setProperty("--t0", (first ? 0 : lead) + "ms");
        void sl.offsetWidth; // restart the entrance
        sl.classList.add("sl-play");
        (window as unknown as { runCounts: (r: ParentNode, d: number) => void }).runCounts(sl, (first ? 0 : lead) + 250);
      }
    });
    curtain.className = "tr-curtain";
    if (!first) { void curtain.offsetWidth; curtain.className = "tr-curtain on"; }
    timer = window.setTimeout(function () { if (layers[prev]) layers[prev].style.display = "none"; }, ms);
    bar.style.width = ((cur + 1) / layers.length) * 100 + "%";
    history.replaceState(null, "", "#" + (cur + 1));
  };
  addEventListener("resize", resize);
  addEventListener("keydown", function (e) {
    if (["ArrowRight", "ArrowDown", " ", "PageDown", "Enter"].indexOf(e.key) >= 0) { e.preventDefault(); show(cur + 1, false); }
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].indexOf(e.key) >= 0) { e.preventDefault(); show(cur - 1, false); }
    else if (e.key === "Home") show(0, false);
    else if (e.key === "End") show(layers.length - 1, false);
    else if (e.key === "f") document.documentElement.requestFullscreen?.();
  });
  addEventListener("click", function (e) { show(cur + (e.clientX < innerWidth * 0.3 ? -1 : 1), false); });
  let x0: number | null = null;
  addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", function (e) {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1), false);
    x0 = null;
  });
  resize();
  show((parseInt(location.hash.slice(1), 10) || 1) - 1, true);
}

/** One self-contained .html file: the deck as code, animated, with its own keyboard-driven player. */
export function exportHtml(deck: Deck) {
  const host = document.querySelector(".print-only");
  if (!host) throw new Error("The deck isn't ready to export yet.");
  const theme = themeById(deck.theme);
  const tr = transitionOf(deck);
  const vars = (host as HTMLElement).getAttribute("style") ?? "";
  const slides = Array.from(host.querySelectorAll(":scope > .sl")).map((el) => `<div class="tr-layer" style="display:none">${el.outerHTML}</div>`).join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(deck.title)}</title>
<meta name="generator" content="Deckhand">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>
:root { --font-geist-sans: "Geist"; --font-geist-mono: "Geist Mono"; --font-serif: "Instrument Serif"; --font-grotesk: "Space Grotesk"; }
* { box-sizing: border-box; margin: 0; }
html, body { height: 100%; background: #000; overflow: hidden; cursor: pointer; -webkit-font-smoothing: antialiased; }
.fit { position: fixed; left: 50%; top: 50%; width: 1280px; height: 720px; transform-origin: center; }
.progress { position: fixed; left: 0; right: 0; bottom: 0; height: 4px; background: rgb(255 255 255 / 0.1); }
.progress i { display: block; height: 100%; width: 0; background: ${theme.accent}; transition: width 0.3s; }
${slideCss()}
@media print {
  @page { size: 1280px 720px; margin: 0; }
  html, body { overflow: visible; height: auto; }
  .fit { position: static; transform: none !important; }
  .stage { height: auto; overflow: visible; }
  .tr-layer { position: static; display: block !important; visibility: visible !important; animation: none !important; break-after: page; }
  .tr-curtain, .progress { display: none !important; }
  .sl-play * { animation: none !important; }
}
</style>
</head>
<body>
<div class="fit" style="${esc(vars)}">
<div class="stage tr-${tr}">
${slides}
<div class="tr-curtain"></div>
</div>
</div>
<div class="progress"><i></i></div>
<script>
window.runCounts = ${runCounts.toString()};
(${player.toString()})(${TRANSITION_LEAD[tr]}, ${TRANSITION_MS});
</script>
</body>
</html>`;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  a.download = `${deck.title.replace(/[^\w\- ]+/g, "").trim() || "deck"}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export const TRANSITIONS = ["fade", "slide", "zoom", "wipe", "none"] as const;
export type Transition = (typeof TRANSITIONS)[number];

/** Each theme's house transition, used until the deck picks its own. */
export const THEME_TRANSITION: Record<string, Transition> = {
  paper: "fade", ink: "wipe", cobalt: "slide", blush: "fade", forest: "zoom", studio: "slide", dusk: "zoom", terminal: "wipe",
};

export const transitionOf = (deck: { theme: string; transition?: string }): Transition =>
  (TRANSITIONS as readonly string[]).includes(deck.transition ?? "") ? (deck.transition as Transition) : THEME_TRANSITION[deck.theme] ?? "fade";

/** How long the slide-to-slide transition holds the stage before a slide's own entrance starts (ms). */
export const TRANSITION_LEAD: Record<Transition, number> = { fade: 180, slide: 260, zoom: 220, wipe: 460, none: 0 };
export const TRANSITION_MS = 950;

/**
 * Counts every [data-count] number inside `root` up from zero, keeping its prefix, suffix and decimals.
 * Self-contained on purpose: the HTML export inlines this function's source into the exported file.
 */
export function runCounts(root: ParentNode, delay: number) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.querySelectorAll("[data-count]").forEach(function (el) {
    const full = el.getAttribute("data-count") || el.textContent || "";
    const m = full.match(/\d[\d,]*(\.\d+)?/);
    if (!m || m.index === undefined) return;
    const target = parseFloat(m[0].replace(/,/g, ""));
    if (!isFinite(target)) return;
    const dec = m[1] ? m[1].length - 1 : 0;
    const comma = m[0].indexOf(",") >= 0;
    const pre = full.slice(0, m.index);
    const post = full.slice(m.index + m[0].length);
    const fmt = function (v: number) {
      let s = v.toFixed(dec);
      if (comma) {
        const p = s.split(".");
        p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        s = p.join(".");
      }
      return s;
    };
    // Write through the existing text node, so whatever rendered it keeps its reference.
    const node = el.firstChild;
    if (!node || node.nodeType !== 3) return;
    node.nodeValue = pre + fmt(0) + post;
    let t0: number | null = null;
    const step = function (ts: number) {
      if (t0 === null) t0 = ts + delay;
      const k = Math.min(1, Math.max(0, (ts - t0) / 1000));
      node.nodeValue = k < 1 ? pre + fmt(target * (1 - Math.pow(1 - k, 3))) + post : full;
      if (k < 1 && el.isConnected) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

"use client";

import { memo } from "react";
import { num } from "@/lib/parse";
import type { Theme } from "@/lib/themes";
import type { Column, Item, Slide } from "@/lib/types";
import { Art } from "./Art";

type Patch = (p: Partial<Slide>) => void;

function E({ v, on, className, placeholder }: { v?: string; on?: (s: string) => void; className?: string; placeholder?: string }) {
  if (!on) return v ? <div className={className}>{v}</div> : null;
  return (
    <div
      className={`${className ?? ""} sl-edit`}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      data-ph={placeholder ?? "Type here"}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); }
        e.stopPropagation();
      }}
      onBlur={(e) => {
        const t = (e.currentTarget.textContent ?? "").trim();
        if (t !== (v ?? "")) on(t);
      }}
    >
      {v}
    </div>
  );
}

const size = (text: string | undefined, steps: [number, number][], min: number) => {
  const n = (text ?? "").length;
  for (const [max, px] of steps) if (n <= max) return px;
  return min;
};

function SlideViewInner({ slide: s, theme, index, total, onChange }: {
  slide: Slide; theme: Theme; index: number; total: number; onChange?: (s: Slide) => void;
}) {
  const patch: Patch | undefined = onChange ? (p) => onChange({ ...s, ...p }) : undefined;
  const set = (k: keyof Slide) => (patch ? (v: string) => patch({ [k]: v }) : undefined);
  const setItem = (i: number, k: keyof Item) =>
    patch ? (v: string) => patch({ items: (s.items ?? []).map((it, j) => (j === i ? { ...it, [k]: v } : it)) }) : undefined;
  const setBullet = (i: number) =>
    patch ? (v: string) => patch({ bullets: (s.bullets ?? []).map((b, j) => (j === i ? v : b)).filter(Boolean) }) : undefined;
  const setCol = (side: "left" | "right", i: number | "title") =>
    patch
      ? (v: string) => {
          const c = s[side] as Column;
          patch({ [side]: i === "title" ? { ...c, title: v } : { ...c, bullets: c.bullets.map((b, j) => (j === i ? v : b)).filter(Boolean) } });
        }
      : undefined;

  const seed = `${s.id}`;
  const items = s.items ?? [];
  const h = (max: number) => ({ fontSize: size(s.title, [[28, max], [48, max * 0.86], [80, max * 0.72]], max * 0.6) });

  let body: React.ReactNode;
  let inverted = false;

  switch (s.layout) {
    case "title":
      body = (
        <>
          <Art kind={theme.art} seed={seed} x={800} w={480} />
          <div className="sl-pad sl-col" style={{ justifyContent: "flex-end", width: 800 }}>
            <div className="sl-bar" />
            <E v={s.title} on={set("title")} className="sl-h" placeholder="Deck title" />
            <E v={s.subtitle} on={set("subtitle")} className="sl-sub" placeholder="Subtitle" />
          </div>
        </>
      );
      break;

    case "section":
      inverted = true;
      body = (
        <div className="sl-pad sl-col" style={{ justifyContent: "center" }}>
          <div className="sl-kicker">{String(index + 1).padStart(2, "0")}</div>
          <E v={s.title} on={set("title")} className="sl-h" placeholder="Section title" />
          <E v={s.subtitle} on={set("subtitle")} className="sl-sub" placeholder="One line of context" />
        </div>
      );
      break;

    case "closing":
      inverted = true;
      body = (
        <>
          <Art kind={theme.art} seed={seed} x={840} w={440} tone="onAccent" />
          <div className="sl-pad sl-col" style={{ justifyContent: "center", width: 820 }}>
            <E v={s.title} on={set("title")} className="sl-h" placeholder="Closing line" />
            <E v={s.subtitle} on={set("subtitle")} className="sl-sub" placeholder="The ask" />
          </div>
        </>
      );
      break;

    case "bullets":
      body = (
        <>
          <div className="sl-side" />
          <Art kind={theme.art} seed={seed} x={920} w={360} />
          <div className="sl-pad sl-col" style={{ width: 920 }}>
            <E v={s.title} on={set("title")} className="sl-h sl-h2" placeholder="Title" />
            <div className="sl-bullets" data-n={s.bullets?.length}>
              {(s.bullets ?? []).map((b, i) => (
                <div className="sl-bullet" key={i}><span className="sl-dot" /><E v={b} on={setBullet(i)} /></div>
              ))}
            </div>
          </div>
        </>
      );
      break;

    case "cards":
      body = (
        <div className="sl-pad sl-col">
          <E v={s.title} on={set("title")} className="sl-h sl-h2" placeholder="Title" />
          <div className="sl-grid" style={{ gridTemplateColumns: `repeat(${items.length === 4 ? 2 : items.length}, 1fr)` }} data-n={items.length}>
            {items.map((it, i) => (
              <div className="sl-card" key={i}>
                <div className="sl-num">{String(i + 1).padStart(2, "0")}</div>
                <E v={it.title} on={setItem(i, "title")} className="sl-card-t" placeholder="Heading" />
                <E v={it.text} on={setItem(i, "text")} className="sl-card-p" placeholder="Detail" />
              </div>
            ))}
          </div>
        </div>
      );
      break;

    case "stats":
      body = (
        <div className="sl-pad sl-col">
          <E v={s.title} on={set("title")} className="sl-h sl-h2" placeholder="Title" />
          <div className="sl-stats">
            {items.map((it, i) => (
              <div className="sl-stat" key={i}>
                <E v={it.value} on={setItem(i, "value")} className="sl-stat-v" placeholder="0" />
                <E v={it.title} on={setItem(i, "title")} className="sl-stat-l" placeholder="Label" />
                <E v={it.text} on={it.text ? setItem(i, "text") : undefined} className="sl-stat-p" />
              </div>
            ))}
          </div>
        </div>
      );
      break;

    case "timeline":
      body = (
        <div className="sl-pad sl-col">
          <E v={s.title} on={set("title")} className="sl-h sl-h2" placeholder="Title" />
          <div className="sl-time" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
            {items.map((it, i) => (
              <div className="sl-tick" key={i}>
                <span className="sl-tick-dot" />
                <E v={it.title} on={setItem(i, "title")} className="sl-tick-t" placeholder="When" />
                <E v={it.text} on={setItem(i, "text")} className="sl-tick-p" placeholder="What happened" />
              </div>
            ))}
          </div>
        </div>
      );
      break;

    case "steps":
      body = (
        <div className="sl-pad sl-col">
          <E v={s.title} on={set("title")} className="sl-h sl-h2" placeholder="Title" />
          <div className="sl-steps" data-n={items.length}>
            {items.map((it, i) => (
              <div className="sl-step" key={i}>
                <div className="sl-step-n">{i + 1}</div>
                <E v={it.title} on={setItem(i, "title")} className="sl-step-t" placeholder="Step" />
                <E v={it.text} on={setItem(i, "text")} className="sl-step-p" placeholder="Detail" />
              </div>
            ))}
          </div>
        </div>
      );
      break;

    case "compare":
      body = (
        <div className="sl-pad sl-col">
          <E v={s.title} on={set("title")} className="sl-h sl-h2" placeholder="Title" />
          <div className="sl-vs">
            {(["left", "right"] as const).map((side) => (
              <div className={`sl-vs-col sl-vs-${side}`} key={side}>
                <E v={s[side]?.title} on={setCol(side, "title")} className="sl-vs-t" placeholder="Option" />
                {(s[side]?.bullets ?? []).map((b, i) => (
                  <div className="sl-bullet sl-bullet-sm" key={i}><span className="sl-dot" /><E v={b} on={setCol(side, i)} /></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
      break;

    case "quote":
      body = (
        <>
          <Art kind={theme.art} seed={seed} x={960} w={320} />
          <div className="sl-pad sl-col" style={{ justifyContent: "center", width: 940 }}>
            <div className="sl-mark">&ldquo;</div>
            <E v={s.text} on={set("text")} className="sl-quote" placeholder="A line worth repeating" />
            <E v={s.by} on={set("by")} className="sl-by" placeholder="Attribution" />
          </div>
        </>
      );
      break;

    case "chart": {
      const max = Math.max(...items.map((i) => Math.abs(num(i.value)) || 0), 1);
      body = (
        <div className="sl-pad sl-col">
          <E v={s.title} on={set("title")} className="sl-h sl-h2" placeholder="Title" />
          <E v={s.subtitle} on={set("subtitle")} className="sl-cap" placeholder="Unit or source" />
          <div className="sl-bars">
            {items.map((it, i) => (
              <div className="sl-bar-row" key={i}>
                <E v={it.title} on={setItem(i, "title")} className="sl-bar-l" placeholder="Label" />
                <div className="sl-bar-track">
                  <div className="sl-bar-fill" style={{ width: `${Math.max(2, ((Math.abs(num(it.value)) || 0) / max) * 100)}%`, opacity: i === 0 ? 1 : 0.55 + 0.45 * ((Math.abs(num(it.value)) || 0) / max) }} />
                </div>
                <E v={it.value} on={setItem(i, "value")} className="sl-bar-v" placeholder="0" />
              </div>
            ))}
          </div>
        </div>
      );
      break;
    }

    default:
      body = (
        <>
          <Art kind={theme.art} seed={seed} x={880} w={400} />
          <div className="sl-pad sl-col" style={{ justifyContent: "center", width: 860 }}>
            <E v={s.title} on={set("title")} className="sl-h" placeholder="One bold sentence" />
            <E v={s.text} on={set("text")} className="sl-sub" placeholder="One supporting sentence" />
          </div>
        </>
      );
  }

  const big = s.layout === "title" || s.layout === "section" || s.layout === "closing" || s.layout === "statement";
  return (
    <div className={`sl sl-${s.layout} ${inverted ? "sl-inv" : ""}`} style={{ ["--h" as string]: `${h(big ? 92 : 54).fontSize}px`, ["--q" as string]: `${size(s.text, [[60, 60], [110, 50], [170, 42]], 36)}px` }}>
      {body}
      <div className="sl-foot">{index + 1} / {total}</div>
    </div>
  );
}

export const SlideView = memo(SlideViewInner);

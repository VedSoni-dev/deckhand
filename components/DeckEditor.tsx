"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { convertLayout } from "@/lib/parse";
import { encodeDeck } from "@/lib/share";
import { themeById, themeVars } from "@/lib/themes";
import { LAYOUTS, uid, type Deck, type Layout, type Slide } from "@/lib/types";
import { Present } from "./Present";
import { SlideView } from "./SlideView";
import { Menu, MenuItem, Scaled, ThemeSwatches } from "./ui";

const REWRITES = [
  ["Punchier", "Make it punchier: fewer words, stronger verbs, same meaning."],
  ["Simpler", "Make it simpler, for someone new to the topic."],
  ["More detail", "Add one more level of concrete detail, staying within the word limits."],
  ["New layout", "Present the same content in a different, better-fitting layout."],
] as const;

export function DeckEditor({ deck, onChange, onBack, generating, progress, onStop, onRewrite, onAddSlide, busySlide, readOnly, onCopy, header }: {
  deck: Deck;
  onChange: (d: Deck) => void;
  onBack: () => void;
  generating: boolean;
  progress?: { done: number; total: number };
  onStop: () => void;
  onRewrite: (slide: Slide, instruction: string) => void;
  onAddSlide: (about: string, after: number) => void;
  busySlide: string | null;
  readOnly?: boolean;
  onCopy?: () => void;
  header?: React.ReactNode;
}) {
  const theme = themeById(deck.theme);
  const [active, setActive] = useState(0);
  const [presenting, setPresenting] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [about, setAbout] = useState("");
  const [mounted, setMounted] = useState(false);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const endRef = useRef<HTMLDivElement>(null);
  const editable = !readOnly && !generating;

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // While the deck is being written, keep the newest card in view.
  const count = deck.slides.length;
  useEffect(() => {
    if (generating && count > 1) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [generating, count]);

  const setSlides = useCallback((slides: Slide[]) => onChange({ ...deck, slides, updatedAt: Date.now() }), [deck, onChange]);
  const update = useCallback((s: Slide) => setSlides(deck.slides.map((x) => (x.id === s.id ? s : x))), [deck.slides, setSlides]);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= deck.slides.length) return;
    const next = [...deck.slides];
    [next[i], next[j]] = [next[j], next[i]];
    setSlides(next);
    setActive(j);
  };
  const jump = (i: number) => {
    setActive(i);
    refs.current[deck.slides[i]?.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (presenting !== null || el.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(el.tagName)) return;
      if (e.key === "p" && !e.metaKey && !e.ctrlKey && deck.slides.length) setPresenting(active);
      if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); jump(Math.min(deck.slides.length - 1, active + 1)); }
      if (e.key === "k" || e.key === "ArrowUp") { e.preventDefault(); jump(Math.max(0, active - 1)); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const share = async () => {
    const url = `${location.origin}/#s=${await encodeDeck(deck)}`;
    try { await navigator.clipboard.writeText(url); setToast("Link copied. The whole deck lives in the link; nothing was uploaded."); }
    catch { prompt("Copy this link", url); }
  };
  const pptx = async () => {
    setToast("Building your PowerPoint…");
    try { (await import("@/lib/exportPptx")).exportPptx(deck); } catch { setToast("PowerPoint export failed. Try PDF instead."); }
  };
  const json = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(deck, null, 2)], { type: "application/json" }));
    a.download = `${deck.title || "deck"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <header className="screen-only sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-bg/85 px-3 py-2 backdrop-blur sm:px-4">
        <button className="btn btn-ghost px-2" onClick={onBack} aria-label="Back to home">←</button>
        <input
          className="min-w-0 flex-1 truncate rounded-lg bg-transparent px-2 py-1 text-sm font-semibold outline-none hover:bg-sunk focus:bg-sunk"
          value={deck.title}
          readOnly={!editable}
          onChange={(e) => onChange({ ...deck, title: e.target.value, updatedAt: Date.now() })}
          aria-label="Deck title"
        />
        {generating ? (
          <>
            <span className="hidden text-xs text-mute sm:inline">Writing slide {Math.min((progress?.done ?? 0) + 1, progress?.total ?? 1)} of {progress?.total}</span>
            <button className="btn" onClick={onStop}>Stop</button>
          </>
        ) : (
          <>
            {readOnly && onCopy && <button className="btn btn-primary" onClick={onCopy}>Make it mine</button>}
            {!readOnly && (
              <Menu label={<><span className="size-3 rounded-full" style={{ background: theme.accent, boxShadow: `0 0 0 2px ${theme.bg}, 0 0 0 3px var(--line)` }} /><span className="hidden sm:inline">Restyle</span></>} title="Change theme">
                {() => <div className="w-72 p-1.5"><ThemeSwatches compact value={deck.theme} onChange={(id) => onChange({ ...deck, theme: id, updatedAt: Date.now() })} /></div>}
              </Menu>
            )}
            <Menu label="Export">
              {(close) => (
                <>
                  <MenuItem onClick={() => { close(); pptx(); }} hint=".pptx">PowerPoint, fully editable</MenuItem>
                  <MenuItem onClick={() => { close(); setTimeout(() => window.print(), 50); }} hint="print">PDF</MenuItem>
                  <MenuItem onClick={() => { close(); share(); }}>Copy share link</MenuItem>
                  <MenuItem onClick={() => { close(); json(); }} hint=".json">Deck data</MenuItem>
                </>
              )}
            </Menu>
            <button className="btn btn-primary" disabled={!deck.slides.length} onClick={() => setPresenting(active)}>Present <span className="hidden opacity-70 sm:inline">P</span></button>
          </>
        )}
        {header}
      </header>

      <div className="screen-only mx-auto flex w-full max-w-[1400px] flex-1 gap-5 px-3 py-5 sm:px-5">
        <nav className="sticky top-[68px] hidden h-[calc(100dvh-88px)] w-40 flex-none flex-col gap-2 overflow-y-auto pb-6 pr-1 lg:flex" aria-label="Slides">
          {deck.slides.map((s, i) => (
            <button key={s.id} onClick={() => jump(i)} className={`group relative flex-none overflow-hidden rounded-lg border transition ${i === active ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-mute"}`}>
              <Scaled theme={theme}><SlideView slide={s} theme={theme} index={i} total={deck.slides.length} /></Scaled>
              <span className="absolute left-1 top-1 rounded bg-black/55 px-1.5 text-[10px] leading-4 text-white">{i + 1}</span>
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1 space-y-6 pb-24">
          {deck.slides.map((s, i) => (
            <section key={s.id} ref={(el) => { refs.current[s.id] = el; }} className="rise group/slide" onPointerDown={() => setActive(i)} onFocus={() => setActive(i)}>
              {!readOnly && (
                <div className={`mb-1.5 flex h-9 items-center gap-1 text-xs text-mute transition-opacity ${editable ? "sm:opacity-40 sm:group-hover/slide:opacity-100 sm:group-focus-within/slide:opacity-100" : "opacity-40"}`}>
                  <span className="hidden w-6 font-mono sm:inline">{String(i + 1).padStart(2, "0")}</span>
                  <select
                    className="h-8 w-24 rounded-lg border border-line bg-panel px-2 text-xs capitalize text-fg disabled:opacity-50 sm:w-28"
                    value={s.layout} disabled={!editable} aria-label="Layout"
                    onChange={(e) => update(convertLayout(s, e.target.value as Layout))}
                  >
                    {LAYOUTS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <Menu label={<>✦ Rewrite</>} align="left" className="btn h-8 px-2.5 text-xs">
                    {(close) => (
                      <div className="w-60">
                        {REWRITES.map(([name, inst]) => <MenuItem key={name} onClick={() => { close(); onRewrite(s, inst); }}>{name}</MenuItem>)}
                        <form className="mt-1 flex gap-1 border-t border-line p-1.5 pt-2" onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get("q") as string; if (v.trim()) { close(); onRewrite(s, v.trim()); } }}>
                          <input name="q" className="field h-8 text-xs" placeholder="Or tell it what to change" autoComplete="off" />
                          <button className="btn h-8 px-2 text-xs">Go</button>
                        </form>
                      </div>
                    )}
                  </Menu>
                  <span className="flex-1" />
                  <button className="btn btn-ghost h-8 px-2" disabled={!editable || i === 0} onClick={() => move(i, -1)} title="Move up" aria-label="Move up">↑</button>
                  <button className="btn btn-ghost h-8 px-2" disabled={!editable || i === deck.slides.length - 1} onClick={() => move(i, 1)} title="Move down" aria-label="Move down">↓</button>
                  <button className="btn btn-ghost hidden h-8 px-2 sm:inline-flex" disabled={!editable} onClick={() => { const next = [...deck.slides]; next.splice(i + 1, 0, { ...structuredClone(s), id: uid() }); setSlides(next); }} title="Duplicate" aria-label="Duplicate">⧉</button>
                  <button className="btn btn-ghost h-8 px-2" disabled={!editable || deck.slides.length < 2} onClick={() => setSlides(deck.slides.filter((x) => x.id !== s.id))} title="Delete" aria-label="Delete">✕</button>
                </div>
              )}
              <div className={`relative overflow-hidden rounded-xl border shadow-[var(--shadow)] transition ${i === active ? "border-accent/60" : "border-line"}`}>
                <Scaled theme={theme}>
                  <SlideView slide={s} theme={theme} index={i} total={Math.max(deck.slides.length, progress?.total ?? 0)} onChange={editable && busySlide !== s.id ? update : undefined} />
                </Scaled>
                {busySlide === s.id && <div className="shimmer absolute inset-0 grid place-items-center opacity-80"><span className="pulse rounded-full bg-panel px-3 py-1.5 text-sm">Rewriting…</span></div>}
              </div>
            </section>
          ))}

          {generating && (
            <div className="shimmer grid aspect-video place-items-center rounded-xl border border-line">
              <span className="pulse text-sm text-mute">Writing slide {Math.min((progress?.done ?? 0) + 1, progress?.total ?? 1)} of {progress?.total}…</span>
            </div>
          )}

          {editable && deck.slides.length > 0 && (
            <form className="flex flex-wrap gap-2 rounded-xl border border-dashed border-line p-3" onSubmit={(e) => { e.preventDefault(); if (about.trim()) { onAddSlide(about.trim(), deck.slides.length - 1); setAbout(""); } }}>
              <input className="field min-w-0 flex-1 basis-56" placeholder="Add a slide about…" value={about} onChange={(e) => setAbout(e.target.value)} />
              <button className="btn btn-primary" disabled={!about.trim() || busySlide === "new"}>{busySlide === "new" ? "Writing…" : "✦ Add with AI"}</button>
              <button type="button" className="btn" onClick={() => setSlides([...deck.slides, { id: uid(), layout: "bullets", title: "New slide", bullets: ["First point", "Second point", "Third point"] }])}>Blank slide</button>
            </form>
          )}
          <div ref={endRef} />
        </main>
      </div>

      {toast && <div role="status" className="screen-only rise fixed bottom-5 left-1/2 z-50 w-max max-w-[92vw] -translate-x-1/2 rounded-full border border-line bg-panel px-4 py-2 text-sm shadow-[var(--shadow)]">{toast}</div>}
      {presenting !== null && deck.slides.length > 0 && <Present slides={deck.slides} theme={theme} start={presenting} onClose={() => setPresenting(null)} />}
      {mounted && createPortal(
        <div className="print-only" style={themeVars(theme)}>
          {deck.slides.map((s, i) => <SlideView key={s.id} slide={s} theme={theme} index={i} total={deck.slides.length} />)}
        </div>,
        document.body,
      )}
    </div>
  );
}

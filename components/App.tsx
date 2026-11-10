"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LLMError, publikStatus, streamChat, type PublikState } from "@/lib/llm";
import { LineParser, normalizeSlide } from "@/lib/parse";
import { STYLES, addSlidePrompt, outlinePrompt, rewritePrompt, slidesPrompt, type Style } from "@/lib/prompts";
import { SAMPLE } from "@/lib/sample";
import { decodeDeck } from "@/lib/share";
import { DEFAULT_SETTINGS, deleteDeck, loadDecks, loadSettings, saveDeck, saveSettings } from "@/lib/store";
import { themeById } from "@/lib/themes";
import { uid, type Deck, type OutlineItem, type Settings, type Slide } from "@/lib/types";
import { DeckEditor } from "./DeckEditor";
import { SettingsDialog } from "./Settings";
import { SlideView } from "./SlideView";
import { ErrorBanner, Logo, Scaled, ThemeSwatches } from "./ui";

type View = "home" | "outline" | "deck";

const IDEAS = [
  "Pitch a four-day work week to a sceptical CEO",
  "Teach 12-year-olds how vaccines train the immune system",
  "Quarterly update for a small coffee roastery",
  "Why our team should adopt TypeScript",
];

interface Draft { title: string; items: OutlineItem[]; prompt: string; style: Style; theme: string }

export default function App() {
  const [view, setView] = useState<View>("home");
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [publik, setPublik] = useState<PublikState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [shared, setShared] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(8);
  const [style, setStyle] = useState<Style>("Pitch");
  const [busy, setBusy] = useState<"outline" | "slides" | null>(null);
  const [busySlide, setBusySlide] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<{ e: Error; retry?: () => void } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const deckRef = useRef<Deck | null>(null);
  deckRef.current = deck;

  // ---- boot: settings, saved decks, publik state, and a deck in the link if there is one
  useEffect(() => {
    setSettings(loadSettings());
    setDecks(loadDecks());
    publikStatus().then(setPublik).catch(() => setPublik({ available: false, connected: false, disclosure: "" }));
    const open = async () => {
      const h = location.hash;
      if (h.startsWith("#s=")) {
        const d = await decodeDeck(h.slice(3));
        const slides = (d?.slides ?? []).map(normalizeSlide).filter(Boolean) as Slide[];
        if (d && slides.length) {
          setDeck({ id: uid(), title: d.title, theme: themeById(d.theme).id, transition: d.transition, slides, prompt: "", createdAt: Date.now(), updatedAt: Date.now() });
          setShared(true); setView("deck");
        } else setError({ e: new Error("That share link is damaged or incomplete, so the deck couldn't be opened.") });
      } else if (h.startsWith("#/d/")) {
        const id = h.slice(4);
        const d = id === "sample" ? SAMPLE : loadDecks().find((x) => x.id === id);
        if (d) { setDeck(d); setShared(id === "sample"); setView("deck"); }
      } else if (!abort.current) { setView((v) => (v === "deck" ? "home" : v)); }
    };
    open().finally(() => setReady(true));
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  const updateSettings = (s: Settings) => { setSettings(s); saveSettings(s); };
  const refreshPublik = useCallback(() => { publikStatus().then(setPublik).catch(() => {}); }, []);

  const persist = useCallback((d: Deck) => {
    setDeck(d);
    if (d.id !== "sample" && !saveDeck(d)) setError({ e: new Error("This browser's storage is full, so the deck can't be saved. Export it, or delete older decks.") });
  }, []);

  const goHome = () => {
    abort.current?.abort();
    setDecks(loadDecks()); setDeck(null); setShared(false); setView("home"); setError(null);
    history.replaceState(null, "", location.pathname);
  };

  /** Is the chosen provider usable? If not, open settings and say why. */
  const providerReady = (): boolean => {
    const s = settings;
    const ok = s.provider === "openai" ? !!s.openaiKey : s.provider === "anthropic" ? !!s.anthropicKey : !!publik?.connected;
    if (!ok) setShowSettings(true);
    return ok;
  };

  const call = async (p: { system: string; user: string }, onLine: (v: unknown) => void) => {
    const parser = new LineParser();
    abort.current = new AbortController();
    try {
      await streamChat({ ...p, settings, signal: abort.current.signal, onDelta: (t) => parser.push(t).forEach(onLine) });
      parser.flush().forEach(onLine);
    } finally {
      abort.current = null;
      if (settings.provider === "publik") refreshPublik();
    }
  };

  const fail = (e: unknown, retry?: () => void) => {
    if ((e as Error)?.name === "AbortError") return;
    setError({ e: e instanceof Error ? e : new LLMError("other", "Something went wrong."), retry });
  };

  // ---- step 1: outline
  const makeOutline = async () => {
    const text = prompt.trim();
    if (!text || busy) return;
    if (!providerReady()) return;
    setError(null); setBusy("outline");
    const d: Draft = { title: "", items: [], prompt: text, style, theme: draft?.theme ?? "paper" };
    setDraft(d); setView("outline");
    try {
      await call(outlinePrompt(text, count, style), (v) => {
        const o = v as Record<string, unknown>;
        if (typeof o.deck === "string") d.title = o.deck.slice(0, 120);
        else if (typeof o.title === "string" && d.items.length < 20) d.items.push({ id: uid(), title: o.title.slice(0, 140), gist: String(o.gist ?? "").slice(0, 260) });
        setDraft({ ...d, items: [...d.items] });
      });
      if (!d.items.length) throw new LLMError("other", "The model answered, but not with an outline. Try again, or pick a stronger model in Settings.");
      if (!d.title) setDraft({ ...d, title: text.slice(0, 60), items: [...d.items] });
    } catch (e) {
      fail(e, makeOutline);
      if (!d.items.length) setView("home");
    }
    setBusy(null);
  };

  // ---- step 2: slides, streamed one card at a time
  const writeSlides = async (base: Deck, outline: OutlineItem[], st: Style, offset = 0) => {
    setError(null); setBusy("slides"); setProgress({ done: offset, total: outline.length });
    let d = base;
    try {
      await call(slidesPrompt(base.title, base.prompt, outline.slice(offset), st, offset, outline.length), (v) => {
        const s = normalizeSlide(v);
        if (!s || d.slides.length >= outline.length) return;
        d = { ...d, slides: [...d.slides, s], updatedAt: Date.now() };
        setDeck(d); setProgress({ done: d.slides.length, total: outline.length });
      });
      if (d.slides.length === offset) throw new LLMError("other", "The model answered, but not with slides. Try again, or pick a stronger model in Settings.");
    } catch (e) {
      const at = d.slides.length;
      fail(e, at < outline.length ? () => writeSlides(deckRef.current ?? d, outline, st, (deckRef.current ?? d).slides.length) : undefined);
    }
    if (d.slides.length) saveDeck(d);
    setBusy(null);
  };

  const makeDeck = () => {
    if (!draft || busy || !draft.items.length) return;
    if (!providerReady()) return;
    const d: Deck = { id: uid(), title: draft.title || "Untitled deck", prompt: draft.prompt, theme: draft.theme, slides: [], createdAt: Date.now(), updatedAt: Date.now() };
    setDeck(d); setShared(false); setView("deck");
    history.replaceState(null, "", `#/d/${d.id}`);
    window.scrollTo(0, 0);
    writeSlides(d, draft.items.filter((i) => i.title.trim()), draft.style);
  };

  const rewrite = async (slide: Slide, instruction: string) => {
    if (!deck || busySlide || !providerReady()) return;
    setError(null); setBusySlide(slide.id);
    try {
      let next: Slide | null = null;
      await call(rewritePrompt(deck, slide, instruction), (v) => { next ??= normalizeSlide(v); });
      if (!next) throw new LLMError("other", "The model didn't return a slide. Try again.");
      const cur = deckRef.current!;
      persist({ ...cur, slides: cur.slides.map((s) => (s.id === slide.id ? { ...(next as Slide), id: slide.id } : s)), updatedAt: Date.now() });
    } catch (e) { fail(e, () => rewrite(slide, instruction)); }
    setBusySlide(null);
  };

  const addSlide = async (about: string, after: number) => {
    if (!deck || busySlide || !providerReady()) return;
    setError(null); setBusySlide("new");
    try {
      let next: Slide | null = null;
      await call(addSlidePrompt(deck, about), (v) => { next ??= normalizeSlide(v); });
      if (!next) throw new LLMError("other", "The model didn't return a slide. Try again.");
      const cur = deckRef.current!;
      const slides = [...cur.slides];
      const last = slides[slides.length - 1]?.layout === "closing" ? slides.length - 1 : after + 1;
      slides.splice(last, 0, next);
      persist({ ...cur, slides, updatedAt: Date.now() });
    } catch (e) { fail(e, () => addSlide(about, after)); }
    setBusySlide(null);
  };

  const openDeck = (d: Deck) => {
    setDeck(d); setShared(d.id === "sample"); setView("deck"); setError(null);
    history.pushState(null, "", `#/d/${d.id}`);
    window.scrollTo(0, 0);
  };

  const copyShared = () => {
    if (!deck) return;
    const d = { ...structuredClone(deck), id: uid(), createdAt: Date.now(), updatedAt: Date.now() };
    saveDeck(d); setDeck(d); setShared(false);
    history.replaceState(null, "", `#/d/${d.id}`);
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (view === "home") makeOutline();
        else if (view === "outline") makeDeck();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const providerChip = (
    <button className="btn px-2.5 text-xs" onClick={() => setShowSettings(true)} title="Where the AI comes from">
      <span className={`size-1.5 rounded-full ${(settings.provider === "publik" ? publik?.connected : settings.provider === "openai" ? settings.openaiKey : settings.anthropicKey) ? "bg-emerald-500" : "bg-mute"}`} />
      <span className="max-w-36 truncate">
        {settings.provider === "publik" ? (publik?.connected ? publik.balanceLine?.split(" · ")[0] || "publik API" : "Set up AI")
          : settings.provider === "openai" ? (settings.openaiKey ? settings.openaiModel || "OpenAI" : "Add OpenAI key")
          : settings.anthropicKey ? settings.anthropicModel || "Claude" : "Add Claude key"}
      </span>
    </button>
  );

  const banner = error && (
    <ErrorBanner error={error.e} onDismiss={() => setError(null)} onSettings={() => setShowSettings(true)} onRetry={error.retry && (() => { const r = error.retry!; setError(null); r(); })} />
  );
  const dialog = showSettings && (
    <SettingsDialog settings={settings} onChange={updateSettings} publik={publik} onPublik={setPublik} onClose={() => setShowSettings(false)} />
  );

  if (view === "deck" && deck) {
    return (
      <>
        <DeckEditor
          deck={deck} onChange={persist} onBack={goHome}
          generating={busy === "slides"} progress={progress} onStop={() => abort.current?.abort()}
          onRewrite={rewrite} onAddSlide={addSlide} busySlide={busySlide}
          readOnly={shared} onCopy={copyShared} header={<span className="hidden sm:block">{providerChip}</span>}
        />
        {banner && <div className="screen-only fixed inset-x-3 bottom-4 z-40 mx-auto max-w-2xl">{banner}</div>}
        {dialog}
      </>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between py-4">
        <button className="flex items-center gap-2 text-[15px] font-semibold tracking-tight" onClick={goHome}><Logo /> Deckhand</button>
        <div className="flex items-center gap-2">
          <a className="btn btn-ghost hidden text-xs text-mute sm:inline-flex" href="https://github.com/VedSoni-dev/deckhand" target="_blank" rel="noreferrer">Source</a>
          {providerChip}
        </div>
      </header>

      {view === "home" && (
        <main className="flex-1 pb-16">
          <section className="mx-auto max-w-3xl pt-8 text-center sm:pt-16">
            <h1 className="text-balance font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">Type a topic.<br />Get a deck you&apos;d <em className="text-accent">actually present</em>.</h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-mute sm:text-base">
              A free, open-source deck maker. No credits, no watermark, no sign-up. Exports real PowerPoint you can keep editing.
            </p>
          </section>

          <section className="mx-auto mt-8 max-w-3xl">
            {banner && <div className="mb-3">{banner}</div>}
            <div className="rounded-2xl border border-line bg-panel p-2 shadow-[var(--shadow)] focus-within:border-accent/60">
              <textarea
                className="block h-28 w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed outline-none placeholder:text-mute sm:h-32"
                placeholder="What's the deck about? A topic works. So does a wall of pasted notes."
                value={prompt} maxLength={20000} autoFocus
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-2 px-1 pb-1">
                <div className="flex rounded-lg border border-line p-0.5" role="radiogroup" aria-label="Kind of deck">
                  {STYLES.map((s) => (
                    <button key={s} role="radio" aria-checked={style === s} onClick={() => setStyle(s)} className={`rounded-md px-2.5 py-1 text-xs transition ${style === s ? "bg-fg text-bg" : "text-mute hover:text-fg"}`}>{s}</button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 text-xs text-mute">
                  <select className="h-7 rounded-lg border border-line bg-panel px-1.5 text-xs text-fg" value={count} onChange={(e) => setCount(+e.target.value)} aria-label="Number of slides">
                    {[5, 6, 8, 10, 12, 15].map((n) => <option key={n} value={n}>{n} slides</option>)}
                  </select>
                </label>
                <span className="flex-1" />
                <button className="btn btn-primary" disabled={!prompt.trim() || !!busy || !ready} onClick={makeOutline}>
                  Outline it <span className="kbd hidden border-current/30 text-current opacity-70 sm:inline">⌘↵</span>
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {IDEAS.map((i) => (
                <button key={i} onClick={() => setPrompt(i)} className="rounded-full border border-line px-3 py-1 text-xs text-mute transition hover:border-mute hover:text-fg">{i}</button>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">{decks.length ? "Your decks" : "See one first"}</h2>
              <span className="text-xs text-mute">{decks.length ? "Saved in this browser only" : "No key needed to look around"}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[...decks, SAMPLE].map((d) => {
                const th = themeById(d.theme);
                return (
                  <div key={d.id} className="group relative">
                    <button onClick={() => openDeck(d)} className="block w-full overflow-hidden rounded-xl border border-line text-left transition hover:-translate-y-0.5 hover:border-mute hover:shadow-[var(--shadow)]">
                      {d.slides[0] ? <Scaled theme={th}><SlideView slide={d.slides[0]} theme={th} index={0} total={d.slides.length} /></Scaled> : <div className="aspect-video bg-sunk" />}
                      <div className="border-t border-line bg-panel px-3 py-2">
                        <div className="truncate text-[13px] font-medium">{d.title}</div>
                        <div className="text-[11px] text-mute">{d.id === "sample" ? "Example deck" : `${d.slides.length} slides`}</div>
                      </div>
                    </button>
                    {d.id !== "sample" && (
                      <button
                        className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] text-white opacity-0 transition focus:opacity-100 group-hover:opacity-100"
                        onClick={() => { if (confirm(`Delete "${d.title}"? This can't be undone.`)) { deleteDeck(d.id); setDecks(loadDecks()); } }}
                        aria-label={`Delete ${d.title}`}
                      >Delete</button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {view === "outline" && draft && (
        <main className="mx-auto w-full max-w-3xl flex-1 pb-28 pt-4">
          <button className="mb-4 text-xs text-mute hover:text-fg" onClick={() => { abort.current?.abort(); setView("home"); }}>← Change the brief</button>
          {banner && <div className="mb-3">{banner}</div>}
          <input
            className="w-full bg-transparent font-serif text-4xl leading-tight tracking-tight outline-none placeholder:text-mute sm:text-5xl"
            value={draft.title} placeholder={busy ? "Thinking of a title…" : "Deck title"}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })} aria-label="Deck title"
          />
          <p className="mt-2 text-sm text-mute">This is the plan. Fix it now: reorder, rewrite or cut. Each line becomes one slide.</p>

          <ol className="mt-5 space-y-2">
            {draft.items.map((it, i) => (
              <li key={it.id} className="rise group flex gap-3 rounded-xl border border-line bg-panel p-3">
                <span className="w-6 pt-1 text-right font-mono text-xs text-mute">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <input className="w-full bg-transparent text-[15px] font-semibold outline-none" value={it.title} aria-label={`Slide ${i + 1} title`}
                    onChange={(e) => setDraft({ ...draft, items: draft.items.map((x) => (x.id === it.id ? { ...x, title: e.target.value } : x)) })} />
                  <input className="mt-0.5 w-full bg-transparent text-sm text-mute outline-none" value={it.gist} placeholder="What this slide says" aria-label={`Slide ${i + 1} gist`}
                    onChange={(e) => setDraft({ ...draft, items: draft.items.map((x) => (x.id === it.id ? { ...x, gist: e.target.value } : x)) })} />
                </div>
                <div className="flex flex-none items-start gap-0.5 text-mute sm:opacity-0 sm:transition sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  <button className="btn btn-ghost h-7 px-1.5" disabled={i === 0 || !!busy} aria-label="Move up" onClick={() => { const a = [...draft.items]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setDraft({ ...draft, items: a }); }}>↑</button>
                  <button className="btn btn-ghost h-7 px-1.5" disabled={i === draft.items.length - 1 || !!busy} aria-label="Move down" onClick={() => { const a = [...draft.items]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; setDraft({ ...draft, items: a }); }}>↓</button>
                  <button className="btn btn-ghost h-7 px-1.5" disabled={!!busy} aria-label="Remove" onClick={() => setDraft({ ...draft, items: draft.items.filter((x) => x.id !== it.id) })}>✕</button>
                </div>
              </li>
            ))}
            {busy === "outline" && Array.from({ length: Math.max(1, Math.min(3, count - draft.items.length)) }).map((_, i) => <li key={i} className="shimmer h-[66px] rounded-xl" />)}
          </ol>
          {!busy && (
            <button className="mt-2 w-full rounded-xl border border-dashed border-line py-2.5 text-sm text-mute hover:border-mute hover:text-fg"
              onClick={() => setDraft({ ...draft, items: [...draft.items, { id: uid(), title: "", gist: "" }] })}>+ Add a slide</button>
          )}

          <h2 className="mb-2 mt-8 text-sm font-semibold">Pick a look <span className="font-normal text-mute">· you can restyle any time</span></h2>
          <ThemeSwatches value={draft.theme} onChange={(id) => setDraft({ ...draft, theme: id })} />

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/90 backdrop-blur">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <span className="text-xs text-mute">{busy === "outline" ? "Outlining…" : `${draft.items.length} slides · ${themeById(draft.theme).name}`}</span>
              <button className="btn btn-primary h-10 px-5" disabled={!!busy || !draft.items.length} onClick={makeDeck}>
                Build the deck <span className="kbd hidden border-current/30 text-current opacity-70 sm:inline">⌘↵</span>
              </button>
            </div>
          </div>
        </main>
      )}

      <footer className="border-t border-line py-5 text-center text-xs leading-relaxed text-mute">
        Deckhand is a free alternative to paid deck makers. Decks stay in your browser. AI runs on{" "}
        <a className="underline underline-offset-2" href="https://publikhq.com" target="_blank" rel="noreferrer">publik API</a> or your own key.
      </footer>
      {dialog}
    </div>
  );
}

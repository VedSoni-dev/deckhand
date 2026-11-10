"use client";

import { useEffect, useRef, useState } from "react";
import { TRANSITION_LEAD, TRANSITION_MS, type Transition } from "@/lib/motion";
import type { Theme } from "@/lib/themes";
import type { Slide } from "@/lib/types";
import { SlideView } from "./SlideView";
import { Scaled } from "./ui";

export function Present({ slides, theme, start, transition, onClose }: {
  slides: Slide[]; theme: Theme; start: number; transition: Transition; onClose: () => void;
}) {
  const [state, setState] = useState({ i: Math.min(start, slides.length - 1), prev: -1, dir: 1, n: 0 });
  const root = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  const wasFs = useRef(false);

  const to = (next: number) =>
    setState((s) => {
      const i = Math.max(0, Math.min(slides.length - 1, next));
      return i === s.i ? s : { i, prev: s.i, dir: i > s.i ? 1 : -1, n: s.n + 1 };
    });
  const go = (d: number) => setState((s) => {
    const i = Math.max(0, Math.min(slides.length - 1, s.i + d));
    return i === s.i ? s : { i, prev: s.i, dir: d, n: s.n + 1 };
  });

  // Drop the outgoing slide once its exit has played.
  useEffect(() => {
    if (state.prev < 0) return;
    const t = setTimeout(() => setState((s) => (s.n === state.n ? { ...s, prev: -1 } : s)), TRANSITION_MS);
    return () => clearTimeout(t);
  }, [state.n, state.prev]);

  useEffect(() => {
    root.current?.requestFullscreen?.().catch(() => {});
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (["ArrowRight", "ArrowDown", " ", "PageDown", "Enter"].includes(e.key)) { e.preventDefault(); go(1); }
      else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); go(-1); }
      else if (e.key === "Home") to(0);
      else if (e.key === "End") to(slides.length - 1);
    };
    const fs = () => { if (!document.fullscreenElement && wasFs.current) onClose(); wasFs.current = !!document.fullscreenElement; };
    window.addEventListener("keydown", key);
    document.addEventListener("fullscreenchange", fs);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("fullscreenchange", fs);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { i, prev, dir, n } = state;
  const lead = n === 0 ? 0 : TRANSITION_LEAD[transition];
  return (
    <div
      ref={root}
      className="screen-only fixed inset-0 z-[60] cursor-pointer select-none bg-black"
      onClick={(e) => go(e.clientX < window.innerWidth * 0.3 ? -1 : 1)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) { e.preventDefault(); go(dx < 0 ? 1 : -1); }
        touch.current = null;
      }}
    >
      <Scaled theme={theme} fit="contain" className="h-full w-full">
        <div className={`stage tr-${transition}`} style={{ ["--d" as string]: dir }}>
          {prev >= 0 && slides[prev] && (
            <div key={`out-${n}`} className="tr-layer tr-out">
              <SlideView slide={slides[prev]} theme={theme} index={prev} total={slides.length} />
            </div>
          )}
          <div key={`in-${n}`} className={`tr-layer ${n ? "tr-in" : ""}`}>
            <SlideView slide={slides[i]} theme={theme} index={i} total={slides.length} play lead={lead} />
          </div>
          <div key={`c-${n}`} className={`tr-curtain ${n ? "on" : ""}`} />
        </div>
      </Scaled>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
        <div className="h-full bg-white/70 transition-[width] duration-300" style={{ width: `${((i + 1) / slides.length) * 100}%` }} />
      </div>
      <button className="absolute right-3 top-3 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/80 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); onClose(); }}>
        Exit <span className="opacity-60">esc</span>
      </button>
    </div>
  );
}

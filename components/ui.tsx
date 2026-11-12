"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { THEMES, themeVars, type Theme } from "@/lib/themes";
import type { LLMError } from "@/lib/llm";

/** Draws its 1280×720 child scaled to whatever width it is given. */
export function Scaled({ children, className, theme, fit }: { children: React.ReactNode; className?: string; theme: Theme; fit?: "width" | "contain" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      // clientWidth, not getBoundingClientRect: an entrance animation's transform must not skew the measure.
      setScale(fit === "contain" ? Math.min(el.clientWidth / 1280, el.clientHeight / 720) : el.clientWidth / 1280);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);
  return (
    <div
      ref={ref}
      className={className}
      style={{ ...themeVars(theme), ...(fit === "contain" ? { display: "grid", placeItems: "center" } : { aspectRatio: "16 / 9" }), position: "relative", overflow: "hidden" }}
    >
      <div style={{ width: 1280 * scale, height: 720 * scale, visibility: scale ? "visible" : "hidden" }}>
        <div style={{ width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: "0 0" }}>{children}</div>
      </div>
    </div>
  );
}

export function ThemeSwatches({ value, onChange, compact }: { value: string; onChange: (id: string) => void; compact?: boolean }) {
  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-4" : "grid-cols-4 sm:grid-cols-8"}`} role="radiogroup" aria-label="Theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          role="radio"
          aria-checked={value === t.id}
          onClick={() => onChange(t.id)}
          title={t.name}
          className={`group rounded-xl border p-1 text-left transition ${value === t.id ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-mute"}`}
        >
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg" style={{ background: t.bg }}>
            <div className="absolute left-2 top-2 h-1 w-4" style={{ background: t.accent }} />
            <div className="absolute bottom-2 left-2 text-[11px] font-semibold leading-none" style={{ color: t.text, fontFamily: themeVars(t)["--s-heading" as keyof React.CSSProperties] as string }}>Aa</div>
            <div className="absolute bottom-0 right-0 top-0 w-1/3" style={{ background: t.surface }} />
            <div className="absolute bottom-2 right-2 size-2.5 rounded-full" style={{ background: t.accent }} />
          </div>
          <div className="px-1 pb-0.5 pt-1 text-[11px] text-mute group-aria-checked:text-fg">{t.name}</div>
        </button>
      ))}
    </div>
  );
}

export function ErrorBanner({ error, onDismiss, onSettings, onRetry }: {
  error: LLMError | Error; onDismiss: () => void; onSettings: () => void; onRetry?: () => void;
}) {
  const e = error as LLMError;
  return (
    <div role="alert" className="rise flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
      <span className="min-w-0 flex-1 basis-60">{e.message}</span>
      {/* 402 from publik API: its message plus exactly one link, error.top_up_url. */}
      {e.kind === "balance" && e.link?.startsWith("https://") && (
        <a className="btn btn-primary" href={e.link} target="_blank" rel="noopener noreferrer">Top up on publik</a>
      )}
      {(e.kind === "auth" || e.kind === "no_key" || e.kind === "consent") && (
        <button className="btn" onClick={onSettings}>Open settings</button>
      )}
      {onRetry && e.kind !== "no_key" && e.kind !== "consent" && <button className="btn" onClick={onRetry}>Try again</button>}
      <button className="btn btn-ghost" onClick={onDismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="screen-only fixed inset-0 z-50 grid place-items-end bg-black/50 backdrop-blur-sm sm:place-items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`rise max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-line bg-panel p-5 shadow-[var(--shadow)] sm:rounded-2xl ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button className="btn btn-ghost -mr-2" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** A button with a small menu that closes on outside click or Escape. */
export function Menu({ label, children, align = "right", className = "btn", title }: {
  label: React.ReactNode; children: (close: () => void) => React.ReactNode; align?: "left" | "right"; className?: string; title?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", down);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("mousedown", down); window.removeEventListener("keydown", key); };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button className={className} onClick={() => setOpen((o) => !o)} aria-expanded={open} title={title}>{label}</button>
      {open && (
        <div className={`rise absolute top-full z-40 mt-1.5 min-w-52 rounded-xl border border-line bg-panel p-1.5 shadow-[var(--shadow)] ${align === "right" ? "right-0" : "left-0"}`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export const MenuItem = ({ children, onClick, hint, danger }: { children: React.ReactNode; onClick: () => void; hint?: string; danger?: boolean }) => (
  <button onClick={onClick} className={`flex w-full items-center justify-between gap-6 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-sunk ${danger ? "text-accent" : ""}`}>
    <span>{children}</span>
    {hint && <span className="text-xs text-mute">{hint}</span>}
  </button>
);

export const Logo = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="6" width="16" height="11" rx="2.5" fill="var(--accent)" opacity="0.35" transform="rotate(-8 10 12)" />
    <rect x="5" y="7" width="17" height="11" rx="2.5" fill="var(--accent)" />
    <rect x="8" y="10.5" width="7" height="1.8" rx="0.9" fill="var(--accent-fg)" />
    <rect x="8" y="13.6" width="10.5" height="1.4" rx="0.7" fill="var(--accent-fg)" opacity="0.7" />
  </svg>
);

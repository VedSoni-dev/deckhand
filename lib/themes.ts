export type ArtKind = "orbs" | "rings" | "grid" | "lines" | "blocks";

export interface Theme {
  id: string;
  name: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  line: string;
  heading: "serif" | "sans" | "grotesk" | "mono";
  body: "sans" | "grotesk" | "mono";
  art: ArtKind;
  dark: boolean;
}

export const THEMES: Theme[] = [
  { id: "paper", name: "Paper", bg: "#f6f1e7", surface: "#ece5d6", text: "#1d1a16", muted: "#6f675b", accent: "#c8472b", accent2: "#1f4d45", line: "#d8cfbd", heading: "serif", body: "sans", art: "rings", dark: false },
  { id: "ink", name: "Ink", bg: "#0c0c0d", surface: "#18181b", text: "#f4f4f1", muted: "#9a9a94", accent: "#c8f542", accent2: "#7c5cff", line: "#2a2a2e", heading: "grotesk", body: "sans", art: "grid", dark: true },
  { id: "cobalt", name: "Cobalt", bg: "#1433d6", surface: "#1f40ea", text: "#ffffff", muted: "#b9c5ff", accent: "#ffd84a", accent2: "#ff8a5c", line: "#3a57f0", heading: "grotesk", body: "sans", art: "blocks", dark: true },
  { id: "blush", name: "Blush", bg: "#fbeee9", surface: "#f5ddd5", text: "#3b1230", muted: "#8a5c74", accent: "#e0457b", accent2: "#3b1230", line: "#edcfc5", heading: "serif", body: "sans", art: "orbs", dark: false },
  { id: "forest", name: "Forest", bg: "#10261f", surface: "#183429", text: "#f2ead8", muted: "#a3b3a2", accent: "#e3b34c", accent2: "#7fd1a8", line: "#27473a", heading: "serif", body: "sans", art: "lines", dark: true },
  { id: "studio", name: "Studio", bg: "#ffffff", surface: "#f3f3f1", text: "#0b0b0b", muted: "#6b6b6b", accent: "#ff4f1a", accent2: "#0b0b0b", line: "#e3e3df", heading: "sans", body: "sans", art: "blocks", dark: false },
  { id: "dusk", name: "Dusk", bg: "#1b1033", surface: "#291a4a", text: "#fdf3ff", muted: "#b9a6d6", accent: "#ff7a59", accent2: "#8be9ff", line: "#3a2863", heading: "sans", body: "sans", art: "orbs", dark: true },
  { id: "terminal", name: "Terminal", bg: "#07100b", surface: "#0d1a12", text: "#d7ffe3", muted: "#6ea582", accent: "#3dff8b", accent2: "#f6ff7a", line: "#17301f", heading: "mono", body: "mono", art: "grid", dark: true },
];

export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];

const FONT: Record<string, string> = {
  serif: "var(--font-serif), Georgia, serif",
  sans: "var(--font-geist-sans), system-ui, sans-serif",
  grotesk: "var(--font-grotesk), system-ui, sans-serif",
  mono: "var(--font-geist-mono), ui-monospace, monospace",
};

export function themeVars(t: Theme): React.CSSProperties {
  return {
    "--s-bg": t.bg,
    "--s-surface": t.surface,
    "--s-text": t.text,
    "--s-muted": t.muted,
    "--s-accent": t.accent,
    "--s-accent2": t.accent2,
    "--s-line": t.line,
    "--s-heading": FONT[t.heading],
    "--s-body": FONT[t.body],
  } as React.CSSProperties;
}

/** Font names PowerPoint can resolve on most machines. */
export const PPT_FONT: Record<string, string> = {
  serif: "Georgia",
  sans: "Helvetica Neue",
  grotesk: "Arial",
  mono: "Courier New",
};

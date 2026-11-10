export type Layout =
  | "title"
  | "section"
  | "bullets"
  | "cards"
  | "stats"
  | "timeline"
  | "steps"
  | "compare"
  | "quote"
  | "statement"
  | "chart"
  | "hero"
  | "closing";

export const LAYOUTS: Layout[] = [
  "title", "section", "bullets", "cards", "stats", "timeline",
  "steps", "compare", "quote", "statement", "chart", "hero", "closing",
];

export interface Item {
  title?: string;
  text?: string;
  value?: string;
}

export interface Column {
  title: string;
  bullets: string[];
}

export interface Slide {
  id: string;
  layout: Layout;
  title?: string;
  subtitle?: string;
  text?: string;
  bullets?: string[];
  items?: Item[];
  left?: Column;
  right?: Column;
  by?: string;
  notes?: string;
}

export interface OutlineItem {
  id: string;
  title: string;
  gist: string;
}

export interface Deck {
  id: string;
  title: string;
  prompt: string;
  theme: string;
  transition?: string;
  slides: Slide[];
  createdAt: number;
  updatedAt: number;
}

export type ProviderId = "publik" | "openai" | "anthropic";

export interface Settings {
  provider: ProviderId;
  openaiKey: string;
  openaiModel: string;
  openaiBase: string;
  anthropicKey: string;
  anthropicModel: string;
  publikTier: "publik-fast" | "publik-balanced" | "publik-smart";
}

export const uid = () =>
  Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

import type { Deck, Settings } from "./types";

const DECKS = "deckhand:decks:v1";
const SETTINGS = "deckhand:settings:v1";

export const DEFAULT_SETTINGS: Settings = {
  provider: "publik",
  openaiKey: "",
  openaiModel: "",
  openaiBase: "https://api.openai.com/v1",
  anthropicKey: "",
  anthropicModel: "claude-haiku-5-5",
  publikTier: "publik-balanced",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const loadDecks = (): Deck[] =>
  read<Deck[]>(DECKS, []).filter((d) => d && Array.isArray(d.slides)).sort((a, b) => b.updatedAt - a.updatedAt);

export function saveDeck(deck: Deck): boolean {
  const rest = read<Deck[]>(DECKS, []).filter((d) => d.id !== deck.id);
  return write(DECKS, [deck, ...rest].slice(0, 60));
}

export function deleteDeck(id: string) {
  write(DECKS, read<Deck[]>(DECKS, []).filter((d) => d.id !== id));
}

export const loadSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(SETTINGS, {}) });
export const saveSettings = (s: Settings) => write(SETTINGS, s);

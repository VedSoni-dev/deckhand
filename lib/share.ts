import type { Deck } from "./types";

const b64url = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const unb64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([data as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** The whole deck lives in the link: nothing is uploaded anywhere. */
export async function encodeDeck(deck: Deck): Promise<string> {
  const slim = { t: deck.title, th: deck.theme, s: deck.slides.map(({ id: _id, ...rest }) => (void _id, rest)) };
  const bytes = new TextEncoder().encode(JSON.stringify(slim));
  return b64url(await pipe(bytes, new CompressionStream("deflate-raw")));
}

export async function decodeDeck(code: string): Promise<Pick<Deck, "title" | "theme" | "slides"> | null> {
  try {
    const bytes = await pipe(unb64url(code), new DecompressionStream("deflate-raw"));
    const o = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(o.s)) return null;
    return { title: String(o.t ?? "Shared deck"), theme: String(o.th ?? "paper"), slides: o.s };
  } catch {
    return null;
  }
}

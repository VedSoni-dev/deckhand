// Deckhand's publik API route. The client streams every model call; on the publik path it comes here,
// and this route uses this browser's own install key (resolveProvider(), from the sealed http-only cookie)
// with a tier model. Own OpenAI or Anthropic keys never come here: they go from the browser straight to
// the provider, exactly as before. The base URL is lib/publik.ts's, never anything from a cookie.
import { cookies } from "next/headers";
import { MODELS, TIERS, resolveProvider, topUpUrlFrom402 } from "@/lib/publik";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Streams one publik chat completion: { tier?, system, user }. A 402 answers error.message plus error.top_up_url. */
export async function POST(req: Request) {
  const p = resolveProvider(await cookies(), null);
  if (p.kind !== "publik") {
    return Response.json({ error: { message: "This browser uses your own key. Pick publik plan in Settings to use publik API." } }, { status: 428 });
  }
  const body = (await req.json().catch(() => ({}))) as { tier?: string; system?: string; user?: string };
  const system = String(body.system ?? "").slice(0, 8_000);
  const user = String(body.user ?? "").slice(0, 60_000);
  if (!user) return Response.json({ error: { message: "Nothing to send." } }, { status: 400 });
  const model = TIERS.includes(body.tier ?? "") ? body.tier! : MODELS.balanced;

  let upstream: Response;
  try {
    upstream = await fetch(`${p.baseURL}/chat/completions`, {
      method: "POST",
      signal: req.signal,
      cache: "no-store",
      headers: { "content-type": "application/json", authorization: `Bearer ${p.apiKey}` },
      body: JSON.stringify({
        model, stream: true,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });
  } catch {
    return Response.json({ error: { message: "publik API is not reachable right now. Try again, or use your own key." } }, { status: 502 });
  }

  const headers = new Headers({ "cache-control": "no-store" });
  upstream.headers.forEach((v, k) => {
    if (k.startsWith("x-publik-")) headers.set(k, v);
  });
  if (upstream.status === 402) {
    // publik's message and exactly one link, its top_up_url.
    const t = topUpUrlFrom402(await upstream.json().catch(() => null));
    return Response.json({ error: { message: t.message, ...(t.url ? { top_up_url: t.url } : {}) } }, { status: 402, headers });
  }
  if (!upstream.ok || !upstream.body) {
    headers.set("content-type", "application/json");
    return new Response(await upstream.text(), { status: upstream.status, headers });
  }
  headers.set("content-type", "text/event-stream");
  return new Response(upstream.body, { status: 200, headers });
}

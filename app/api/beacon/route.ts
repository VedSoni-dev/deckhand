// POST /api/beacon — every build reports here: which build, which event, which AI mode, a random id per browser.
// No content, no IP, no account. Builds send it from their server; browsers with DNT/GPC never send it.
import { record, type HubEvent } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENTS = new Set(["app_opened", "active_session", "ai_call"]);
const MODES = new Set(["local", "chatgpt", "claude", "openai", "publik"]);
const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const hits = new Map<string, { n: number; at: number }>(); // best-effort flood guard per build+install, in memory only

export async function POST(req: Request): Promise<Response> {
  let b: Partial<HubEvent> & { v?: number };
  try { b = await req.json(); } catch { return Response.json({ error: "bad json" }, { status: 400 }); }
  const build = String(b.build ?? "");
  const install = String(b.install ?? "").toLowerCase();
  if (b.v !== 1 || !/^[a-z][a-z0-9-]{1,30}$/.test(build) || !EVENTS.has(String(b.event)) || !UUID4.test(install))
    return Response.json({ error: "bad beacon" }, { status: 400 });
  const mode = b.mode && MODES.has(String(b.mode)) ? String(b.mode) : null;
  const k = `${build}:${install}`, now = Date.now(), h = hits.get(k);
  if (h && now - h.at < 60_000 && h.n >= 30) return new Response(null, { status: 429 });
  hits.set(k, h && now - h.at < 60_000 ? { n: h.n + 1, at: h.at } : { n: 1, at: now });
  if (hits.size > 50_000) hits.clear();
  try {
    await record({ build, event: b.event as HubEvent["event"], mode, install, publik: b.publik === true, app_version: typeof b.app_version === "string" ? b.app_version.slice(0, 64) : null });
  } catch (e) {
    process.stderr.write(`hub beacon: ${e instanceof Error ? e.message : e}\n`);
  }
  return new Response(null, { status: 202 });
}

// Where beacons go. Supabase when SUPABASE_URL + SUPABASE_KEY (the PUBLISHABLE key) are set (db/schema.sql: insert-only
// for the public, stats only with the hash of HUB_STATS_KEY), a local JSONL file in development, nowhere otherwise
// (accepted and dropped, so builds never error because of the hub). No Supabase secret key is used anywhere.
import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface HubEvent { build: string; event: "app_opened" | "active_session" | "ai_call"; mode: string | null; install: string; publik: boolean; app_version: string | null }
export interface BuildStats { build: string; users: number; publik_users: number; opens: number; ai_calls: number; ai_local: number; ai_chatgpt: number; ai_claude: number; ai_openai: number; ai_publik: number; last_seen: string | null }

const SB = process.env.SUPABASE_URL?.replace(/\/$/, "");
const KEY = process.env.SUPABASE_KEY;
const headers = () => ({ apikey: KEY!, "content-type": "application/json" });
export const statsKeyHash = () => createHash("sha256").update(process.env.HUB_STATS_KEY ?? "").digest("hex");
const FILE = join(process.cwd(), ".data", "events.jsonl");
export const storeKind = (): "supabase" | "file" | "none" => (SB && KEY ? "supabase" : process.env.NODE_ENV !== "production" || process.env.HUB_FILE_STORE === "1" ? "file" : "none");

export async function record(e: HubEvent): Promise<void> {
  const kind = storeKind();
  if (kind === "supabase") {
    const r = await fetch(`${SB}/rest/v1/hub_events`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(5000),
      headers: { ...headers(), prefer: "return=minimal" },
      body: JSON.stringify(e),
    });
    if (!r.ok) throw new Error(`supabase ${r.status}`);
  } else if (kind === "file") {
    await mkdir(join(process.cwd(), ".data"), { recursive: true });
    await appendFile(FILE, `${JSON.stringify({ at: new Date().toISOString(), ...e })}\n`);
  }
}

export async function stats(days: number): Promise<BuildStats[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const kind = storeKind();
  if (kind === "supabase") {
    const r = await fetch(`${SB}/rest/v1/rpc/hub_stats`, {
      method: "POST", cache: "no-store", headers: headers(),
      body: JSON.stringify({ since, key_sha256: statsKeyHash() }),
    });
    if (!r.ok) throw new Error(`supabase ${r.status}`);
    return ((await r.json()) as BuildStats[]).map((s) => ({ ...s, users: Number(s.users), publik_users: Number(s.publik_users), opens: Number(s.opens), ai_calls: Number(s.ai_calls), ai_local: Number(s.ai_local), ai_chatgpt: Number(s.ai_chatgpt), ai_claude: Number(s.ai_claude), ai_openai: Number(s.ai_openai ?? 0), ai_publik: Number(s.ai_publik) }));
  }
  if (kind === "none") return [];
  let lines: string[] = [];
  try { lines = (await readFile(FILE, "utf8")).split("\n").filter(Boolean); } catch { return []; }
  const by = new Map<string, { ins: Set<string>; pub: Set<string>; s: BuildStats }>();
  for (const l of lines) {
    const e = JSON.parse(l) as HubEvent & { at: string };
    if (e.at < since) continue;
    const b = by.get(e.build) ?? { ins: new Set(), pub: new Set(), s: { build: e.build, users: 0, publik_users: 0, opens: 0, ai_calls: 0, ai_local: 0, ai_chatgpt: 0, ai_claude: 0, ai_openai: 0, ai_publik: 0, last_seen: null } };
    b.ins.add(e.install); if (e.publik) b.pub.add(e.install);
    if (e.event === "app_opened") b.s.opens++;
    if (e.event === "ai_call") { b.s.ai_calls++; const k = `ai_${e.mode}` as keyof BuildStats; if (k in b.s) (b.s[k] as number)++; }
    if (!b.s.last_seen || e.at > b.s.last_seen) b.s.last_seen = e.at;
    by.set(e.build, b);
  }
  return [...by.values()].map((b) => ({ ...b.s, users: b.ins.size, publik_users: b.pub.size })).sort((a, b) => b.users - a.users);
}

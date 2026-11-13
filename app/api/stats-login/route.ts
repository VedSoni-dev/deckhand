// Sets the stats cookie (a hash of HUB_STATS_KEY) after /stats?key=… checked the key, then goes back to /stats.
import { createHash } from "node:crypto";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const want = process.env.HUB_STATS_KEY;
  const d = url.searchParams.get("d") ?? "";
  if (!want || d !== createHash("sha256").update(`hub-stats:${want}`).digest("hex")) return new Response("no", { status: 403 });
  const days = url.searchParams.get("days") ?? "7";
  return new Response(null, {
    status: 303,
    headers: { location: `/stats?days=${encodeURIComponent(days)}`, "set-cookie": `hub-stats=${d}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${url.protocol === "https:" ? "; Secure" : ""}` },
  });
}

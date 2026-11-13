// "/stats": which build each user came from (publik's dashboard shows one listing for all of them).
// Private: open /stats?key=<HUB_STATS_KEY> once; the browser keeps a cookie. Open without a key in development.
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { stats, storeKind } from "@/lib/store";
import { BUILDS, isKnown } from "@/lib/builds";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stats", robots: { index: false } };

const digest = (k: string) => createHash("sha256").update(`hub-stats:${k}`).digest("hex");

export default async function Stats({ searchParams }: { searchParams: Promise<{ key?: string; days?: string }> }) {
  const sp = await searchParams;
  const want = process.env.HUB_STATS_KEY;
  const jar = await cookies();
  if (want) {
    if (sp.key) {
      if (sp.key !== want) return <p className="p-10">Wrong key.</p>;
      redirect(`/api/stats-login?d=${digest(want)}&days=${encodeURIComponent(sp.days ?? "7")}`);
    }
    if (jar.get("hub-stats")?.value !== digest(want)) return <p className="p-10 text-mute">Private. Open /stats?key=… once.</p>;
  } else if (process.env.NODE_ENV === "production") {
    return <p className="p-10 text-mute">Set HUB_STATS_KEY to open stats.</p>;
  }
  const days = [1, 7, 28, 90].includes(Number(sp.days)) ? Number(sp.days) : 7;
  let rows: Awaited<ReturnType<typeof stats>> = [];
  let error: string | null = null;
  try { rows = await stats(days); } catch (e) { error = e instanceof Error ? e.message : String(e); }
  const name = (slug: string) => BUILDS.find((b) => b.slug === slug)?.name ?? slug;
  const total = rows.reduce((a, r) => ({ users: a.users + r.users, publik: a.publik + r.publik_users, ai: a.ai + r.ai_calls }), { users: 0, publik: 0, ai: 0 });
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Where users come from</h1>
          <p className="mt-1 text-mute">publik counts all of these under one listing. This splits them by build. Store: {storeKind()}.</p>
        </div>
        <nav className="flex gap-1">
          {[1, 7, 28, 90].map((d) => <a key={d} href={`/stats?days=${d}`} className={`btn min-h-11 ${d === days ? "btn-primary" : "btn-ghost"}`}>{d === 1 ? "24 h" : `${d} d`}</a>)}
        </nav>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[["People", total.users], ["Signed in with publik", total.publik], ["AI answers", total.ai]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-line bg-panel p-5"><p className="text-sm text-mute">{k}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{v}</p></div>
        ))}
      </div>
      {error && <p className="mt-6 text-red-500">Couldn&apos;t read stats: {error}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-panel">
        <table className="stats w-full text-sm">
          <thead className="text-mute"><tr><th>Build</th><th>People</th><th>publik</th><th>Opens</th><th>AI</th><th>Local</th><th>ChatGPT</th><th>Claude</th><th>publik AI</th><th>Last seen</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={10} className="text-mute">Nothing yet in this window.</td></tr>}
            {rows.map((r) => (
              <tr key={r.build}>
                <td>{name(r.build)}{!isKnown(r.build) && <span className="ml-2 text-xs text-mute">(not in builds.json)</span>}</td>
                <td>{r.users}</td><td>{r.publik_users}</td><td>{r.opens}</td><td>{r.ai_calls}</td><td>{r.ai_local}</td><td>{r.ai_chatgpt}</td><td>{r.ai_claude}</td><td>{r.ai_publik}</td>
                <td className="text-mute">{r.last_seen ? new Date(r.last_seen).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-mute">People = distinct anonymous browser ids. publik = of those, signed in with publik. Nothing personal is stored.</p>
    </main>
  );
}

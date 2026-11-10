import { cookies } from "next/headers";
import { COOKIE, DISCLOSURE, available, balanceLine, unseal } from "@/lib/publik";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const c = unseal((await cookies()).get(COOKIE)?.value);
  if (!c) return Response.json({ available: available(), connected: false, disclosure: DISCLOSURE });

  let micros: number | null = null;
  let claimState: "anonymous" | "claimed" = "anonymous";
  try {
    const res = await fetch(`${c.base_url}/wallet`, { headers: { authorization: `Bearer ${c.key}` }, cache: "no-store" });
    if (res.ok) {
      const w = (await res.json()) as Record<string, unknown>;
      const m = w.balance_micros ?? (w.wallet as Record<string, unknown> | undefined)?.balance_micros;
      if (typeof m === "number") micros = m;
      const cs = w.claim_state ?? (w.claimed === true ? "claimed" : undefined);
      if (cs === "claimed" || (micros ?? 0) > 0) claimState = "claimed";
    }
  } catch {
    /* the wallet line is a nicety; the card still renders without it */
  }
  return Response.json({
    available: true, connected: true, disclosure: DISCLOSURE,
    balanceLine: balanceLine(micros, claimState), cost: c.cost_sentence,
    claimUrl: c.claim_url, addCreditUrl: c.add_credit_url, claimState,
  });
}

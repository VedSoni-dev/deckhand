# Vedant's builds (the hub): notes for coding agents

- Next.js (App Router). `/` catalog (`builds.json`), `/app` launcher behind `<PublikGate>`, `/stats` private attribution,
  `POST /api/beacon` the builds' anonymous usage beacons (`lib/store.ts`: Supabase via REST, or `.data/events.jsonl` in dev).
- `lib/publik.ts` is publik's module for this listing (`APP_SLUG = "deckhand"`, the listing's slug; `USES_AI = false`:
  the hub itself calls no model). Keep its literal `APP_SLUG`, `/api/v1/installs`, `/api/v1/telemetry` and `app_opened`:
  publik's scan looks for them.
- Builds don't live here. They're in `~/Projects/vedanttalksai/apps/<slug>` with their own repos, and share this listing's
  `publik-app-token.txt` through the studio kit (`kit/hub.json`).
- Never read `.env*`, never print or commit `pk_`/`pbt_` keys or the Supabase service key. The `pat_` app token is public by design.

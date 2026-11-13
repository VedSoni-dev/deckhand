<div align="center">

# Vedant's builds

**Free, open-source apps from [@vedanttalksai](https://instagram.com/vedanttalksai). One publik sign-in for all of them.**

[**Open the hub →**](https://builds.vedantsoni.com) &nbsp;·&nbsp; [Your apps](https://builds.vedantsoni.com/app)

</div>

Clones of paid software, useful AI tools and things I wanted to exist. Each app lives in its own repository at its own
address (`<app>.vedantsoni.com`). This repository is the hub that ties them together:

- **The catalog** at `/`: every build, with links to the app and its code. The list is [`builds.json`](builds.json).
- **Sign in with publik** at `/app`. Every build uses this hub's publik identity, so one publik account works in all of
  them, and each app doesn't need its own listing.
- **Attribution** at `/stats` (private). publik counts everyone under this one listing; the hub splits it by build. Each
  build sends an anonymous beacon to `POST /api/beacon` when it's opened and when it answers with AI: the build's name, the
  AI mode (local, ChatGPT, Claude or publik), and a random id per browser. No content, no IP, no account. Browsers with
  Do Not Track or Global Privacy Control are never counted.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000, stats at /stats (open in development)
```

| Env | What |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Where beacons are stored (run [`db/schema.sql`](db/schema.sql) once). Without them, development writes `.data/events.jsonl` and production drops beacons. |
| `HUB_STATS_KEY` | Opens `/stats` in production (`/stats?key=…` once per browser). |
| `PUBLIK_COOKIE_SECRET` | Seals each browser's publik key cookie (see `lib/publik.ts`). |
| `HUB_URL` | The hub's public address (default `https://builds.vedantsoni.com`). |

`publik-app-token.txt` is this listing's public app token: it only mints capped keys and is meant to be committed.
`PUBLIK_SELF_TEST=1 npm run start` on a built copy prints `publik self-test: ok deckhand <version>`.

## History

This repository used to be **Deckhand**, a free Gamma alternative. Its last version is tagged
[`v0.1.4`](https://github.com/VedSoni-dev/deckhand/tree/v0.1.4).

## License

[MIT](LICENSE) © Vedant Soni

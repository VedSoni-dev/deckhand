<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## publik API
- Base URL: https://publikhq.com/api/v1 (OpenAI Chat Completions, Responses, Anthropic Messages)
- Models: publik-fast, publik-balanced, publik-smart only; never a vendor model name
- Sign in with publik: the publik module's gate runs before the app's first screen. `/` (`app/page.tsx`) is a public landing page with no gate; `<PublikGate>` (`components/PublikGate.tsx`) wraps only the software at `/app` (`app/app/page.tsx`), never the root layout. The words and every publik call are in `lib/publik.ts`; `PublikPitch` is the publik message shown on the gate and the landing. The gate also sends usage telemetry (app_opened, then active_session every 30 minutes) through `/api/publik/telemetry`
- Key: per-install `pk_` from POST /installs. This app is hosted for many browsers, so each browser gets its own install and its key is sealed into an http-only cookie (`lib/publik.ts`) instead of the publik credential file; it never reaches client code. Pick the key with `resolveProvider(await cookies(), userKey)`. Env PUBLIK_API_KEY / PUBLIK_API_BASE_URL override in `next dev` only
- App token: publik-app-token.txt (public by design, committed) or PUBLIK_APP_TOKEN. Cookie seal: PUBLIK_COOKIE_SECRET (falls back to a hash of the app token)
- Self-test: `npm run build && PUBLIK_SELF_TEST=1 npm run start` prints `publik self-test: ok <slug> <version>` (instrumentation.ts)
- 402: show error.message plus error.top_up_url only
- Never print or log a key
- Docs: https://publikhq.com/llms.txt, https://publikhq.com/developers, https://publikhq.com/skills/api.md

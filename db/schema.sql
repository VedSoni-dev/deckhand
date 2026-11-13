-- Attribution for the builds hub: which build each anonymous user came from, and which AI mode answered.
-- The hub talks to Supabase with the project's PUBLISHABLE key only (no secret key anywhere):
--   * anyone may INSERT a beacon (shape enforced by the checks below); nobody can read rows through the API;
--   * stats come from hub_stats(), which only answers when given the hash of HUB_STATS_KEY (stored privately below).
create table if not exists public.hub_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  build text not null check (build ~ '^[a-z][a-z0-9-]{1,30}$'),
  event text not null check (event in ('app_opened', 'active_session', 'ai_call')),
  mode text check (mode in ('local', 'chatgpt', 'claude', 'openai', 'publik')),
  install uuid not null,
  publik boolean not null default false,
  app_version text check (char_length(app_version) <= 64)
);
create index if not exists hub_events_build_at on public.hub_events (build, at desc);
create index if not exists hub_events_at on public.hub_events (at desc);
alter table public.hub_events enable row level security;
drop policy if exists "beacons can be added" on public.hub_events;
create policy "beacons can be added" on public.hub_events for insert to anon, authenticated with check (true);
revoke select, update, delete on public.hub_events from anon, authenticated;

-- Private config, not exposed through the API: the sha256 (hex) of HUB_STATS_KEY.
create schema if not exists hub_private;
revoke all on schema hub_private from public, anon, authenticated;
create table if not exists hub_private.config (
  id int primary key default 1 check (id = 1),
  stats_key_sha256 text not null check (stats_key_sha256 ~ '^[0-9a-f]{64}$')
);
-- Set it once (the hub prints nothing; compute the hash from HUB_STATS_KEY):
--   insert into hub_private.config (stats_key_sha256) values ('<sha256 hex>') on conflict (id) do update set stats_key_sha256 = excluded.stats_key_sha256;

drop function if exists public.hub_stats(timestamptz);
drop function if exists public.hub_stats(timestamptz, text);   -- its return columns change when a mode is added
create function public.hub_stats(since timestamptz, key_sha256 text)
returns table (build text, users bigint, publik_users bigint, opens bigint, ai_calls bigint,
               ai_local bigint, ai_chatgpt bigint, ai_claude bigint, ai_openai bigint, ai_publik bigint, last_seen timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from hub_private.config c where c.stats_key_sha256 = key_sha256) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select e.build,
           count(distinct e.install),
           count(distinct e.install) filter (where e.publik),
           count(*) filter (where e.event = 'app_opened'),
           count(*) filter (where e.event = 'ai_call'),
           count(*) filter (where e.event = 'ai_call' and e.mode = 'local'),
           count(*) filter (where e.event = 'ai_call' and e.mode = 'chatgpt'),
           count(*) filter (where e.event = 'ai_call' and e.mode = 'claude'),
           count(*) filter (where e.event = 'ai_call' and e.mode = 'openai'),
           count(*) filter (where e.event = 'ai_call' and e.mode = 'publik'),
           max(e.at)
    from public.hub_events e where e.at >= since
    group by e.build order by 2 desc;
end $$;
revoke all on function public.hub_stats(timestamptz, text) from public;
grant execute on function public.hub_stats(timestamptz, text) to anon, authenticated;

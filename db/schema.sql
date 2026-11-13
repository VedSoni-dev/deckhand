-- Attribution for the builds hub: which build each anonymous user came from, and which AI mode answered.
-- Run once in the hub's Supabase project (SQL editor or `supabase db push`). Only the hub server (service role) reads or writes.
create table if not exists hub_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  build text not null check (build ~ '^[a-z][a-z0-9-]{1,30}$'),
  event text not null check (event in ('app_opened', 'active_session', 'ai_call')),
  mode text check (mode in ('local', 'chatgpt', 'claude', 'publik')),
  install uuid not null,
  publik boolean not null default false,
  app_version text check (char_length(app_version) <= 64)
);
create index if not exists hub_events_build_at on hub_events (build, at desc);
create index if not exists hub_events_at on hub_events (at desc);
alter table hub_events enable row level security; -- no policies: the anon key can't touch it

create or replace function hub_stats(since timestamptz)
returns table (build text, users bigint, publik_users bigint, opens bigint, ai_calls bigint,
               ai_local bigint, ai_chatgpt bigint, ai_claude bigint, ai_publik bigint, last_seen timestamptz)
language sql stable security definer set search_path = public as $$
  select build,
         count(distinct install),
         count(distinct install) filter (where publik),
         count(*) filter (where event = 'app_opened'),
         count(*) filter (where event = 'ai_call'),
         count(*) filter (where event = 'ai_call' and mode = 'local'),
         count(*) filter (where event = 'ai_call' and mode = 'chatgpt'),
         count(*) filter (where event = 'ai_call' and mode = 'claude'),
         count(*) filter (where event = 'ai_call' and mode = 'publik'),
         max(at)
  from hub_events where at >= since
  group by build order by 2 desc;
$$;
revoke all on function hub_stats(timestamptz) from public, anon, authenticated;

-- Phase 5: Reliability & scale foundation

alter table public.research_reports
  add column if not exists retry_count integer not null default 0,
  add column if not exists max_retries integer not null default 2,
  add column if not exists next_retry_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists finished_at timestamptz,
  add column if not exists latency_ms integer,
  add column if not exists from_cache boolean not null default false,
  add column if not exists cache_key text,
  add column if not exists job_payload jsonb,
  add column if not exists last_error text;

alter table public.research_reports
  drop constraint if exists research_reports_status_check;
alter table public.research_reports
  add constraint research_reports_status_check
  check (status in ('queued', 'in_progress', 'retrying', 'completed', 'failed'));

create index if not exists research_reports_status_retry_idx
  on public.research_reports (status, next_retry_at, created_at);

create index if not exists research_reports_cache_idx
  on public.research_reports (user_id, cache_key, created_at desc);

create table if not exists public.research_query_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cache_key text not null,
  mode text not null,
  template text not null,
  output_style text not null,
  depth text not null,
  model_name text not null,
  report_payload jsonb not null,
  source_report_id uuid references public.research_reports(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint research_query_cache_mode_check
    check (mode in ('topic', 'claim')),
  constraint research_query_cache_template_check
    check (template in ('literature_review', 'technical_report', 'claim_verification')),
  constraint research_query_cache_output_style_check
    check (output_style in ('balanced', 'concise', 'detailed')),
  constraint research_query_cache_depth_check
    check (depth in ('standard', 'deep'))
);

create unique index if not exists research_query_cache_unique_scope
  on public.research_query_cache (user_id, cache_key, mode, template, output_style, depth, model_name);

create index if not exists research_query_cache_expiry_idx
  on public.research_query_cache (expires_at);

alter table public.research_query_cache enable row level security;

drop policy if exists "Users can read own research cache" on public.research_query_cache;
create policy "Users can read own research cache"
on public.research_query_cache for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own research cache" on public.research_query_cache;
create policy "Users can insert own research cache"
on public.research_query_cache for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own research cache" on public.research_query_cache;
create policy "Users can update own research cache"
on public.research_query_cache for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

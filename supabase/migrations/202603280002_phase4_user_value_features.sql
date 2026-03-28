-- Phase 4 foundations: templates, preferences, usage metrics

create table if not exists public.research_user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  preferred_template text not null default 'literature_review',
  output_style text not null default 'balanced',
  depth text not null default 'standard',
  model_name text not null default 'gemini-default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint research_user_preferences_template_check
    check (preferred_template in ('literature_review', 'technical_report', 'claim_verification')),
  constraint research_user_preferences_output_style_check
    check (output_style in ('balanced', 'concise', 'detailed')),
  constraint research_user_preferences_depth_check
    check (depth in ('standard', 'deep'))
);

alter table public.research_user_preferences enable row level security;

drop policy if exists "Users can read own research preferences" on public.research_user_preferences;
create policy "Users can read own research preferences"
on public.research_user_preferences for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own research preferences" on public.research_user_preferences;
create policy "Users can insert own research preferences"
on public.research_user_preferences for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own research preferences" on public.research_user_preferences;
create policy "Users can update own research preferences"
on public.research_user_preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.research_reports
  add column if not exists research_mode text,
  add column if not exists template text,
  add column if not exists output_style text,
  add column if not exists depth text,
  add column if not exists model_name text,
  add column if not exists prompt_tokens integer not null default 0,
  add column if not exists completion_tokens integer not null default 0,
  add column if not exists estimated_cost_usd numeric(12,6) not null default 0;

alter table public.research_reports
  drop constraint if exists research_reports_mode_check;
alter table public.research_reports
  add constraint research_reports_mode_check
  check (research_mode is null or research_mode in ('topic', 'claim'));

alter table public.research_reports
  drop constraint if exists research_reports_template_check;
alter table public.research_reports
  add constraint research_reports_template_check
  check (template is null or template in ('literature_review', 'technical_report', 'claim_verification'));

alter table public.research_reports
  drop constraint if exists research_reports_output_style_check;
alter table public.research_reports
  add constraint research_reports_output_style_check
  check (output_style is null or output_style in ('balanced', 'concise', 'detailed'));

alter table public.research_reports
  drop constraint if exists research_reports_depth_check;
alter table public.research_reports
  add constraint research_reports_depth_check
  check (depth is null or depth in ('standard', 'deep'));

create index if not exists research_reports_user_status_created_idx
  on public.research_reports (user_id, status, created_at desc);

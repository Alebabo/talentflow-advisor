create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  business_unit text,
  description text,
  team_values jsonb not null default '[]'::jsonb,
  interview_style text,
  focus_areas jsonb not null default '[]'::jsonb,
  members integer check (members is null or members >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

create table if not exists public.question_generation_system_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  name text not null,
  prompt_key text not null,
  description text,
  target_scope text not null default 'general' check (target_scope in ('general', 'team', 'job', 'candidate')),
  system_prompt text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, prompt_key)
);

create index if not exists teams_user_id_idx on public.teams (user_id);
create index if not exists question_generation_system_prompts_user_id_idx
  on public.question_generation_system_prompts (user_id);
create index if not exists question_generation_system_prompts_team_id_idx
  on public.question_generation_system_prompts (team_id);

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
before update on public.teams
for each row
execute function public.set_updated_at();

drop trigger if exists question_generation_system_prompts_set_updated_at on public.question_generation_system_prompts;
create trigger question_generation_system_prompts_set_updated_at
before update on public.question_generation_system_prompts
for each row
execute function public.set_updated_at();

alter table public.teams enable row level security;
alter table public.question_generation_system_prompts enable row level security;

drop policy if exists "Users can manage their teams" on public.teams;
create policy "Users can manage their teams"
on public.teams
for all
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can manage their question generation system prompts" on public.question_generation_system_prompts;
create policy "Users can manage their question generation system prompts"
on public.question_generation_system_prompts
for all
to authenticated
using (
  (
    auth.uid() = user_id
    or public.has_role(auth.uid(), 'admin')
  )
  and (
    team_id is null
    or exists (
      select 1
      from public.teams t
      where t.id = question_generation_system_prompts.team_id
        and (t.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    )
  )
)
with check (
  (
    auth.uid() = user_id
    or public.has_role(auth.uid(), 'admin')
  )
  and (
    team_id is null
    or exists (
      select 1
      from public.teams t
      where t.id = question_generation_system_prompts.team_id
        and (t.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    )
  )
);

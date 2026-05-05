create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('cv', 'job_description')),
  filename text not null,
  storage_path text not null unique,
  mime_type text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'extracted', 'failed')),
  error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cv_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.documents (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  summary text,
  years_experience integer,
  skills jsonb not null default '[]'::jsonb,
  languages jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  experience jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.job_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.documents (id) on delete cascade,
  title text,
  company text,
  location text,
  employment_type text,
  seniority text,
  summary text,
  responsibilities jsonb not null default '[]'::jsonb,
  required_skills jsonb not null default '[]'::jsonb,
  nice_to_have jsonb not null default '[]'::jsonb,
  tech_stack jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  salary_range text,
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

alter table public.user_roles enable row level security;
alter table public.documents enable row level security;
alter table public.cv_extractions enable row level security;
alter table public.job_extractions enable row level security;

drop policy if exists "Admins can manage user roles" on public.user_roles;
create policy "Admins can manage user roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Users can view own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can manage their documents" on public.documents;
create policy "Users can manage their documents"
on public.documents
for all
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can view own cv extractions" on public.cv_extractions;
create policy "Users can view own cv extractions"
on public.cv_extractions
for select
to authenticated
using (
  exists (
    select 1
    from public.documents d
    where d.id = cv_extractions.document_id
      and (d.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  )
);

drop policy if exists "Users can manage own cv extractions" on public.cv_extractions;
create policy "Users can manage own cv extractions"
on public.cv_extractions
for all
to authenticated
using (
  exists (
    select 1
    from public.documents d
    where d.id = cv_extractions.document_id
      and (d.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  )
)
with check (
  exists (
    select 1
    from public.documents d
    where d.id = cv_extractions.document_id
      and (d.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  )
);

drop policy if exists "Users can view own job extractions" on public.job_extractions;
create policy "Users can view own job extractions"
on public.job_extractions
for select
to authenticated
using (
  exists (
    select 1
    from public.documents d
    where d.id = job_extractions.document_id
      and (d.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  )
);

drop policy if exists "Users can manage own job extractions" on public.job_extractions;
create policy "Users can manage own job extractions"
on public.job_extractions
for all
to authenticated
using (
  exists (
    select 1
    from public.documents d
    where d.id = job_extractions.document_id
      and (d.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  )
)
with check (
  exists (
    select 1
    from public.documents d
    where d.id = job_extractions.document_id
      and (d.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own documents bucket objects" on storage.objects;
create policy "Users can read own documents bucket objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (
    public.has_role(auth.uid(), 'admin')
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "Users can upload own documents bucket objects" on storage.objects;
create policy "Users can upload own documents bucket objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (
    public.has_role(auth.uid(), 'admin')
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "Users can update own documents bucket objects" on storage.objects;
create policy "Users can update own documents bucket objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and (
    public.has_role(auth.uid(), 'admin')
    or (storage.foldername(name))[1] = auth.uid()::text
  )
)
with check (
  bucket_id = 'documents'
  and (
    public.has_role(auth.uid(), 'admin')
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "Users can delete own documents bucket objects" on storage.objects;
create policy "Users can delete own documents bucket objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (
    public.has_role(auth.uid(), 'admin')
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

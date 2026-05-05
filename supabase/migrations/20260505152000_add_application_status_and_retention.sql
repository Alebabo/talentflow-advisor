alter table public.documents
add column if not exists application_status text not null default 'new'
check (
  application_status in (
    'new',
    'screening',
    'interview',
    'offer',
    'hired',
    'rejected',
    'withdrawn'
  )
);

alter table public.documents
add column if not exists application_status_updated_at timestamptz not null default timezone('utc', now());

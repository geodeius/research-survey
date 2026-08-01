create table if not exists public.researchers (
  email text primary key check (email = lower(email)),
  role text not null default 'researcher' check (role in ('researcher', 'supervisor')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.participants (
  id text primary key check (id ~ '^DOL-([A-Z0-9]{6}|[A-Z][0-9]{3,})$'),
  hospital text not null check (hospital in ('Pentecost Hospital', 'Madina Polyclinic')),
  status text not null,
  researcher_email text not null references public.researchers(email),
  answers jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  participant_id text not null references public.participants(id),
  researcher_email text not null,
  action text not null,
  occurred_at timestamptz not null default now()
);

alter table public.researchers enable row level security;
alter table public.participants enable row level security;
alter table public.audit_log enable row level security;

create sequence if not exists public.pentecost_research_id_sequence start with 1;
create sequence if not exists public.madina_research_id_sequence start with 1;

create or replace function public.next_research_id(hospital_code text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  participant_number bigint;
begin
  if hospital_code = 'P' then
    participant_number := nextval('public.pentecost_research_id_sequence');
  elsif hospital_code = 'M' then
    participant_number := nextval('public.madina_research_id_sequence');
  else
    raise exception 'Unsupported hospital code';
  end if;

  return 'DOL-' || hospital_code || lpad(participant_number::text, 3, '0');
end;
$$;

revoke all on function public.next_research_id(text) from public, anon, authenticated;
grant execute on function public.next_research_id(text) to service_role;

-- Add the two approved emails after creating their Supabase Auth users:
-- insert into public.researchers (email) values ('researcher1@example.com'), ('researcher2@example.com');

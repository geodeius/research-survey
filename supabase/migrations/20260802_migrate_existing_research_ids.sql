begin;

create table if not exists public.research_id_migrations (
  old_id text primary key,
  new_id text not null unique,
  researcher_email text not null,
  migrated_at timestamptz not null default now()
);

alter table public.research_id_migrations enable row level security;

alter table public.audit_log drop constraint if exists audit_log_participant_id_fkey;
alter table public.audit_log
  add constraint audit_log_participant_id_fkey
  foreign key (participant_id)
  references public.participants(id)
  on update cascade;

with current_maximums as (
  select
    hospital,
    coalesce(max(substring(id from '[0-9]+$')::bigint), 0) as last_number
  from public.participants
  where id ~ '^DOL-[PM][0-9]{3,}$'
  group by hospital
),
legacy_records as (
  select
    id as old_id,
    hospital,
    researcher_email,
    row_number() over (partition by hospital order by created_at, id) as roll_number
  from public.participants
  where id ~ '^DOL-[A-Z0-9]{6}$'
),
numbered_records as (
  select
    legacy.old_id,
    legacy.researcher_email,
    'DOL-' ||
      case legacy.hospital
        when 'Pentecost Hospital' then 'P'
        when 'Madina Polyclinic' then 'M'
      end ||
      lpad((coalesce(maximums.last_number, 0) + legacy.roll_number)::text, 3, '0') as new_id
  from legacy_records legacy
  left join current_maximums maximums on maximums.hospital = legacy.hospital
)
insert into public.research_id_migrations (old_id, new_id, researcher_email)
select old_id, new_id, researcher_email
from numbered_records
on conflict (old_id) do nothing;

update public.participants participant
set id = migration.new_id
from public.research_id_migrations migration
where participant.id = migration.old_id;

do $$
declare
  pentecost_maximum bigint;
  madina_maximum bigint;
begin
  select coalesce(max(substring(id from '[0-9]+$')::bigint), 0)
  into pentecost_maximum
  from public.participants
  where id ~ '^DOL-P[0-9]{3,}$';

  select coalesce(max(substring(id from '[0-9]+$')::bigint), 0)
  into madina_maximum
  from public.participants
  where id ~ '^DOL-M[0-9]{3,}$';

  if pentecost_maximum = 0 then
    perform setval('public.pentecost_research_id_sequence', 1, false);
  else
    perform setval('public.pentecost_research_id_sequence', pentecost_maximum, true);
  end if;

  if madina_maximum = 0 then
    perform setval('public.madina_research_id_sequence', 1, false);
  else
    perform setval('public.madina_research_id_sequence', madina_maximum, true);
  end if;
end;
$$;

commit;

select old_id, new_id
from public.research_id_migrations
order by new_id;

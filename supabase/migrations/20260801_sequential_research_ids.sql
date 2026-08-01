alter table public.participants drop constraint if exists participants_id_check;
alter table public.participants
  add constraint participants_id_check
  check (id ~ '^DOL-([A-Z0-9]{6}|[A-Z][0-9]{3,})$');

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

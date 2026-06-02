-- Adds 30-day soft delete support and renames the pipeline statuses.
alter table public.leads add column if not exists deleted_at timestamptz;

-- Existing projects that already created the original enum need to migrate values first.
alter table public.leads alter column status drop default;
alter table public.leads alter column status type text using status::text;
update public.leads set status = 'Quoted' where status = 'Qualified';
update public.leads set status = 'Won' where status = 'Converted';

drop type if exists public.lead_status;
create type public.lead_status as enum ('New', 'Contacted', 'Quoted', 'Won', 'Lost');

alter table public.leads
  alter column status type public.lead_status using status::public.lead_status,
  alter column status set default 'New';

create index if not exists leads_business_deleted_idx on public.leads (business_id, deleted_at desc);

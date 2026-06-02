alter table public.businesses
  add column if not exists follow_up_reminders_enabled boolean not null default true;

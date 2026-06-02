alter table public.businesses
  add column if not exists onboarding_website_link_copied boolean not null default false,
  add column if not exists onboarding_automation_reviewed boolean not null default false;

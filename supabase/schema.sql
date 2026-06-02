create extension if not exists "pgcrypto";

create type public.lead_status as enum ('New', 'Contacted', 'Quoted', 'Won', 'Lost');
create type public.plan_code as enum ('starter', 'pro', 'agency');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_name text not null,
  industry text not null,
  service_area text not null,
  phone text not null,
  email text not null,
  description text not null,
  services_offered text[] not null default '{}',
  hours_of_operation text not null,
  reminder_24h_template text not null default 'Hi {{lead_name}}, this is {{business_name}} checking in on your request: {{service_requested}}. We would be happy to help and will reach out shortly.',
  reminder_72h_template text not null default 'Hi {{lead_name}}, {{business_name}} wanted to follow up one more time about: {{service_requested}}. Reply here or call us when convenient.',
  follow_up_reminders_enabled boolean not null default true,
  ai_tone text not null default 'Professional',
  capture_form_headline text not null default 'Request a Quote',
  capture_form_button_text text not null default 'Send Request',
  capture_form_success_message text not null default 'Thanks! We received your request and will follow up shortly.',
  capture_form_primary_color text not null default '#16a34a',
  capture_form_services text[] not null default '{}',
  onboarding_website_link_copied boolean not null default false,
  onboarding_automation_reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status public.lead_status not null default 'New',
  ai_response text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  plan public.plan_code not null default 'starter',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  recipient text not null,
  subject text not null,
  status text not null,
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.automation_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_updated_at before update on public.businesses
  for each row execute procedure public.touch_updated_at();

create trigger leads_updated_at before update on public.leads
  for each row execute procedure public.touch_updated_at();

alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.leads enable row level security;
alter table public.subscriptions enable row level security;
alter table public.email_logs enable row level security;
alter table public.automation_events enable row level security;

create policy "Users can read own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users manage own business" on public.businesses
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own leads" on public.leads
  for all using (
    exists (select 1 from public.businesses b where b.id = business_id and b.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.user_id = auth.uid())
  );

create policy "Users read own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "Users read own email logs" on public.email_logs
  for select using (
    exists (select 1 from public.businesses b where b.id = business_id and b.user_id = auth.uid())
  );

create policy "Users read own automation events" on public.automation_events
  for select using (
    exists (select 1 from public.businesses b where b.id = business_id and b.user_id = auth.uid())
  );

create index leads_business_created_idx on public.leads (business_id, created_at desc);
create index leads_business_status_idx on public.leads (business_id, status);
create index leads_business_deleted_idx on public.leads (business_id, deleted_at desc);
create index automation_events_lead_type_idx on public.automation_events (lead_id, event_type);

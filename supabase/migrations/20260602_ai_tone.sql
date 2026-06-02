alter table public.businesses
  add column if not exists ai_tone text not null default 'Professional';

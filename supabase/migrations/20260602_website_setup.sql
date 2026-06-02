alter table public.businesses
  add column if not exists capture_form_headline text not null default 'Request a Quote',
  add column if not exists capture_form_button_text text not null default 'Send Request',
  add column if not exists capture_form_success_message text not null default 'Thanks! We received your request and will follow up shortly.',
  add column if not exists capture_form_primary_color text not null default '#16a34a',
  add column if not exists capture_form_services text[] not null default '{}';

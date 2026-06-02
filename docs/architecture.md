# LeadRescue Architecture

## App structure

- `app/page.tsx`: marketing landing page
- `app/(auth)/*`: sign up, login, and password reset screens
- `app/(dashboard)/*`: protected SaaS screens
- `app/capture/[businessId]`: hosted public lead form
- `app/api/public/leads`: public lead intake and automation trigger
- `app/api/automation/reminders`: cron-triggered reminder workflow
- `app/api/billing/*`: Stripe checkout and webhook handling
- `lib/*`: typed utilities for Supabase, OpenAI, Stripe, email, validation, and plans

## Data flow

1. A lead submits a public form.
2. `/api/public/leads` validates the payload and checks the active plan limit.
3. The lead is stored in Supabase.
4. OpenAI generates the first response using the business profile.
5. Resend sends the customer response and owner notification.
6. `email_logs` and `automation_events` record each action.
7. A scheduled cron later sends reminders if the lead still has status `New`.

## Production hardening checklist

- Add domain authentication in Resend.
- Add Stripe customer portal for plan changes and cancellation.
- Add rate limiting on public lead intake.
- Add webhook retry monitoring.
- Add background job infrastructure if lead volume grows beyond route-handler execution windows.

# LeadRescue

Lead capture and follow-up for local service businesses. A business adds a form to its website; LeadRescue stores each lead, drafts a reply with the OpenAI API, emails the customer and the owner, and reminds the owner to follow up.

**Status:** in development. It is not deployed for customers.

**Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Supabase (Auth, Postgres, row-level security), OpenAI API, Resend, Vercel.

## What is included

- Next.js app router with TypeScript and Tailwind CSS
- Supabase auth, protected routes, RLS-ready schema, and database tables
- Business profile setup
- Lead CRUD, search, status filters, CSV export, and delete
- Public lead capture form at `/capture/[businessId]`
- OpenAI-generated lead responses
- Resend email delivery for customer replies and owner notifications
- 24-hour and 72-hour reminder workflow endpoint
- Stripe subscription checkout and webhook routes (written, not yet connected to a live Stripe account)
- Starter, Pro, and Agency plan definitions with intake limits

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.

4. Fill in `.env.local` with Supabase, OpenAI, Resend, Stripe, and cron values.

5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Deployment

1. Push this repository to GitHub.
2. Create a Vercel project and import the repo.
3. Add all variables from `.env.example` to Vercel.
4. In Supabase, add your Vercel URL to the auth redirect URLs.
5. In Stripe, create three recurring prices and set:
   - `STRIPE_STARTER_PRICE_ID`
   - `STRIPE_PRO_PRICE_ID`
   - `STRIPE_AGENCY_PRICE_ID`
6. Add a Stripe webhook pointing to `/api/billing/webhook`.
7. Configure the included Vercel cron in `vercel.json`, or call `POST /api/automation/reminders` with `Authorization: Bearer $CRON_SECRET` from your own scheduler.

## Website form integration

After creating a business profile, visit `/capture/[businessId]` to test the hosted public form. Existing websites can submit JSON to `/api/public/leads`:

```json
{
  "business_id": "business uuid",
  "name": "Jane Customer",
  "email": "jane@example.com",
  "phone": "555-123-4567",
  "message": "Need a water heater estimate."
}
```

## Important notes

- `SUPABASE_SERVICE_ROLE_KEY` is used only in server route handlers for public lead intake, cron, and webhook operations.
- If `OPENAI_API_KEY` or `RESEND_API_KEY` is missing, the app uses safe development fallbacks for generated copy and logs skipped emails.
- Run `npm run typecheck` and `npm run build` before production deployment.

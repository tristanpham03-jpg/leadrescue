import { subHours } from "date-fns";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmailConfigurationError, EmailDeliveryError, leadResponseHtml, sendEmail } from "@/lib/email";
import { formatWaitingDuration } from "@/lib/time";
import type { Business, Lead } from "@/lib/types";

type ReminderLead = Lead & { businesses: Business };

function renderTemplate(template: string, business: Business, lead: Lead) {
  return template
    .replaceAll("{{lead_name}}", lead.name)
    .replaceAll("{{business_name}}", business.business_name)
    .replaceAll("{{service_requested}}", lead.message);
}

async function sendOwnerReminder({ lead, eventType, subject, body }: { lead: ReminderLead; eventType: string; subject: string; body: string }) {
  const supabase = createAdminClient();
  const business = lead.businesses;

  try {
    const result = await sendEmail({ to: business.email, subject, html: leadResponseHtml(body) });
    await supabase.from("email_logs").insert({
      business_id: business.id,
      lead_id: lead.id,
      recipient: business.email,
      subject,
      status: "sent",
      provider_message_id: "data" in result && result.data && "id" in result.data ? String(result.data.id) : null
    });
    await supabase.from("automation_events").insert({ business_id: business.id, lead_id: lead.id, event_type: eventType, metadata: { body } });
    return true;
  } catch (error) {
    const message = error instanceof EmailConfigurationError || error instanceof EmailDeliveryError || error instanceof Error
      ? error.message
      : "Unable to send reminder.";
    await supabase.from("email_logs").insert({
      business_id: business.id,
      lead_id: lead.id,
      recipient: business.email,
      subject,
      status: "failed",
      error_message: message
    });
    await supabase.from("automation_events").insert({ business_id: business.id, lead_id: lead.id, event_type: `${eventType}_failed`, metadata: { error: message } });
    return false;
  }
}

async function runReminders() {
  const supabase = createAdminClient();
  const now = new Date();
  const { data: leads } = await supabase
    .from("leads")
    .select("*, businesses(*)")
    .in("status", ["New", "Contacted"])
    .is("deleted_at", null)
    .returns<ReminderLead[]>();

  let sent = 0;
  for (const lead of leads ?? []) {
    const business = lead.businesses;
    if (!business.follow_up_reminders_enabled) continue;

    const eventType = lead.status === "New" ? "new_lead_24h_owner_reminder_sent" : "contacted_lead_72h_owner_reminder_sent";
    const existing = await supabase.from("automation_events").select("id").eq("lead_id", lead.id).eq("event_type", eventType).maybeSingle();
    if (existing.data) continue;

    const referenceDate = lead.status === "New" ? lead.created_at : lead.updated_at;
    const isDue = lead.status === "New" ? new Date(referenceDate) <= subHours(now, 24) : new Date(referenceDate) <= subHours(now, 72);
    if (!isDue) continue;

    const template = lead.status === "New" ? business.reminder_24h_template : business.reminder_72h_template;
    const waiting = formatWaitingDuration(referenceDate);
    const body = renderTemplate(template, business, lead) + "\n\n" + waiting + " without follow-up.";
    const subject = lead.status === "New"
      ? `Uncontacted lead reminder: ${lead.name}`
      : `Follow-up reminder: ${lead.name}`;

    const didSend = await sendOwnerReminder({ lead, eventType, subject, body });
    if (didSend) sent += 1;
  }

  return NextResponse.json({ sent });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bearer = request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  const querySecret = url.searchParams.get("secret") === process.env.CRON_SECRET;
  if (!bearer && !querySecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runReminders();
}

export async function POST(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runReminders();
}

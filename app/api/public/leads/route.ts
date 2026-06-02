import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadSchema } from "@/lib/validation";
import { EmailConfigurationError, EmailDeliveryError, ownerNotificationHtml, sendEmail } from "@/lib/email";
import { isWithinPlanLimit } from "@/lib/plans";
import type { Business, Lead } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success || !body.business_id) {
    return NextResponse.json({ error: parsed.error?.issues[0]?.message ?? "Missing business_id" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: businessData, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", body.business_id)
    .maybeSingle();
  const business = businessData as Business | null;
  if (businessError || !business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("business_id", business.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .is("deleted_at", null)
    .gte("created_at", monthStart);
  if (!isWithinPlanLimit((subscription?.plan as "starter" | "pro" | "agency" | undefined) ?? "starter", count ?? 0)) {
    return NextResponse.json({ error: "Monthly lead limit reached" }, { status: 402 });
  }

  const service = typeof body.service === "string" && body.service.trim() ? body.service.trim() : null;
  if (service && !(business.capture_form_services ?? []).some((item) => item.toLowerCase() === service.toLowerCase())) {
    return NextResponse.json({ error: "Choose a valid service from the form." }, { status: 400 });
  }
  const message = service ? `Service requested: ${service}\n\n${parsed.data.message}` : parsed.data.message;

  const { data: leadData, error } = await supabase
    .from("leads")
    .insert({ ...parsed.data, message, business_id: business.id, status: "New" })
    .select()
    .single();
  const lead = leadData as Lead | null;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!lead) return NextResponse.json({ error: "Lead was not created" }, { status: 500 });

  const ownerSubject = `New website lead: ${lead.name}`;
  try {
    const result = await sendEmail({ to: business.email, subject: ownerSubject, html: ownerNotificationHtml(business, lead) });
    await supabase.from("email_logs").insert({
      business_id: business.id,
      lead_id: lead.id,
      recipient: business.email,
      subject: ownerSubject,
      status: "sent",
      provider_message_id: "data" in result && result.data && "id" in result.data ? String(result.data.id) : null
    });
  } catch (error) {
    const message = error instanceof EmailConfigurationError || error instanceof EmailDeliveryError || error instanceof Error
      ? error.message
      : "Unable to notify business owner.";
    await supabase.from("email_logs").insert({
      business_id: business.id,
      lead_id: lead.id,
      recipient: business.email,
      subject: ownerSubject,
      status: "failed",
      error_message: message
    });
  }

  await supabase.from("automation_events").insert({ business_id: business.id, lead_id: lead.id, event_type: "lead_created", metadata: {} });

  return NextResponse.json({ lead_id: lead.id });
}

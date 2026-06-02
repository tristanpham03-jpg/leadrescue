import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessForUser } from "@/lib/data";
import { EmailConfigurationError, EmailDeliveryError, leadResponseHtml, sendEmail } from "@/lib/email";
import type { Lead } from "@/lib/types";

const sendReplySchema = z.object({
  reply: z.string().min(10, "Reply is too short to send.")
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessForUser(user.id);
  if (!business) return NextResponse.json({ error: "Business profile required before sending replies." }, { status: 400 });

  const parsed = sendReplySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { id } = await context.params;
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .is("deleted_at", null)
    .maybeSingle();
  const lead = data as Lead | null;
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const subject = `Thanks for contacting ${business.business_name}`;
  let providerMessageId: string | null = null;

  try {
    const result = await sendEmail({ to: lead.email, subject, html: leadResponseHtml(parsed.data.reply) });
    providerMessageId = "data" in result && result.data && "id" in result.data ? String(result.data.id) : null;
  } catch (error) {
    const message = error instanceof EmailConfigurationError || error instanceof EmailDeliveryError || error instanceof Error
      ? error.message
      : "Unable to send AI reply.";
    await supabase.from("email_logs").insert({
      business_id: business.id,
      lead_id: lead.id,
      recipient: lead.email,
      subject,
      status: "failed",
      error_message: message
    });
    return NextResponse.json({ error: message }, { status: error instanceof EmailConfigurationError ? 503 : 500 });
  }

  await supabase.from("leads").update({ ai_response: parsed.data.reply, status: "Contacted" }).eq("id", lead.id).eq("business_id", business.id);
  await supabase.from("email_logs").insert({
    business_id: business.id,
    lead_id: lead.id,
    recipient: lead.email,
    subject,
    status: "sent",
    provider_message_id: providerMessageId
  });
  await supabase.from("automation_events").insert({
    business_id: business.id,
    lead_id: lead.id,
    event_type: "ai_reply_sent",
    metadata: { reply: parsed.data.reply }
  });

  return NextResponse.json({ ok: true });
}

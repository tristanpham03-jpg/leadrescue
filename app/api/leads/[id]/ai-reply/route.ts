import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessForUser } from "@/lib/data";
import { generateLeadResponse, OpenAIConfigurationError } from "@/lib/openai";
import type { Lead } from "@/lib/types";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessForUser(user.id);
  if (!business) return NextResponse.json({ error: "Business profile required before generating AI replies." }, { status: 400 });

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

  try {
    const reply = await generateLeadResponse(business, lead);
    await supabase.from("leads").update({ ai_response: reply }).eq("id", lead.id).eq("business_id", business.id);
    await supabase.from("automation_events").insert({
      business_id: business.id,
      lead_id: lead.id,
      event_type: "ai_reply_generated",
      metadata: { reply }
    });

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof OpenAIConfigurationError ? error.message : error instanceof Error ? error.message : "Unable to generate AI reply.";
    return NextResponse.json({ error: message }, { status: error instanceof OpenAIConfigurationError ? 503 : 500 });
  }
}

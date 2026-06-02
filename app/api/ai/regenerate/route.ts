import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessForUser } from "@/lib/data";
import { generateLeadResponse, OpenAIConfigurationError } from "@/lib/openai";
import type { Lead } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const business = await getBusinessForUser(user.id);
  if (!business) return NextResponse.json({ error: "Business profile required" }, { status: 400 });

  const url = new URL(request.url);
  const leadId = url.searchParams.get("lead_id");
  if (!leadId) return NextResponse.json({ error: "Missing lead_id" }, { status: 400 });

  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("business_id", business.id)
    .is("deleted_at", null)
    .maybeSingle();
  const lead = data as Lead | null;
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  let aiResponse: string;
  try {
    aiResponse = await generateLeadResponse(business, lead);
  } catch (error) {
    const message = error instanceof OpenAIConfigurationError ? error.message : error instanceof Error ? error.message : "Unable to regenerate AI response.";
    return NextResponse.json({ error: message }, { status: error instanceof OpenAIConfigurationError ? 503 : 500 });
  }

  await supabase.from("leads").update({ ai_response: aiResponse }).eq("id", lead.id);
  await supabase.from("automation_events").insert({ business_id: business.id, lead_id: lead.id, event_type: "ai_regenerated", metadata: { aiResponse } });

  return NextResponse.redirect(new URL(`/leads/${lead.id}`, request.url));
}

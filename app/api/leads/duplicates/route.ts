import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessForUser } from "@/lib/data";
import type { Lead } from "@/lib/types";

function digitsOnly(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessForUser(user.id);
  if (!business) return NextResponse.json({ error: "Business profile required" }, { status: 400 });

  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  const phoneDigits = digitsOnly(url.searchParams.get("phone"));

  if (!email && !phoneDigits) return NextResponse.json({ duplicate: null });

  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", business.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const duplicate = ((data ?? []) as Lead[]).find((lead) => {
    const emailMatches = Boolean(email && lead.email.toLowerCase() === email);
    const phoneMatches = Boolean(phoneDigits && digitsOnly(lead.phone) === phoneDigits);
    return emailMatches || phoneMatches;
  });

  return NextResponse.json({ duplicate: duplicate ?? null });
}

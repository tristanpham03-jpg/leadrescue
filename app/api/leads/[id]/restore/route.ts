import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessForUser } from "@/lib/data";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessForUser(user.id);
  if (!business) return NextResponse.json({ error: "Business profile required" }, { status: 400 });

  const { id } = await context.params;
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("leads")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("business_id", business.id)
    .not("deleted_at", "is", null)
    .gte("deleted_at", cutoff);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessForUser } from "@/lib/data";
import { leadUpdateSchema } from "@/lib/validation";

async function getOwnedBusiness() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { supabase, business: null };
  const business = await getBusinessForUser(user.id);
  return { supabase, business };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { supabase, business } = await getOwnedBusiness();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = leadUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { id } = await context.params;
  const { error } = await supabase
    .from("leads")
    .update(parsed.data)
    .eq("id", id)
    .eq("business_id", business.id)
    .is("deleted_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { supabase, business } = await getOwnedBusiness();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const { error } = await supabase
    .from("leads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", business.id)
    .is("deleted_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

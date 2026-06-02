import { NextResponse } from "next/server";
import { automationTemplateSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessForUser } from "@/lib/data";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessForUser(user.id);
  if (!business) return NextResponse.json({ error: "Business profile required" }, { status: 400 });

  const parsed = automationTemplateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { error } = await supabase.from("businesses").update({ ...parsed.data, onboarding_automation_reviewed: true }).eq("id", business.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

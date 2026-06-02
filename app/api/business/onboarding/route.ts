import { NextResponse } from "next/server";
import { z } from "zod";
import { getBusinessForUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  website_link_copied: z.boolean().optional(),
  automation_reviewed: z.boolean().optional()
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessForUser(user.id);
  if (!business) return NextResponse.json({ error: "Business profile required" }, { status: 400 });

  const parsed = onboardingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const updates: Record<string, boolean> = {};
  if (parsed.data.website_link_copied) updates.onboarding_website_link_copied = true;
  if (parsed.data.automation_reviewed) updates.onboarding_automation_reviewed = true;

  if (!Object.keys(updates).length) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("businesses").update(updates).eq("id", business.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

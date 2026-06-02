import { NextResponse } from "next/server";
import { getBusinessForUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { websiteSetupSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessForUser(user.id);
  if (!business) return NextResponse.json({ error: "Business profile required" }, { status: 400 });

  const parsed = websiteSetupSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const payload = {
    capture_form_headline: parsed.data.capture_form_headline,
    capture_form_button_text: parsed.data.capture_form_button_text,
    capture_form_success_message: parsed.data.capture_form_success_message,
    capture_form_primary_color: parsed.data.capture_form_primary_color,
    capture_form_services: parsed.data.capture_form_services
      .split(",")
      .map((service) => service.trim())
      .filter(Boolean)
  };

  const { error } = await supabase.from("businesses").update(payload).eq("id", business.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

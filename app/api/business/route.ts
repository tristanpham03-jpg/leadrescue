import { NextResponse } from "next/server";
import { businessSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = businessSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const payload = {
    ...parsed.data,
    services_offered: parsed.data.services_offered.split(",").map((service) => service.trim()).filter(Boolean),
    user_id: user.id
  };

  const { error } = await supabase.from("businesses").upsert(payload, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

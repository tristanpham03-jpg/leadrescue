import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { csvEscape } from "@/lib/utils";
import { getBusinessForUser, getLeadsForBusiness } from "@/lib/data";
import { leadUpdateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessForUser(user.id);
  if (!business) return NextResponse.json({ error: "Business profile required" }, { status: 400 });

  const url = new URL(request.url);
  const leads = await getLeadsForBusiness(business.id, url.searchParams.get("status") ?? undefined, url.searchParams.get("q") ?? undefined);

  if (url.searchParams.get("format") === "csv") {
    const rows = [
      ["Name", "Email", "Phone", "Status", "Message", "Created At"].map(csvEscape).join(","),
      ...leads.map((lead) =>
        [lead.name, lead.email, lead.phone, lead.status, lead.message, lead.created_at].map(csvEscape).join(",")
      )
    ].join("\n");
    return new Response(rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=leadrescue-leads.csv"
      }
    });
  }

  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessForUser(user.id);
  if (!business) return NextResponse.json({ error: "Business profile required" }, { status: 400 });

  const parsed = leadUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { data, error } = await supabase
    .from("leads")
    .insert({ ...parsed.data, business_id: business.id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ lead: data });
}

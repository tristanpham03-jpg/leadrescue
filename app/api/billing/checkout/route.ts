import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/utils";
import { plans } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getBusinessForUser } from "@/lib/data";
import type { PlanCode } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessForUser(user.id);
  if (!business) return NextResponse.json({ error: "Business profile required" }, { status: 400 });

  const { plan } = (await request.json()) as { plan: PlanCode };
  if (!plans[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const priceId = process.env[plans[plan].stripePriceEnv];
  if (!priceId) return NextResponse.json({ error: `Missing ${plans[plan].stripePriceEnv}` }, { status: 500 });

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: absoluteUrl("/settings/billing?success=true"),
    cancel_url: absoluteUrl("/settings/billing?canceled=true"),
    metadata: {
      user_id: user.id,
      business_id: business.id,
      plan
    }
  });

  return NextResponse.json({ url: session.url });
}

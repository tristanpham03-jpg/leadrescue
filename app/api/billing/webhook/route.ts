import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import type { PlanCode } from "@/lib/types";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return NextResponse.json({ error: "Missing webhook configuration" }, { status: 400 });

  const rawBody = await request.text();
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await supabase.from("subscriptions").upsert(
      {
        user_id: session.metadata?.user_id,
        business_id: session.metadata?.business_id,
        plan: session.metadata?.plan as PlanCode,
        stripe_customer_id: String(session.customer),
        stripe_subscription_id: String(session.subscription),
        status: "active"
      },
      { onConflict: "stripe_subscription_id" }
    );
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await supabase
      .from("subscriptions")
      .update({
        status: subscription.status,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null
      })
      .eq("stripe_subscription_id", subscription.id);
  }

  return NextResponse.json({ received: true });
}

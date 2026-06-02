import type { PlanCode } from "@/lib/types";

export const plans: Record<
  PlanCode,
  { name: string; price: number; leadsPerMonth: number | "Unlimited"; stripePriceEnv: string; features: string[] }
> = {
  starter: {
    name: "Starter",
    price: 49,
    leadsPerMonth: 100,
    stripePriceEnv: "STRIPE_STARTER_PRICE_ID",
    features: ["100 leads/month", "AI instant replies", "Owner notifications", "CSV export"]
  },
  pro: {
    name: "Pro",
    price: 99,
    leadsPerMonth: 500,
    stripePriceEnv: "STRIPE_PRO_PRICE_ID",
    features: ["500 leads/month", "Custom follow-up templates", "Priority automations", "Conversion dashboard"]
  },
  agency: {
    name: "Agency",
    price: 199,
    leadsPerMonth: "Unlimited",
    stripePriceEnv: "STRIPE_AGENCY_PRICE_ID",
    features: ["Unlimited leads", "Multi-location friendly", "Advanced exports", "Best for agencies"]
  }
};

export function isWithinPlanLimit(plan: PlanCode, monthlyLeadCount: number) {
  const limit = plans[plan].leadsPerMonth;
  return limit === "Unlimited" || monthlyLeadCount < limit;
}

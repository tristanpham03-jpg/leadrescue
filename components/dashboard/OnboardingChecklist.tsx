import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import type { Business, Lead } from "@/lib/types";

type ChecklistItem = {
  label: string;
  description: string;
  complete: boolean;
  href: string;
  action: string;
};

export function OnboardingChecklist({ business, leads }: { business: Business; leads: Lead[] }) {
  const items: ChecklistItem[] = [
    {
      label: "Complete business profile",
      description: "Make sure LeadRescue knows your business name, services, area, and contact details.",
      complete: Boolean(business.business_name && business.email && business.services_offered.length),
      href: "/business",
      action: "Review profile"
    },
    {
      label: "Submit a test lead",
      description: "Use your public form once so you can see how new customers appear in Leads.",
      complete: leads.length > 0,
      href: `/capture/${business.id}`,
      action: "Open test form"
    },
    {
      label: "Generate an AI reply",
      description: "Create a draft response for any lead to test your AI follow-up workflow.",
      complete: leads.some((lead) => Boolean(lead.ai_response)),
      href: leads[0] ? `/leads/${leads[0].id}` : "/leads",
      action: "Go to leads"
    },
    {
      label: "Copy website form link",
      description: "Copy the hosted LeadRescue link for your website button or designer.",
      complete: business.onboarding_website_link_copied,
      href: "/settings/website",
      action: "Website setup"
    },
    {
      label: "Review automation settings",
      description: "Confirm follow-up reminders and AI tone match how your business communicates.",
      complete: business.onboarding_automation_reviewed,
      href: "/settings/automation",
      action: "Review automation"
    }
  ];

  const completedCount = items.filter((item) => item.complete).length;
  if (completedCount === items.length) return null;

  return (
    <section className="rounded-lg border border-rescue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-rescue-700">Getting Started</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Set up LeadRescue</h2>
          <p className="mt-1 text-sm text-slate-500">Finish these quick steps to make sure leads flow in and follow-ups are ready.</p>
        </div>
        <span className="rounded-full bg-rescue-50 px-3 py-1 text-sm font-bold text-rescue-700">
          {completedCount}/{items.length} complete
        </span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className="rounded-md border border-slate-200 p-4 transition hover:border-rescue-200 hover:bg-rescue-50/50">
            <div className="flex items-start gap-3">
              {item.complete ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-rescue-600" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />}
              <div className="min-w-0">
                <p className="font-semibold text-slate-950">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                <p className="mt-3 text-xs font-bold text-rescue-700">{item.action}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

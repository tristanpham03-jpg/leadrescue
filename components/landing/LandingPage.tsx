import Link from "next/link";
import { ArrowRight, Bell, Bot, Check, Clock, MailCheck, PlugZap, ShieldCheck } from "lucide-react";
import { plans } from "@/lib/plans";

const features = [
  { icon: Clock, title: "Instant lead response", text: "Reply within seconds after a website form is submitted." },
  { icon: Bot, title: "AI-written messages", text: "Friendly, local, professional responses using your business profile." },
  { icon: Bell, title: "Owner alerts", text: "Notify the business so urgent jobs do not sit unread." },
  { icon: MailCheck, title: "Follow-up reminders", text: "Send 24-hour and 72-hour reminders when leads stay new." },
  { icon: PlugZap, title: "Public capture endpoint", text: "Embed or post website forms directly into LeadRescue." },
  { icon: ShieldCheck, title: "SaaS-ready controls", text: "Auth, subscriptions, CSV export, and protected dashboards included." }
];

export function LandingPage() {
  return (
    <main className="bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-rescue-600 via-signal to-sky-500" />
        <div className="mx-auto grid min-h-[88vh] max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <p className="mb-4 inline-flex rounded-md bg-rescue-50 px-3 py-1 text-sm font-semibold text-rescue-700">
              Built for plumbers, HVAC, electricians, landscapers, roofers, and home service teams
            </p>
            <h1 className="max-w-4xl text-4xl font-bold tracking-normal text-slate-950 sm:text-6xl">
              Never lose a lead because you responded too slowly.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              LeadRescue automatically responds to website inquiries, alerts the owner, tracks every lead, and keeps
              follow-up moving until the customer is contacted.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-rescue-600 px-5 text-sm font-semibold text-white hover:bg-rescue-700"
              >
                Start rescuing leads <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                View pricing
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-950 p-3 shadow-soft">
            <div className="rounded-md bg-white p-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Live lead rescue</p>
                  <p className="text-lg font-bold">ABC Plumbing</p>
                </div>
                <span className="rounded-md bg-rescue-50 px-2 py-1 text-xs font-bold text-rescue-700">12 sec reply</span>
              </div>
              <div className="mt-4 space-y-3">
                {["New water heater lead received", "AI response generated", "Customer email sent", "Owner notified"].map(
                  (item) => (
                    <div key={item} className="flex items-center gap-3 rounded-md border border-slate-100 p-3">
                      <Check className="h-4 w-4 text-rescue-600" />
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </div>
                  )
                )}
              </div>
              <div className="mt-4 rounded-md bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  Hi John, thanks for contacting ABC Plumbing about your water heater. We received your request and
                  will reach out shortly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-6">
              <feature.icon className="h-6 w-6 text-rescue-600" />
              <h2 className="mt-4 text-lg font-bold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase text-rescue-700">Dashboard preview</p>
              <h2 className="mt-2 text-3xl font-bold">See every inquiry, response, and follow-up.</h2>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-4">
                {["Total leads", "This month", "Response rate", "Conversion"].map((label, index) => (
                  <div key={label} className="rounded-md bg-white p-4">
                    <p className="text-xs font-semibold text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold">{[248, 42, "96%", "31%"][index]}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-64 rounded-md bg-white p-4">
                <div className="flex h-full items-end gap-3">
                  {[40, 70, 48, 90, 64, 110, 84].map((height, index) => (
                    <div key={index} className="flex flex-1 items-end">
                      <div className="w-full rounded-t-md bg-rescue-500" style={{ height }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-3">
                {["Sarah L.", "Mike R.", "Janet P."].map((name) => (
                  <div key={name} className="rounded-md bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{name}</p>
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">New</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Needs a same-week estimate and received an instant reply.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase text-rescue-700">Pricing</p>
          <h2 className="mt-2 text-3xl font-bold">Plans that match your lead volume.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Object.entries(plans).map(([key, plan]) => (
            <div key={key} className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="mt-3 text-4xl font-bold">${plan.price}<span className="text-base font-medium text-slate-500">/mo</span></p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-rescue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={`/signup?plan=${key}`}
                className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

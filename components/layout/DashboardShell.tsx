import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Building2, CreditCard, Globe2, Inbox, MessageSquareText, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/leads", label: "Leads", icon: Inbox },
  { href: "/business", label: "Business", icon: Building2 },
  { href: "/settings/website", label: "Website Setup", icon: Globe2 },
  { href: "/settings/automation", label: "Automation", icon: Settings },
  { href: "/settings/billing", label: "Billing", icon: CreditCard }
];

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 md:block">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-rescue-600 text-white">
            <MessageSquareText className="h-5 w-5" />
          </span>
          LeadRescue
        </Link>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-slate-950">
            LeadRescue
          </Link>
          <Link href="/leads" className="text-sm font-semibold text-rescue-700">
            Leads
          </Link>
        </div>
      </header>
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

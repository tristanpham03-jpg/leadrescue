import { notFound } from "next/navigation";
import { PublicLeadCaptureForm } from "@/components/forms/PublicLeadCaptureForm";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Business } from "@/lib/types";

export default async function CapturePage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("businesses").select("*").eq("id", businessId).maybeSingle();
  const business = data as Business | null;
  if (!business) notFound();

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <PublicLeadCaptureForm businessId={business.id} businessName={business.business_name} />
      </div>
    </main>
  );
}

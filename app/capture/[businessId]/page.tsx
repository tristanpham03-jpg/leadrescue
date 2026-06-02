import { notFound } from "next/navigation";
import { PublicLeadCaptureForm } from "@/components/forms/PublicLeadCaptureForm";
import { captureFormDefaults } from "@/lib/captureFormDefaults";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Business } from "@/lib/types";

function setting(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export default async function CapturePage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("businesses").select("*").eq("id", businessId).maybeSingle();
  const business = data as Business | null;
  if (!business) notFound();

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <PublicLeadCaptureForm
          businessId={business.id}
          businessName={business.business_name}
          headline={setting(business.capture_form_headline, captureFormDefaults.headline)}
          buttonText={setting(business.capture_form_button_text, captureFormDefaults.buttonText)}
          successMessage={setting(business.capture_form_success_message, captureFormDefaults.successMessage)}
          primaryColor={setting(business.capture_form_primary_color, captureFormDefaults.primaryColor)}
          services={business.capture_form_services ?? []}
        />
      </div>
    </main>
  );
}

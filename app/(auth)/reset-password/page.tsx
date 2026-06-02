import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <AuthForm mode="reset" />
    </AuthShell>
  );
}

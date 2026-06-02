"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Mode = "login" | "signup" | "reset";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const redirectTo = `${window.location.origin}/dashboard`;
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : mode === "signup"
          ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
          : await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === "reset") {
      setMessage("Check your email for a password reset link.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">
          {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "login"
            ? "Sign in to manage your leads."
            : mode === "signup"
              ? "Start your LeadRescue workspace."
              : "We will send a secure reset link."}
        </p>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Email
        <Input className="mt-1" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      {mode !== "reset" && (
        <label className="block text-sm font-medium text-slate-700">
          Password
          <Input
            className="mt-1"
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
      )}
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-md bg-rescue-50 p-3 text-sm text-rescue-700">{message}</p>}
      <Button className="w-full" disabled={loading}>
        {loading ? "Working..." : mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Send reset link"}
      </Button>
      <div className="flex justify-between text-sm">
        {mode !== "login" ? <Link href="/login" className="font-semibold text-rescue-700">Log in</Link> : null}
        {mode !== "signup" ? <Link href="/signup" className="font-semibold text-rescue-700">Create account</Link> : null}
        {mode !== "reset" ? <Link href="/reset-password" className="font-semibold text-slate-500">Forgot password?</Link> : null}
      </div>
    </form>
  );
}

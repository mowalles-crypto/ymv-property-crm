"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(t.auth.genericError);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-medium text-ivory">
          {t.auth.checkYourEmail}
        </h1>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-gold hover:text-gold-light"
        >
          {t.auth.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-medium text-ivory">
        {t.auth.resetPassword}
      </h1>
      <p className="mt-1 text-sm text-warmgray">{t.auth.forgotPasswordSubtitle}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          id="email"
          type="email"
          label={t.auth.email}
          variant="dark"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" variant="gold" disabled={loading} className="w-full">
          {loading ? t.common.loading : t.auth.sendResetLink}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-warmgray">
        <Link href="/login" className="font-medium text-gold hover:text-gold-light">
          {t.auth.backToLogin}
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(t.auth.genericError);
      return;
    }

    router.push("/login");
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-medium text-ivory">
        {t.auth.resetPassword}
      </h1>
      <p className="mt-1 text-sm text-warmgray">{t.auth.resetPasswordSubtitle}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <PasswordField
          id="password"
          label={t.auth.newPassword}
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          id="confirmPassword"
          label={t.auth.confirmPassword}
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" variant="gold" disabled={loading} className="w-full">
          {loading ? t.common.loading : t.auth.resetPassword}
        </Button>
      </form>
    </div>
  );
}

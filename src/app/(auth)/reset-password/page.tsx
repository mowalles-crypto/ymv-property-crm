"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Field";
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
      <h1 className="text-xl font-semibold text-slate-900">
        {t.auth.resetPassword}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          id="password"
          type="password"
          label={t.auth.newPassword}
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          id="confirmPassword"
          type="password"
          label={t.auth.confirmPassword}
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t.common.loading : t.auth.resetPassword}
        </Button>
      </form>
    </div>
  );
}

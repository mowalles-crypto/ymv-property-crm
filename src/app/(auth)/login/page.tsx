"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Field";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sessionExpired = searchParams.get("reason") === "session-expired";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(t.auth.invalidCredentials);
      setLoading(false);
      return;
    }

    const redirectTo = searchParams.get("redirectTo") || "/";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-medium text-ivory">
        {t.auth.loginTitle}
      </h1>
      <p className="mt-1 text-sm text-warmgray">{t.auth.loginSubtitle}</p>

      {sessionExpired && (
        <p className="mt-4 rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold-light">
          {t.app.sessionExpired}
        </p>
      )}

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
        <PasswordField
          id="password"
          label={t.auth.password}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-gold hover:text-gold-light">
            {t.auth.forgotPassword}
          </Link>
        </div>

        <Button type="submit" variant="gold" disabled={loading} className="w-full">
          {loading ? t.common.loading : t.auth.login}
        </Button>
      </form>

      <div className="mt-8 border-t border-white/10 pt-6 text-center">
        <p className="text-sm text-warmgray">{t.auth.noAccount}</p>
        <Link
          href="/register"
          className="mt-1 inline-block text-sm font-medium text-gold hover:text-gold-light"
        >
          {t.auth.createAccountCta}
        </Link>
      </div>
    </div>
  );
}

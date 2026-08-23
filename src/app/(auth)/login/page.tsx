"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Field";
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
      <h1 className="text-xl font-semibold text-slate-900">
        {t.auth.loginTitle}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{t.auth.loginSubtitle}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          id="email"
          type="email"
          label={t.auth.email}
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          id="password"
          type="password"
          label={t.auth.password}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            {t.auth.forgotPassword}
          </Link>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t.common.loading : t.auth.login}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.noAccount}{" "}
        <Link
          href="/register"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          {t.auth.register}
        </Link>
      </p>
    </div>
  );
}

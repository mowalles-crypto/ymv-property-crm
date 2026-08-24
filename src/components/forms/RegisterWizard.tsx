"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Field";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { RequirementsFields } from "@/components/forms/RequirementsFields";
import { t } from "@/lib/i18n";
import {
  buildRegistrationRpcArgs,
  emptyRequirementsForm,
  type RequirementsFormState,
} from "@/lib/types/forms";

type Step = 1 | 2 | 3 | 4;

const steps: { step: Step; label: string }[] = [
  { step: 1, label: t.registration.stepAccount },
  { step: 2, label: t.registration.stepContact },
  { step: 3, label: t.registration.stepRequirements },
  { step: 4, label: t.registration.stepConfirmation },
];

export function RegisterWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");

  const [requirements, setRequirements] =
    useState<RequirementsFormState>(emptyRequirementsForm);

  function validateStep1() {
    if (!fullName.trim()) return "Full name is required.";
    if (!email.trim()) return "Email is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  }

  function validateStep2() {
    if (!phone1.trim()) return "Primary phone is required.";
    return null;
  }

  function validateStep3() {
    if (!requirements.purchase_purpose) return "Purchase purpose is required.";
    if (!requirements.purchase_timeline) return "Purchase timeline is required.";
    return null;
  }

  function goNext() {
    setError(null);
    const err =
      step === 1 ? validateStep1() : step === 2 ? validateStep2() : step === 3 ? validateStep3() : null;
    if (err) {
      setError(err);
      return;
    }
    setStep((s) => (s + 1) as Step);
  }

  function goBack() {
    setError(null);
    setStep((s) => (s - 1) as Step);
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/`,
      },
    });

    if (signUpError) {
      setError(signUpError.message || t.auth.genericError);
      setSubmitting(false);
      return;
    }

    if (!data.session) {
      // Email confirmation is required — the user has no session yet, so we
      // cannot call the registration RPC now. They finish onboarding via
      // /register/complete-requirements right after confirming their email
      // and logging in (the root route sends any client with no linked
      // customer there automatically).
      setAwaitingConfirmation(true);
      setSubmitting(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc(
      "complete_client_registration",
      buildRegistrationRpcArgs(fullName, phone1, phone2, requirements)
    );

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message || t.auth.genericError);
      return;
    }

    router.push("/client/home");
    router.refresh();
  }

  if (awaitingConfirmation) {
    return (
      <div className="text-center">
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-medium text-ivory">
          {t.auth.verifyEmailTitle}
        </h1>
        <p className="mt-2 text-sm text-warmgray">{t.auth.verifyEmailSubtitle}</p>
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
      <ol className="mb-6 flex items-center justify-between text-xs font-medium text-warmgray">
        {steps.map((s, i) => (
          <li key={s.step} className="flex flex-1 items-center">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                step >= s.step
                  ? "bg-gradient-to-br from-gold-light to-gold-dark text-charcoal"
                  : "bg-white/10 text-warmgray"
              }`}
            >
              {s.step}
            </div>
            <span className={`ml-2 hidden sm:inline ${step === s.step ? "text-ivory" : ""}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="mx-2 h-px flex-1 bg-white/10" />}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="space-y-4">
          <Input
            id="fullName"
            label={t.auth.fullName}
            variant="dark"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
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
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Input
            id="phone1"
            type="tel"
            label={t.auth.phone1}
            variant="dark"
            required
            value={phone1}
            onChange={(e) => setPhone1(e.target.value)}
          />
          <Input
            id="phone2"
            type="tel"
            label={t.auth.phone2}
            variant="dark"
            optional
            value={phone2}
            onChange={(e) => setPhone2(e.target.value)}
          />
        </div>
      )}

      {step === 3 && (
        <RequirementsFields value={requirements} onChange={setRequirements} />
      )}

      {step === 4 && (
        <div>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-lg font-medium text-ivory">
            {t.registration.confirmationTitle}
          </h2>
          <p className="mt-1 text-sm text-warmgray">
            {t.registration.confirmationSubtitle}
          </p>
          <dl className="mt-4 divide-y divide-white/10 text-sm">
            <SummaryRow label={t.auth.fullName} value={fullName} />
            <SummaryRow label={t.auth.email} value={email} />
            <SummaryRow label={t.auth.phone1} value={phone1} />
            {phone2 && <SummaryRow label={t.auth.phone2} value={phone2} />}
            <SummaryRow
              label={t.requirements.purchasePurpose}
              value={
                requirements.purchase_purpose
                  ? t.requirements.purchasePurposeOptions[requirements.purchase_purpose]
                  : "—"
              }
            />
            <SummaryRow
              label={t.requirements.propertyTypes}
              value={
                requirements.property_types.length
                  ? requirements.property_types
                      .map((k) => t.requirements.propertyTypeOptions[k])
                      .join(", ")
                  : "—"
              }
            />
            <SummaryRow
              label={t.requirements.preferredLocations}
              value={requirements.preferred_locations || "—"}
            />
            <SummaryRow
              label={t.requirements.purchaseTimeline}
              value={
                requirements.purchase_timeline
                  ? t.requirements.timelineOptions[requirements.purchase_timeline]
                  : "—"
              }
            />
          </dl>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 flex items-center justify-between">
        {step > 1 ? (
          <Button type="button" variant="gold-outline" onClick={goBack} disabled={submitting}>
            {t.registration.back}
          </Button>
        ) : (
          <span />
        )}

        {step < 4 ? (
          <Button type="button" variant="gold" onClick={goNext}>
            {t.registration.next}
          </Button>
        ) : (
          <Button type="button" variant="gold" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t.registration.submitting : t.registration.submit}
          </Button>
        )}
      </div>

      {step === 1 && (
        <p className="mt-6 text-center text-sm text-warmgray">
          {t.auth.haveAccount}{" "}
          <Link href="/login" className="font-medium text-gold hover:text-gold-light">
            {t.auth.login}
          </Link>
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <dt className="text-warmgray">{label}</dt>
      <dd className="text-right font-medium text-ivory">{value}</dd>
    </div>
  );
}

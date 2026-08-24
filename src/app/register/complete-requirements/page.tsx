import { redirect } from "next/navigation";
import Image from "next/image";
import { requireProfile } from "@/lib/auth";
import { CompleteRequirementsForm } from "@/components/forms/CompleteRequirementsForm";
import { t } from "@/lib/i18n";

export default async function CompleteRequirementsPage() {
  const profile = await requireProfile();

  // Already linked to a customer — nothing left to complete here.
  if (profile.customer_id) {
    redirect(profile.role === "admin" ? "/admin/dashboard" : "/client/home");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Image
            src="/brand/bizrael-logo.png"
            alt="BIZRAEL — Your Key to Success"
            width={218}
            height={80}
            className="h-auto w-40"
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-medium text-ivory">
            {t.registration.stepConfirmation}
          </h1>
          <p className="mt-1 text-sm text-warmgray">
            Your email is confirmed — just a few more details to finish setting up your account.
          </p>
          <div className="mt-6">
            <CompleteRequirementsForm />
          </div>
        </div>
      </div>
    </div>
  );
}

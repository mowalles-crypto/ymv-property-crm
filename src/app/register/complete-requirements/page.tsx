import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { CompleteRequirementsForm } from "@/components/forms/CompleteRequirementsForm";
import { t } from "@/lib/i18n";

export default async function CompleteRequirementsPage() {
  const profile = await requireProfile();

  // Already linked to a customer — nothing left to complete here.
  if (profile.customer_id) {
    redirect(profile.role === "admin" ? "/admin/dashboard" : "/client/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="text-xl font-semibold text-indigo-700">
            {t.app.name}
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold text-slate-900">
            {t.registration.stepConfirmation}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
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

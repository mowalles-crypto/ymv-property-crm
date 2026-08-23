import { RegisterWizard } from "@/components/forms/RegisterWizard";
import { t } from "@/lib/i18n";

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">
        {t.auth.registerTitle}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{t.auth.registerSubtitle}</p>
      <div className="mt-6">
        <RegisterWizard />
      </div>
    </div>
  );
}

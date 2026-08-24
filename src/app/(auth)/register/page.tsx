import { RegisterWizard } from "@/components/forms/RegisterWizard";
import { t } from "@/lib/i18n";

export default function RegisterPage() {
  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-medium text-ivory">
        {t.auth.registerTitle}
      </h1>
      <p className="mt-1 text-sm text-warmgray">{t.auth.registerSubtitle}</p>
      <div className="mt-6">
        <RegisterWizard />
      </div>
    </div>
  );
}

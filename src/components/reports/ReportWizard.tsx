"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { ReportDisplay } from "@/components/reports/ReportDisplay";
import { generateReport, resolveYearPeriod, type ReportResult } from "@/lib/reports";
import { t } from "@/lib/i18n";

type Step = "type" | "property" | "period" | "result";
type ReportType = "portfolio" | "property";
type PeriodMode = "custom" | "year";

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

export function ReportWizard({
  customerId,
  customerName,
  properties,
}: {
  customerId: string;
  customerName: string;
  properties: { id: string; property_address: string }[];
}) {
  const [step, setStep] = useState<Step>("type");
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [propertyId, setPropertyId] = useState<string>("");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("year");
  const [year, setYear] = useState(currentYear);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResult | null>(null);

  function chooseType(type: ReportType) {
    setReportType(type);
    setStep(type === "property" ? "property" : "period");
  }

  async function handleGenerate() {
    setError(null);
    let fromDate: string;
    let toDate: string;

    if (periodMode === "custom") {
      if (!customFrom || !customTo) {
        setError("Please choose both a from and to date.");
        return;
      }
      fromDate = customFrom;
      toDate = customTo;
    } else {
      ({ fromDate, toDate } = resolveYearPeriod(year));
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const result = await generateReport(supabase, {
        customerId,
        propertyId: reportType === "property" ? propertyId : undefined,
        fromDate,
        toDate,
      });
      setReport(result);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.auth.genericError);
    } finally {
      setLoading(false);
    }
  }

  if (step === "result" && report) {
    const selectedProperty = properties.find((p) => p.id === propertyId);
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => {
            setStep("type");
            setReport(null);
          }}
        >
          ← {t.reports.startOver}
        </Button>
        <ReportDisplay
          report={report}
          reportType={reportType === "property" ? "property" : "portfolio"}
          customerName={customerName}
          propertyAddress={selectedProperty?.property_address}
        />
      </div>
    );
  }

  return (
    <Card>
      {step === "type" && (
        <div>
          <h3 className="text-base font-medium text-slate-900">{t.reports.reportTypeQuestion}</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => chooseType("portfolio")}
              className="rounded-lg border border-slate-200 p-5 text-left hover:border-gold hover:bg-gold/5"
            >
              <div className="font-medium text-slate-900">{t.reports.portfolioReport}</div>
              <div className="mt-1 text-sm text-slate-500">{t.reports.portfolioReportDesc}</div>
            </button>
            <button
              type="button"
              onClick={() => chooseType("property")}
              className="rounded-lg border border-slate-200 p-5 text-left hover:border-gold hover:bg-gold/5"
              disabled={properties.length === 0}
            >
              <div className="font-medium text-slate-900">{t.reports.propertyReport}</div>
              <div className="mt-1 text-sm text-slate-500">{t.reports.propertyReportDesc}</div>
            </button>
          </div>
        </div>
      )}

      {step === "property" && (
        <div>
          <h3 className="text-base font-medium text-slate-900">{t.reports.selectProperty}</h3>
          <div className="mt-4 space-y-2">
            {properties.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPropertyId(p.id);
                  setStep("period");
                }}
                className="block w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm hover:border-gold hover:bg-gold/5"
              >
                {p.property_address}
              </button>
            ))}
          </div>
          <Button variant="ghost" className="mt-4" onClick={() => setStep("type")}>
            ← {t.reports.back}
          </Button>
        </div>
      )}

      {step === "period" && (
        <div>
          <h3 className="text-base font-medium text-slate-900">{t.reports.periodQuestion}</h3>
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant={periodMode === "year" ? "primary" : "secondary"}
              onClick={() => setPeriodMode("year")}
            >
              {t.reports.fullYear}
            </Button>
            <Button
              type="button"
              variant={periodMode === "custom" ? "primary" : "secondary"}
              onClick={() => setPeriodMode("custom")}
            >
              {t.reports.customRange}
            </Button>
          </div>

          {periodMode === "year" ? (
            <div className="mt-4 max-w-xs">
              <Select id="year" label={t.reports.selectYear} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 max-w-md">
              <Input
                id="from_date"
                type="date"
                label={t.reports.fromDate}
                value={customFrom}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <Input
                id="to_date"
                type="date"
                label={t.reports.toDate}
                value={customTo}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setStep(reportType === "property" ? "property" : "type")}
            >
              ← {t.reports.back}
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? t.common.loading : t.reports.generateReport}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

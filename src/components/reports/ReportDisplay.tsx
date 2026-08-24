"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { ReportResult } from "@/lib/reports";

function toCsv(report: ReportResult): string {
  const lines = ["Type,Date,Property,Category,Description,Amount"];
  for (const tx of report.incomeTransactions) {
    lines.push(
      ["Income", tx.transaction_date, tx.property_address, tx.category, tx.description ?? "", tx.amount].join(",")
    );
  }
  for (const tx of report.expenseTransactions) {
    lines.push(
      ["Expense", tx.transaction_date, tx.property_address, tx.category, tx.description ?? "", tx.amount].join(",")
    );
  }
  return lines.join("\n");
}

export function ReportDisplay({
  report,
  reportType,
  customerName,
  propertyAddress,
}: {
  report: ReportResult;
  reportType: "portfolio" | "property";
  customerName: string;
  propertyAddress?: string;
}) {
  const [showIncome, setShowIncome] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  function handleDownloadCsv() {
    const blob = new Blob([toCsv(report)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bizrael-report-${report.fromDate}-to-${report.toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            {t.reports.printReport}
          </Button>
          <Button variant="secondary" onClick={handleDownloadCsv}>
            {t.reports.downloadCsv}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none sm:p-8">
        <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-6">
          <div>
            <Image
              src="/brand/bizrael-logo.png"
              alt={t.app.fullName}
              width={218}
              height={80}
              className="h-auto w-32"
            />
            <h2
              style={{ fontFamily: "var(--font-display)" }}
              className="mt-4 text-xl font-medium text-slate-900"
            >
              {reportType === "portfolio" ? t.reports.portfolioReport : t.reports.propertyReport}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t.reports.reportFor} {customerName}
              {propertyAddress ? ` — ${propertyAddress}` : ""}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {t.reports.reportPeriod}: {formatDate(report.fromDate)} — {formatDate(report.toDate)}
            </p>
          </div>
          <p className="text-right text-xs text-slate-400">
            {t.reports.generatedOn}
            <br />
            {formatDate(new Date().toISOString())}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard label={t.reports.totalInvestment} value={formatCurrency(report.totalInvestment)} />
          <SummaryCard label={t.reports.totalIncome} value={formatCurrency(report.totalIncome)} tone="positive" />
          <SummaryCard label={t.reports.totalExpenses} value={formatCurrency(report.totalExpenses)} tone="negative" />
          <SummaryCard label={t.reports.netProfit} value={formatCurrency(report.netProfit)} tone="highlight" />
        </div>
        <p className="mt-3 text-xs text-slate-400">{t.reports.netProfitNote}</p>

        {report.investmentBreakdown.length > 1 && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              className="text-sm font-medium text-gold-dark hover:text-gold print:hidden"
            >
              {showBreakdown ? t.reports.hideInvestmentBreakdown : t.reports.showInvestmentBreakdown}
            </button>
            <div className={`${showBreakdown ? "" : "hidden"} mt-3 overflow-x-auto print:block`}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-2 pr-4">{t.reports.property}</th>
                    <th className="py-2 pr-4 text-right">{t.property.purchasePrice}</th>
                    <th className="py-2 pr-4 text-right">{t.reports.totalInvestment}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.investmentBreakdown.map((b) => (
                    <tr key={b.property_id} className="border-b border-slate-100">
                      <td className="py-2 pr-4">{b.property_address}</td>
                      <td className="py-2 pr-4 text-right">{formatCurrency(b.purchase_price)}</td>
                      <td className="py-2 pr-4 text-right font-medium">{formatCurrency(b.total_investment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <TransactionSection
            title={t.reports.showIncomeDetails}
            hideTitle={t.reports.hideIncomeDetails}
            total={report.totalIncome}
            totalLabel={t.reports.totalIncome}
            rows={report.incomeTransactions}
            reportType={reportType}
            expanded={showIncome}
            onToggle={() => setShowIncome((v) => !v)}
          />
          <TransactionSection
            title={t.reports.showExpenseDetails}
            hideTitle={t.reports.hideExpenseDetails}
            total={report.totalExpenses}
            totalLabel={t.reports.totalExpenses}
            rows={report.expenseTransactions}
            reportType={reportType}
            expanded={showExpenses}
            onToggle={() => setShowExpenses((v) => !v)}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative" | "highlight";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
        ? "text-red-600"
        : tone === "highlight"
          ? "text-gold-dark"
          : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 print:border print:bg-white">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function TransactionSection({
  title,
  hideTitle,
  total,
  totalLabel,
  rows,
  reportType,
  expanded,
  onToggle,
}: {
  title: string;
  hideTitle: string;
  total: number;
  totalLabel: string;
  rows: ReportResult["incomeTransactions"];
  reportType: "portfolio" | "property";
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="text-sm font-medium text-gold-dark hover:text-gold print:hidden"
      >
        {expanded ? hideTitle : title}
      </button>
      <div className={`${expanded ? "" : "hidden"} mt-3 print:block`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-3">{t.reports.date}</th>
                {reportType === "portfolio" && <th className="py-2 pr-3">{t.reports.property}</th>}
                <th className="py-2 pr-3">{t.reports.category}</th>
                <th className="py-2 pr-3">{t.reports.description}</th>
                <th className="py-2 pr-3 text-right">{t.reports.amount}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="py-1.5 pr-3">{formatDate(r.transaction_date)}</td>
                  {reportType === "portfolio" && <td className="py-1.5 pr-3">{r.property_address}</td>}
                  <td className="py-1.5 pr-3">
                    {t.transactionCategoryOptions[r.category as keyof typeof t.transactionCategoryOptions] ?? r.category}
                  </td>
                  <td className="py-1.5 pr-3 text-slate-500">{r.description ?? "—"}</td>
                  <td className="py-1.5 pr-3 text-right">{formatCurrency(r.amount)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={reportType === "portfolio" ? 5 : 4} className="py-4 text-center text-slate-400">
                    {t.reports.noTransactions}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 font-semibold">
                <td colSpan={reportType === "portfolio" ? 4 : 3} className="py-2 pr-3">
                  {totalLabel}
                </td>
                <td className="py-2 pr-3 text-right">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

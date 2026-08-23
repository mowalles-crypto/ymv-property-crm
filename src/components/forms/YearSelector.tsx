"use client";

import { useRouter } from "next/navigation";

export function YearSelector({
  year,
  basePath,
  years,
}: {
  year: number;
  basePath: string;
  years: number[];
}) {
  const router = useRouter();

  return (
    <select
      value={year}
      onChange={(e) => router.push(`${basePath}?tab=accounting&year=${e.target.value}`)}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}

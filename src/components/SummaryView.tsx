"use client";

import { useMemo, useState } from "react";
import { useTrackerStore } from "@/lib/store";
import { aggregateByMonth, aggregateByWeek, availableYears, monthsForYear } from "@/lib/aggregate";
import { formatHoursDecimal, formatMinutesAsHours, formatMonthLabel, formatWeekLabel } from "@/lib/time";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Tab = "semaine" | "mois" | "annee";

export default function SummaryView() {
  const [tab, setTab] = useState<Tab>("semaine");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-xl border border-neutral-200 bg-white p-1.5 dark:border-neutral-800 dark:bg-neutral-900">
        {(
          [
            ["semaine", "Vue semaine par semaine"],
            ["mois", "Vue mois"],
            ["annee", "Vue année"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === value
                ? "bg-indigo-600 text-white"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "semaine" && <WeeklyTable />}
      {tab === "mois" && <MonthlyTable />}
      {tab === "annee" && <YearlyTable />}
    </div>
  );
}

function TableShell({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-neutral-100 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-2.5">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">{children}</tbody>
      </table>
    </div>
  );
}

function WeeklyTable() {
  const entries = useTrackerStore((s) => s.entries);
  const weeks = useMemo(() => aggregateByWeek(entries), [entries]);

  if (weeks.length === 0) return <EmptyState />;

  return (
    <TableShell columns={["Semaine", "Jours travaillés", "Jours de congé", "Total heures", "Moyenne / jour"]}>
      {weeks.map((w) => (
        <tr key={w.key} className="bg-white dark:bg-neutral-900">
          <td className="px-4 py-2.5 capitalize">{formatWeekLabel(w.start)}</td>
          <td className="px-4 py-2.5">{w.daysWorked}</td>
          <td className="px-4 py-2.5">{w.daysOnLeave || "—"}</td>
          <td className="px-4 py-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
            {formatMinutesAsHours(w.totalMinutes)}
          </td>
          <td className="px-4 py-2.5">
            {w.daysWorked > 0 ? `${formatHoursDecimal(w.totalMinutes / w.daysWorked)} h` : "—"}
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

function MonthlyTable() {
  const entries = useTrackerStore((s) => s.entries);
  const months = useMemo(() => aggregateByMonth(entries), [entries]);

  if (months.length === 0) return <EmptyState />;

  return (
    <TableShell columns={["Mois", "Jours travaillés", "Jours de congé", "Total heures", "Moyenne / jour"]}>
      {months.map((m) => (
        <tr key={m.key} className="bg-white dark:bg-neutral-900">
          <td className="px-4 py-2.5 capitalize">{formatMonthLabel(m.start)}</td>
          <td className="px-4 py-2.5">{m.daysWorked}</td>
          <td className="px-4 py-2.5">{m.daysOnLeave || "—"}</td>
          <td className="px-4 py-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
            {formatMinutesAsHours(m.totalMinutes)}
          </td>
          <td className="px-4 py-2.5">
            {m.daysWorked > 0 ? `${formatHoursDecimal(m.totalMinutes / m.daysWorked)} h` : "—"}
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

function YearlyTable() {
  const entries = useTrackerStore((s) => s.entries);
  const years = useMemo(() => availableYears(entries), [entries]);
  const [year, setYear] = useState(() => new Date().getFullYear());

  const months = useMemo(() => monthsForYear(entries, year), [entries, year]);
  const yearTotal = months.reduce((sum, m) => sum + m.totalMinutes, 0);
  const yearDays = months.reduce((sum, m) => sum + m.daysWorked, 0);
  const yearLeaveDays = months.reduce((sum, m) => sum + m.daysOnLeave, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <div className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">
          Total {year} : {formatMinutesAsHours(yearTotal)} ({yearDays} jours travaillés, {yearLeaveDays}{" "}
          jours de congé)
        </div>
      </div>

      <TableShell columns={["Mois", "Jours travaillés", "Jours de congé", "Total heures", "Moyenne / jour"]}>
        {months.map((m) => (
          <tr key={m.key} className="bg-white dark:bg-neutral-900">
            <td className="px-4 py-2.5 capitalize">{format(m.start, "MMMM", { locale: fr })}</td>
            <td className="px-4 py-2.5">{m.daysWorked || "—"}</td>
            <td className="px-4 py-2.5">{m.daysOnLeave || "—"}</td>
            <td className="px-4 py-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
              {m.totalMinutes > 0 ? formatMinutesAsHours(m.totalMinutes) : "—"}
            </td>
            <td className="px-4 py-2.5">
              {m.daysWorked > 0 ? `${formatHoursDecimal(m.totalMinutes / m.daysWorked)} h` : "—"}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
      Aucune donnée saisie pour le moment. Renseignez vos horaires depuis l&apos;onglet
      Saisie.
    </div>
  );
}

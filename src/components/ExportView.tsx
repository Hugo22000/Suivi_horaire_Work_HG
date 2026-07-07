"use client";

import { useMemo, useState } from "react";
import { useTrackerStore } from "@/lib/store";
import { availableYears } from "@/lib/aggregate";
import { dayTotalMinutes, fromISODate } from "@/lib/time";
import { exportEntriesToExcel } from "@/lib/exportExcel";

export default function ExportView() {
  const entries = useTrackerStore((s) => s.entries);
  const years = useMemo(() => availableYears(entries), [entries]);
  const [year, setYear] = useState<number | "all">("all");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const daysWithData = useMemo(
    () =>
      Object.entries(entries).filter(
        ([date, entry]) =>
          (year === "all" || fromISODate(date).getFullYear() === year) &&
          (dayTotalMinutes(entry) > 0 || entry.transport)
      ).length,
    [entries, year]
  );

  async function handleExport() {
    setStatus("loading");
    try {
      await exportEntriesToExcel(entries, year);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
          Exporter les données
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Génère un fichier Excel (.xlsx) avec trois feuilles : détail journalier, récapitulatif
          par semaine et récapitulatif par mois.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            Période :
            <select
              value={year}
              onChange={(e) => setYear(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="all">Toutes les années</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={handleExport}
            disabled={status === "loading" || daysWithData === 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? "Génération…" : "Télécharger le fichier Excel (.xlsx)"}
          </button>
        </div>

        <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
          {daysWithData} jour{daysWithData > 1 ? "s" : ""} avec des données seront exporté
          {daysWithData > 1 ? "s" : ""}.
        </p>

        {status === "done" && (
          <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Le fichier a été téléchargé.
          </p>
        )}
        {status === "error" && (
          <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
            Une erreur est survenue lors de la génération du fichier.
          </p>
        )}
      </div>
    </div>
  );
}

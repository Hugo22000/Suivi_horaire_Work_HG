"use client";

import { useMemo, useState } from "react";
import { useTrackerStore } from "@/lib/store";
import { useUiPreferencesStore } from "@/lib/uiStore";
import {
  dayTotalMinutes,
  filterVisibleDays,
  formatMinutesAsHours,
  formatWeekLabel,
  getWeekDays,
  shiftWeek,
  toISODate,
} from "@/lib/time";
import DayCard from "./DayCard";

export default function WeekView() {
  const [anchor, setAnchor] = useState(() => new Date());
  const entries = useTrackerStore((s) => s.entries);
  const showWeekends = useUiPreferencesStore((s) => s.showWeekends);
  const setShowWeekends = useUiPreferencesStore((s) => s.setShowWeekends);
  const setWeekLeave = useTrackerStore((s) => s.setWeekLeave);
  const days = useMemo(
    () => filterVisibleDays(getWeekDays(anchor), showWeekends),
    [anchor, showWeekends]
  );
  const dayIsos = useMemo(() => days.map((d) => toISODate(d)), [days]);

  const weekTotal = days.reduce((sum, d) => sum + dayTotalMinutes(entries[toISODate(d)]), 0);
  const weekOnLeave = dayIsos.every((iso) => entries[iso]?.leave === "full");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnchor((a) => shiftWeek(a, -1))}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            ← Semaine préc.
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => setAnchor((a) => shiftWeek(a, 1))}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Semaine suiv. →
          </button>
        </div>
        <div className="text-sm font-medium capitalize text-neutral-700 dark:text-neutral-200">
          {formatWeekLabel(anchor)}
        </div>
        <div className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">
          Total semaine : {formatMinutesAsHours(weekTotal)}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex w-fit items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={!showWeekends}
            onChange={(e) => setShowWeekends(!e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Jours ouvrés uniquement (masquer samedi et dimanche)
        </label>

        <label className="flex w-fit items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={weekOnLeave}
            onChange={(e) => setWeekLeave(dayIsos, e.target.checked ? "full" : "none")}
            className="h-3.5 w-3.5"
          />
          Semaine entière en congés
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        {days.map((day) => (
          <DayCard key={toISODate(day)} date={day} />
        ))}
      </div>
    </div>
  );
}

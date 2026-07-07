"use client";

import { useMemo, useState } from "react";
import { useTrackerStore } from "@/lib/store";
import {
  dayTotalMinutes,
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
  const days = useMemo(() => getWeekDays(anchor), [anchor]);

  const weekTotal = days.reduce((sum, d) => sum + dayTotalMinutes(entries[toISODate(d)]), 0);

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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        {days.map((day) => (
          <DayCard key={toISODate(day)} date={day} />
        ))}
      </div>
    </div>
  );
}

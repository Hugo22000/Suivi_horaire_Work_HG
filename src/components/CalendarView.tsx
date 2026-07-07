"use client";

import { useMemo, useState } from "react";
import { useTrackerStore } from "@/lib/store";
import {
  dayTotalMinutes,
  formatMinutesAsHours,
  formatMonthLabel,
  fromISODate,
  getMonthDays,
  isInMonth,
  shiftMonth,
  toISODate,
} from "@/lib/time";
import { TRANSPORT_ICONS } from "@/lib/types";
import DayCard from "./DayCard";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function CalendarView() {
  const [anchor, setAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const entries = useTrackerStore((s) => s.entries);
  const days = useMemo(() => getMonthDays(anchor), [anchor]);
  const todayIso = toISODate(new Date());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnchor((a) => shiftMonth(a, -1))}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            ← Mois préc.
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => setAnchor((a) => shiftMonth(a, 1))}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Mois suiv. →
          </button>
        </div>
        <div className="text-sm font-medium capitalize text-neutral-700 dark:text-neutral-200">
          {formatMonthLabel(anchor)}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="grid grid-cols-7 bg-neutral-100 text-center text-xs font-semibold text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const iso = toISODate(day);
            const entry = entries[iso];
            const total = dayTotalMinutes(entry);
            const inMonth = isInMonth(day, anchor);
            const isToday = iso === todayIso;
            const isSelected = iso === selected;

            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                className={`flex min-h-[84px] flex-col items-start gap-1 border-b border-r border-neutral-200 p-2 text-left transition dark:border-neutral-800 ${
                  inMonth
                    ? "bg-white dark:bg-neutral-900"
                    : "bg-neutral-50 text-neutral-400 dark:bg-neutral-900/40 dark:text-neutral-600"
                } ${isSelected ? "ring-2 ring-inset ring-indigo-500" : ""} hover:bg-indigo-50 dark:hover:bg-indigo-950/30`}
              >
                <span
                  className={`text-xs font-medium ${
                    isToday ? "rounded-full bg-indigo-600 px-1.5 py-0.5 text-white" : ""
                  }`}
                >
                  {day.getDate()}
                </span>
                {total > 0 && (
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {formatMinutesAsHours(total)}
                  </span>
                )}
                {entry?.transport && (
                  <span className="text-sm">{TRANSPORT_ICONS[entry.transport.mode]}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
              Édition rapide du jour sélectionné
            </h3>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-neutral-500 hover:underline dark:text-neutral-400"
            >
              Fermer
            </button>
          </div>
          <DayCard date={fromISODate(selected)} />
        </div>
      )}
    </div>
  );
}

"use client";

import { useTrackerStore } from "@/lib/store";
import { dayTotalMinutes, formatDayLabel, formatMinutesAsHours, toISODate } from "@/lib/time";
import { TRANSPORT_ICONS } from "@/lib/types";
import TransportSelector from "./TransportSelector";

export default function DayCard({ date }: { date: Date }) {
  const iso = toISODate(date);
  const entry = useTrackerStore((s) => s.entries[iso]);
  const setDayField = useTrackerStore((s) => s.setDayField);
  const setTransport = useTrackerStore((s) => s.setTransport);

  const total = dayTotalMinutes(entry);
  const isToday = toISODate(new Date()) === iso;

  return (
    <div
      className={`space-y-3 rounded-xl border p-4 ${
        isToday
          ? "border-indigo-400 bg-indigo-50/60 dark:border-indigo-600 dark:bg-indigo-950/30"
          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold capitalize text-neutral-800 dark:text-neutral-100">
          {formatDayLabel(date)}
        </h3>
        <div className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400">
          {entry?.transport && <span>{TRANSPORT_ICONS[entry.transport.mode]}</span>}
          <span>{formatMinutesAsHours(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TimeField
          label="Début matin"
          value={entry?.matinDebut ?? ""}
          onChange={(v) => setDayField(iso, "matinDebut", v)}
        />
        <TimeField
          label="Fin matin"
          value={entry?.matinFin ?? ""}
          onChange={(v) => setDayField(iso, "matinFin", v)}
        />
        <TimeField
          label="Début après-midi"
          value={entry?.apremDebut ?? ""}
          onChange={(v) => setDayField(iso, "apremDebut", v)}
        />
        <TimeField
          label="Fin après-midi"
          value={entry?.apremFin ?? ""}
          onChange={(v) => setDayField(iso, "apremFin", v)}
        />
      </div>

      <TransportSelector
        value={entry?.transport}
        onChange={(t) => setTransport(iso, t)}
      />
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
      />
    </label>
  );
}

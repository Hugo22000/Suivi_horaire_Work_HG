"use client";

import { useTrackerStore } from "@/lib/store";
import { dayTotalMinutes, formatDayLabel, formatMinutesAsHours, toISODate } from "@/lib/time";
import { LEAVE_LABELS, TRANSPORT_ICONS, type LeaveStatus } from "@/lib/types";
import TransportSelector from "./TransportSelector";

const LEAVE_OPTIONS: LeaveStatus[] = ["none", "full", "morning", "afternoon"];

export default function DayCard({ date }: { date: Date }) {
  const iso = toISODate(date);
  const entry = useTrackerStore((s) => s.entries[iso]);
  const setDayField = useTrackerStore((s) => s.setDayField);
  const setTransport = useTrackerStore((s) => s.setTransport);
  const setLeave = useTrackerStore((s) => s.setLeave);

  const leave = entry?.leave ?? "none";
  const morningDisabled = leave === "full" || leave === "morning";
  const afternoonDisabled = leave === "full" || leave === "afternoon";
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold capitalize text-neutral-800 dark:text-neutral-100">
          {formatDayLabel(date)}
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={leave}
            onChange={(e) => setLeave(iso, e.target.value as LeaveStatus)}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
          >
            {LEAVE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {LEAVE_LABELS[option]}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {entry?.transport && <span>{TRANSPORT_ICONS[entry.transport.mode]}</span>}
            <span>
              {leave === "full" ? "Congé" : formatMinutesAsHours(total)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TimeField
          label="Début matin"
          value={entry?.matinDebut ?? ""}
          onChange={(v) => setDayField(iso, "matinDebut", v)}
          disabled={morningDisabled}
        />
        <TimeField
          label="Fin matin"
          value={entry?.matinFin ?? ""}
          onChange={(v) => setDayField(iso, "matinFin", v)}
          disabled={morningDisabled}
        />
        <TimeField
          label="Début après-midi"
          value={entry?.apremDebut ?? ""}
          onChange={(v) => setDayField(iso, "apremDebut", v)}
          disabled={afternoonDisabled}
        />
        <TimeField
          label="Fin après-midi"
          value={entry?.apremFin ?? ""}
          onChange={(v) => setDayField(iso, "apremFin", v)}
          disabled={afternoonDisabled}
        />
      </div>

      <TransportSelector
        value={entry?.transport}
        onChange={(t) => setTransport(iso, t)}
        matinDebut={entry?.matinDebut ?? ""}
        apremFin={entry?.apremFin ?? ""}
      />
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:disabled:bg-neutral-800/50 dark:disabled:text-neutral-600"
      />
    </label>
  );
}

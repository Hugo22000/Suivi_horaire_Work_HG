"use client";

import { TRANSPORT_LABELS, type Transport, type TransportMode } from "@/lib/types";

const MODES: TransportMode[] = ["velib_navette", "voiture", "rer", "autre"];

export default function TransportSelector({
  value,
  onChange,
}: {
  value: Transport | undefined;
  onChange: (transport: Transport | undefined) => void;
}) {
  const transport: Transport = value ?? { mode: "voiture", depart: "", arrivee: "" };
  const active = Boolean(value);

  function update(patch: Partial<Transport>) {
    onChange({ ...transport, ...patch });
  }

  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => onChange(e.target.checked ? transport : undefined)}
            className="h-3.5 w-3.5"
          />
          Trajet renseigné
        </label>
      </div>

      {active && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            value={transport.mode}
            onChange={(e) => update({ mode: e.target.value as TransportMode })}
            className="col-span-2 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800 sm:col-span-1"
          >
            {MODES.map((m) => (
              <option key={m} value={m}>
                {TRANSPORT_LABELS[m]}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Point de départ"
            value={transport.depart}
            onChange={(e) => update({ depart: e.target.value })}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />

          <input
            type="text"
            placeholder="Point d'arrivée"
            value={transport.arrivee}
            onChange={(e) => update({ arrivee: e.target.value })}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />

          {transport.mode === "voiture" && (
            <input
              type="number"
              min={0}
              step={0.1}
              placeholder="Distance (km)"
              value={transport.distanceKm ?? ""}
              onChange={(e) =>
                update({ distanceKm: e.target.value === "" ? undefined : Number(e.target.value) })
              }
              className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            />
          )}

          {transport.mode === "autre" && (
            <input
              type="text"
              placeholder="Préciser la solution"
              value={transport.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
              className="col-span-2 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800 sm:col-span-2"
            />
          )}
        </div>
      )}
    </div>
  );
}

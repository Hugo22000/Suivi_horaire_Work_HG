import type { DayEntry as PrismaDayEntry } from "@prisma/client";
import type { DayEntry, LeaveStatus, Transport } from "./types";

export function toDayEntry(row: PrismaDayEntry): DayEntry {
  return {
    date: row.date,
    matinDebut: row.matinDebut,
    matinFin: row.matinFin,
    apremDebut: row.apremDebut,
    apremFin: row.apremFin,
    leave: (row.leave as LeaveStatus) ?? "none",
    transport: (row.transport as Transport | null) ?? undefined,
    notes: row.notes ?? undefined,
  };
}

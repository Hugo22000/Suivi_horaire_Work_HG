import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DayEntry, Transport } from "./types";

interface TrackerState {
  entries: Record<string, DayEntry>;
  setDayField: (
    date: string,
    field: "matinDebut" | "matinFin" | "apremDebut" | "apremFin" | "notes",
    value: string
  ) => void;
  setTransport: (date: string, transport: Transport | undefined) => void;
  clearDay: (date: string) => void;
  getDay: (date: string) => DayEntry | undefined;
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      entries: {},
      setDayField: (date, field, value) =>
        set((state) => {
          const existing = state.entries[date] ?? {
            date,
            matinDebut: "",
            matinFin: "",
            apremDebut: "",
            apremFin: "",
          };
          return {
            entries: {
              ...state.entries,
              [date]: { ...existing, [field]: value },
            },
          };
        }),
      setTransport: (date, transport) =>
        set((state) => {
          const existing = state.entries[date] ?? {
            date,
            matinDebut: "",
            matinFin: "",
            apremDebut: "",
            apremFin: "",
          };
          return {
            entries: {
              ...state.entries,
              [date]: { ...existing, transport },
            },
          };
        }),
      clearDay: (date) =>
        set((state) => {
          const next = { ...state.entries };
          delete next[date];
          return { entries: next };
        }),
      getDay: (date) => get().entries[date],
    }),
    {
      name: "suivi-horaire-work-hg",
    }
  )
);

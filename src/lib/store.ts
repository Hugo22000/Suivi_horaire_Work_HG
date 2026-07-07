import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyDayEntry, type DayEntry, type LeaveStatus, type Transport } from "./types";

interface TrackerState {
  entries: Record<string, DayEntry>;
  showWeekends: boolean;
  setShowWeekends: (value: boolean) => void;
  setDayField: (
    date: string,
    field: "matinDebut" | "matinFin" | "apremDebut" | "apremFin" | "notes",
    value: string
  ) => void;
  setTransport: (date: string, transport: Transport | undefined) => void;
  setLeave: (date: string, leave: LeaveStatus) => void;
  setWeekLeave: (dates: string[], leave: LeaveStatus) => void;
  clearDay: (date: string) => void;
  getDay: (date: string) => DayEntry | undefined;
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      entries: {},
      showWeekends: true,
      setShowWeekends: (value) => set({ showWeekends: value }),
      setDayField: (date, field, value) =>
        set((state) => {
          const existing = state.entries[date] ?? emptyDayEntry(date);
          return {
            entries: {
              ...state.entries,
              [date]: { ...existing, [field]: value },
            },
          };
        }),
      setTransport: (date, transport) =>
        set((state) => {
          const existing = state.entries[date] ?? emptyDayEntry(date);
          return {
            entries: {
              ...state.entries,
              [date]: { ...existing, transport },
            },
          };
        }),
      setLeave: (date, leave) =>
        set((state) => {
          const existing = state.entries[date] ?? emptyDayEntry(date);
          return {
            entries: {
              ...state.entries,
              [date]: { ...existing, leave },
            },
          };
        }),
      setWeekLeave: (dates, leave) =>
        set((state) => {
          const nextEntries = { ...state.entries };
          for (const date of dates) {
            const existing = nextEntries[date] ?? emptyDayEntry(date);
            nextEntries[date] = { ...existing, leave };
          }
          return { entries: nextEntries };
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

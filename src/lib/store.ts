import { create } from "zustand";
import { emptyDayEntry, type DayEntry, type LeaveStatus, type Transport } from "./types";

const persistTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function schedulePersist(date: string, entry: DayEntry) {
  if (persistTimers[date]) clearTimeout(persistTimers[date]);
  persistTimers[date] = setTimeout(() => {
    delete persistTimers[date];
    fetch(`/api/entries/${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch(() => {});
  }, 400);
}

function deletePersisted(date: string) {
  if (persistTimers[date]) {
    clearTimeout(persistTimers[date]);
    delete persistTimers[date];
  }
  fetch(`/api/entries/${date}`, { method: "DELETE" }).catch(() => {});
}

interface TrackerState {
  entries: Record<string, DayEntry>;
  hydrate: (entries: Record<string, DayEntry>) => void;
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

export const useTrackerStore = create<TrackerState>((set, get) => ({
  entries: {},
  hydrate: (entries) => set({ entries }),
  setDayField: (date, field, value) => {
    set((state) => {
      const existing = state.entries[date] ?? emptyDayEntry(date);
      return { entries: { ...state.entries, [date]: { ...existing, [field]: value } } };
    });
    schedulePersist(date, get().entries[date]);
  },
  setTransport: (date, transport) => {
    set((state) => {
      const existing = state.entries[date] ?? emptyDayEntry(date);
      return { entries: { ...state.entries, [date]: { ...existing, transport } } };
    });
    schedulePersist(date, get().entries[date]);
  },
  setLeave: (date, leave) => {
    set((state) => {
      const existing = state.entries[date] ?? emptyDayEntry(date);
      return { entries: { ...state.entries, [date]: { ...existing, leave } } };
    });
    schedulePersist(date, get().entries[date]);
  },
  setWeekLeave: (dates, leave) => {
    set((state) => {
      const nextEntries = { ...state.entries };
      for (const date of dates) {
        const existing = nextEntries[date] ?? emptyDayEntry(date);
        nextEntries[date] = { ...existing, leave };
      }
      return { entries: nextEntries };
    });
    const { entries } = get();
    for (const date of dates) {
      schedulePersist(date, entries[date]);
    }
  },
  clearDay: (date) => {
    set((state) => {
      const next = { ...state.entries };
      delete next[date];
      return { entries: next };
    });
    deletePersisted(date);
  },
  getDay: (date) => get().entries[date],
}));

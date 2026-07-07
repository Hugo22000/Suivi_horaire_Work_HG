import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiPreferencesState {
  showWeekends: boolean;
  setShowWeekends: (value: boolean) => void;
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set) => ({
      showWeekends: true,
      setShowWeekends: (value) => set({ showWeekends: value }),
    }),
    { name: "suivi-horaire-ui-prefs" }
  )
);

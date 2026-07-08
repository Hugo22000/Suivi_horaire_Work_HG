"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import WeekView from "@/components/WeekView";
import CalendarView from "@/components/CalendarView";
import SummaryView from "@/components/SummaryView";
import ExportView from "@/components/ExportView";
import SettingsView from "@/components/SettingsView";
import { useTrackerStore } from "@/lib/store";
import type { DayEntry } from "@/lib/types";

type View = "saisie" | "calendrier" | "recapitulatif" | "export" | "parametres";

const NAV: [View, string][] = [
  ["saisie", "Saisie"],
  ["calendrier", "Calendrier"],
  ["recapitulatif", "Récapitulatif"],
  ["export", "Export"],
  ["parametres", "Paramètres"],
];

const LEGACY_LOCAL_STORAGE_KEY = "suivi-horaire-work-hg";

export default function AppShell({
  userEmail,
  initialEntries,
}: {
  userEmail: string;
  initialEntries: Record<string, DayEntry>;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("saisie");
  const [loggingOut, setLoggingOut] = useState(false);
  const hydrate = useTrackerStore((s) => s.hydrate);
  const didMigrate = useRef(false);
  const didHydrate = useRef(false);

  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    hydrate(initialEntries);
    // Only hydrate once on mount: initialEntries can change identity on
    // subsequent server re-renders (e.g. router.refresh()), and blindly
    // re-hydrating would clobber local edits not yet persisted to the server.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (didMigrate.current) return;
    didMigrate.current = true;
    if (Object.keys(initialEntries).length > 0) return;

    const raw = window.localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const legacyEntries = parsed?.state?.entries;
      if (!legacyEntries || Object.keys(legacyEntries).length === 0) return;

      fetch("/api/entries/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: legacyEntries }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.imported > 0) {
            hydrate(legacyEntries);
            window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
          }
        })
        .catch(() => {});
    } catch {
      // ignore malformed legacy data
    }
  }, [initialEntries, hydrate]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
            Suivi horaire
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Heures de travail et trajets, semaine par semaine
          </p>
        </div>
        <nav className="flex flex-wrap gap-1 rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
          {NAV.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setView(value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                view === value
                  ? "bg-indigo-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        <span>
          Connecté en tant que{" "}
          <span className="font-medium text-neutral-700 dark:text-neutral-200">{userEmail}</span>
        </span>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          {loggingOut ? "Déconnexion…" : "Se déconnecter"}
        </button>
      </div>

      <main className="flex-1">
        {view === "saisie" && <WeekView />}
        {view === "calendrier" && <CalendarView />}
        {view === "recapitulatif" && <SummaryView />}
        {view === "export" && <ExportView />}
        {view === "parametres" && <SettingsView />}
      </main>

      <footer className="pt-4 text-center text-xs text-neutral-400 dark:text-neutral-600">
        Vos données sont sauvegardées sur votre compte.
      </footer>
    </div>
  );
}

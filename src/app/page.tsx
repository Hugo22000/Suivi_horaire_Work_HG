"use client";

import { useState } from "react";
import WeekView from "@/components/WeekView";
import CalendarView from "@/components/CalendarView";
import SummaryView from "@/components/SummaryView";

type View = "saisie" | "calendrier" | "recapitulatif";

const NAV: [View, string][] = [
  ["saisie", "Saisie"],
  ["calendrier", "Calendrier"],
  ["recapitulatif", "Récapitulatif"],
];

export default function Home() {
  const [view, setView] = useState<View>("saisie");

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
        <nav className="flex gap-1 rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
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

      <main className="flex-1">
        {view === "saisie" && <WeekView />}
        {view === "calendrier" && <CalendarView />}
        {view === "recapitulatif" && <SummaryView />}
      </main>

      <footer className="pt-4 text-center text-xs text-neutral-400 dark:text-neutral-600">
        Les données sont enregistrées localement dans votre navigateur.
      </footer>
    </div>
  );
}

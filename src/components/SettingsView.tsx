"use client";

import { useState } from "react";
import { useUiPreferencesStore } from "@/lib/uiStore";

export default function SettingsView() {
  return (
    <div className="space-y-4">
      <DisplaySettings />
      <PasswordSettings />
    </div>
  );
}

function DisplaySettings() {
  const showWeekends = useUiPreferencesStore((s) => s.showWeekends);
  const setShowWeekends = useUiPreferencesStore((s) => s.setShowWeekends);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">Affichage</h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Préférences d&apos;affichage de la Saisie et du Calendrier.
      </p>

      <label className="mt-4 flex w-fit items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
        <input
          type="checkbox"
          checked={!showWeekends}
          onChange={(e) => setShowWeekends(!e.target.checked)}
          className="h-3.5 w-3.5"
        />
        Jours ouvrés uniquement (masquer samedi et dimanche)
      </label>
    </div>
  );
}

function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setStatus("error");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus("done");
    } catch {
      setError("Impossible de contacter le serveur.");
      setStatus("error");
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
        Changer le mot de passe
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 max-w-sm space-y-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
            Mot de passe actuel
          </span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
            Nouveau mot de passe
          </span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
            Confirmer le nouveau mot de passe
          </span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </label>

        {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
        {status === "done" && (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Mot de passe mis à jour.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "Mise à jour…" : "Mettre à jour le mot de passe"}
        </button>
      </form>
    </div>
  );
}

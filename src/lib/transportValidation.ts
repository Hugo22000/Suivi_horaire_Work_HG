import type { Transport } from "./types";

export function sanitizeTransport(value: unknown): Transport | null {
  if (!value || typeof value !== "object") return null;
  const t = value as Record<string, unknown>;
  if (typeof t.mode !== "string" || typeof t.depart !== "string" || typeof t.arrivee !== "string") {
    return null;
  }
  return {
    mode: t.mode as Transport["mode"],
    depart: t.depart,
    arrivee: t.arrivee,
    distanceKm: typeof t.distanceKm === "number" ? t.distanceKm : undefined,
    description: typeof t.description === "string" ? t.description : undefined,
    heureDepartMaison: typeof t.heureDepartMaison === "string" ? t.heureDepartMaison : undefined,
    heureArriveeMaison: typeof t.heureArriveeMaison === "string" ? t.heureArriveeMaison : undefined,
  };
}

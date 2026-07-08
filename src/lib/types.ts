export type TransportMode = "velib_navette" | "voiture" | "rer" | "autre";

export const TRANSPORT_LABELS: Record<TransportMode, string> = {
  velib_navette: "Vélib + Navette",
  voiture: "Voiture",
  rer: "RER",
  autre: "Autre solution",
};

export const TRANSPORT_ICONS: Record<TransportMode, string> = {
  velib_navette: "🚲",
  voiture: "🚗",
  rer: "🚆",
  autre: "❓",
};

export interface Transport {
  mode: TransportMode;
  depart: string;
  arrivee: string;
  distanceKm?: number;
  description?: string;
  heureDepartMaison?: string; // format HH:mm — départ de la maison le matin
  heureArriveeMaison?: string; // format HH:mm — arrivée à la maison le soir
}

export type LeaveStatus = "none" | "full" | "morning" | "afternoon";

export const LEAVE_LABELS: Record<LeaveStatus, string> = {
  none: "Travaillé",
  full: "Congé (journée complète)",
  morning: "Congé (matin)",
  afternoon: "Congé (après-midi)",
};

export interface DayEntry {
  date: string; // format YYYY-MM-DD
  matinDebut: string; // format HH:mm
  matinFin: string;
  apremDebut: string;
  apremFin: string;
  transport?: Transport;
  notes?: string;
  leave?: LeaveStatus;
}

export const emptyTransport = (): Transport => ({
  mode: "voiture",
  depart: "",
  arrivee: "",
});

export const emptyDayEntry = (date: string): DayEntry => ({
  date,
  matinDebut: "",
  matinFin: "",
  apremDebut: "",
  apremFin: "",
});

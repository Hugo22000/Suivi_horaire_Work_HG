import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  startOfYear,
  endOfYear,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { DayEntry } from "./types";

export const WEEK_OPTIONS = { weekStartsOn: 1 as const, locale: fr };

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromISODate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, WEEK_OPTIONS);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isWeekendDay(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function filterVisibleDays(days: Date[], showWeekends: boolean): Date[] {
  return showWeekends ? days : days.filter((d) => !isWeekendDay(d));
}

export function getWeekStart(anchor: Date): Date {
  return startOfWeek(anchor, WEEK_OPTIONS);
}

export function getWeekEnd(anchor: Date): Date {
  return endOfWeek(anchor, WEEK_OPTIONS);
}

export function shiftWeek(anchor: Date, delta: number): Date {
  return addWeeks(anchor, delta);
}

export function shiftMonth(anchor: Date, delta: number): Date {
  return addMonths(anchor, delta);
}

export function shiftYear(anchor: Date, delta: number): Date {
  return addYears(anchor, delta);
}

export function getMonthDays(anchor: Date): Date[] {
  const startMonth = startOfMonth(anchor);
  const endMonth = endOfMonth(anchor);
  const start = startOfWeek(startMonth, WEEK_OPTIONS);
  const end = endOfWeek(endMonth, WEEK_OPTIONS);
  const days: Date[] = [];
  let cur = start;
  while (cur <= end) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
}

export function isInMonth(date: Date, anchor: Date): boolean {
  return isSameMonth(date, anchor);
}

export function getYearMonths(anchor: Date): Date[] {
  const start = startOfYear(anchor);
  return Array.from({ length: 12 }, (_, i) => addMonths(start, i));
}

export function getYearBounds(anchor: Date): { start: Date; end: Date } {
  return { start: startOfYear(anchor), end: endOfYear(anchor) };
}

export function formatWeekLabel(anchor: Date): string {
  const start = getWeekStart(anchor);
  const end = getWeekEnd(anchor);
  const weekNum = format(start, "I", { locale: fr });
  return `Semaine ${weekNum} — ${format(start, "d MMM", { locale: fr })} au ${format(
    end,
    "d MMM yyyy",
    { locale: fr }
  )}`;
}

export function formatMonthLabel(anchor: Date): string {
  return format(anchor, "MMMM yyyy", { locale: fr });
}

export function formatDayLabel(date: Date): string {
  return format(date, "EEEE d MMMM", { locale: fr });
}

export function formatDayShort(date: Date): string {
  return format(date, "EEE dd/MM", { locale: fr });
}

/** Minutes between two "HH:mm" strings. Returns 0 if invalid or end <= start. */
export function minutesBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : 0;
}

export function dayTotalMinutes(entry: DayEntry | undefined): number {
  if (!entry) return 0;
  const leave = entry.leave ?? "none";
  if (leave === "full" || leave === "ferie") return 0;
  const morning = leave === "morning" ? 0 : minutesBetween(entry.matinDebut, entry.matinFin);
  const afternoon = leave === "afternoon" ? 0 : minutesBetween(entry.apremDebut, entry.apremFin);
  return morning + afternoon;
}

/** Total commute time for a day: home → work in the morning, work → home in the evening. */
export function dayCommuteMinutes(entry: DayEntry | undefined): number {
  if (!entry?.transport) return 0;
  const morning = minutesBetween(entry.transport.heureDepartMaison ?? "", entry.matinDebut);
  const evening = minutesBetween(entry.apremFin, entry.transport.heureArriveeMaison ?? "");
  return morning + evening;
}

export function formatMinutesAsHours(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (totalMinutes <= 0) return "0h00";
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export function formatHoursDecimal(totalMinutes: number): string {
  return (totalMinutes / 60).toFixed(2);
}

export type TimeFieldKey = "matinDebut" | "matinFin" | "apremDebut" | "apremFin";

export interface DayValidationError {
  field: TimeFieldKey;
  message: string;
}

/** Validates the coherence of a day's time fields (independent of leave status). */
export function validateDayTimes(
  entry: Pick<DayEntry, "matinDebut" | "matinFin" | "apremDebut" | "apremFin">
): DayValidationError[] {
  const errors: DayValidationError[] = [];

  if (entry.matinDebut && entry.matinFin && entry.matinFin <= entry.matinDebut) {
    errors.push({ field: "matinFin", message: "La fin de matinée doit être après le début." });
  }
  if (entry.apremDebut && entry.apremFin && entry.apremFin <= entry.apremDebut) {
    errors.push({ field: "apremFin", message: "La fin d'après-midi doit être après le début." });
  }
  if (entry.matinFin && entry.apremDebut && entry.apremDebut < entry.matinFin) {
    errors.push({
      field: "apremDebut",
      message: "Le début d'après-midi doit être après la fin de matinée.",
    });
  }

  return errors;
}

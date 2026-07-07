import { startOfMonth, startOfYear } from "date-fns";
import { dayTotalMinutes, fromISODate, getWeekStart, toISODate } from "./time";
import type { DayEntry } from "./types";

export interface PeriodTotal {
  key: string;
  start: Date;
  totalMinutes: number;
  daysWorked: number;
  daysOnLeave: number;
}

function aggregateBy(
  entries: Record<string, DayEntry>,
  keyFor: (date: Date) => { key: string; start: Date }
): PeriodTotal[] {
  const map = new Map<string, PeriodTotal>();

  for (const entry of Object.values(entries)) {
    const minutes = dayTotalMinutes(entry);
    const leave = entry.leave ?? "none";
    if (minutes <= 0 && leave === "none") continue;

    const date = fromISODate(entry.date);
    const { key, start } = keyFor(date);
    const existing = map.get(key) ?? { key, start, totalMinutes: 0, daysWorked: 0, daysOnLeave: 0 };
    existing.totalMinutes += minutes;
    if (minutes > 0) existing.daysWorked += 1;
    if (leave !== "none") existing.daysOnLeave += 1;
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.start.getTime() - a.start.getTime());
}

export function aggregateByWeek(entries: Record<string, DayEntry>): PeriodTotal[] {
  return aggregateBy(entries, (date) => {
    const start = getWeekStart(date);
    return { key: toISODate(start), start };
  });
}

export function aggregateByMonth(entries: Record<string, DayEntry>): PeriodTotal[] {
  return aggregateBy(entries, (date) => {
    const start = startOfMonth(date);
    return { key: toISODate(start), start };
  });
}

export function monthsForYear(entries: Record<string, DayEntry>, year: number): PeriodTotal[] {
  const months = aggregateByMonth(entries);
  const start = startOfYear(new Date(year, 0, 1));
  const result: PeriodTotal[] = [];
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(start.getFullYear(), i, 1);
    const key = toISODate(monthDate);
    const found = months.find((m) => m.key === key);
    result.push(found ?? { key, start: monthDate, totalMinutes: 0, daysWorked: 0, daysOnLeave: 0 });
  }
  return result;
}

export function availableYears(entries: Record<string, DayEntry>): number[] {
  const years = new Set<number>();
  for (const entry of Object.values(entries)) {
    const leave = entry.leave ?? "none";
    if (dayTotalMinutes(entry) > 0 || leave !== "none") {
      years.add(fromISODate(entry.date).getFullYear());
    }
  }
  years.add(new Date().getFullYear());
  return Array.from(years).sort((a, b) => b - a);
}

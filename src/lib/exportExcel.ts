import { aggregateByMonth, aggregateByWeek } from "./aggregate";
import { dayTotalMinutes, formatHoursDecimal, formatMonthLabel, formatWeekLabel, fromISODate, minutesBetween, toISODate } from "./time";
import { LEAVE_LABELS, TRANSPORT_LABELS, type DayEntry } from "./types";

const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF4F46E5" } };
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" } };

export async function exportEntriesToExcel(
  entries: Record<string, DayEntry>,
  year: number | "all"
) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Suivi horaire";
  workbook.created = new Date();

  const filteredEntries = Object.fromEntries(
    Object.entries(entries).filter(
      ([date]) => year === "all" || fromISODate(date).getFullYear() === year
    )
  );

  buildDailySheet(workbook, filteredEntries);
  buildWeeklySheet(workbook, filteredEntries);
  buildMonthlySheet(workbook, filteredEntries);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const suffix = year === "all" ? "toutes-annees" : String(year);
  link.download = `suivi-horaire-${suffix}-${toISODate(new Date())}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function styleHeader(row: import("exceljs").Row) {
  row.font = HEADER_FONT;
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
  });
}

function buildDailySheet(workbook: import("exceljs").Workbook, entries: Record<string, DayEntry>) {
  const sheet = workbook.addWorksheet("Détail journalier");
  sheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Jour", key: "jour", width: 12 },
    { header: "Début matin", key: "matinDebut", width: 12 },
    { header: "Fin matin", key: "matinFin", width: 12 },
    { header: "Début après-midi", key: "apremDebut", width: 16 },
    { header: "Fin après-midi", key: "apremFin", width: 16 },
    { header: "Total (h)", key: "total", width: 10 },
    { header: "Congé", key: "conge", width: 20 },
    { header: "Moyen de transport", key: "transport", width: 18 },
    { header: "Point de départ", key: "depart", width: 18 },
    { header: "Point d'arrivée", key: "arrivee", width: 18 },
    { header: "Distance (km)", key: "distance", width: 13 },
    { header: "Départ maison (matin)", key: "departMaison", width: 18 },
    { header: "Trajet matin (h)", key: "trajetMatin", width: 14 },
    { header: "Arrivée maison (soir)", key: "arriveeMaison", width: 18 },
    { header: "Trajet soir (h)", key: "trajetSoir", width: 14 },
    { header: "Précision (autre)", key: "autre", width: 22 },
  ];
  styleHeader(sheet.getRow(1));

  const sortedDates = Object.keys(entries).sort();
  for (const date of sortedDates) {
    const entry = entries[date];
    const totalMinutes = dayTotalMinutes(entry);
    const leave = entry.leave ?? "none";
    if (totalMinutes <= 0 && !entry.transport && leave === "none") continue;

    const morningCommute = minutesBetween(entry.transport?.heureDepartMaison ?? "", entry.matinDebut);
    const eveningCommute = minutesBetween(entry.apremFin, entry.transport?.heureArriveeMaison ?? "");

    sheet.addRow({
      date,
      jour: fromISODate(date).toLocaleDateString("fr-FR", { weekday: "long" }),
      matinDebut: entry.matinDebut,
      matinFin: entry.matinFin,
      apremDebut: entry.apremDebut,
      apremFin: entry.apremFin,
      total: totalMinutes > 0 ? Number(formatHoursDecimal(totalMinutes)) : "",
      conge: leave === "none" ? "" : LEAVE_LABELS[leave],
      transport: entry.transport ? TRANSPORT_LABELS[entry.transport.mode] : "",
      depart: entry.transport?.depart ?? "",
      arrivee: entry.transport?.arrivee ?? "",
      distance: entry.transport?.distanceKm ?? "",
      departMaison: entry.transport?.heureDepartMaison ?? "",
      trajetMatin: morningCommute > 0 ? Number(formatHoursDecimal(morningCommute)) : "",
      arriveeMaison: entry.transport?.heureArriveeMaison ?? "",
      trajetSoir: eveningCommute > 0 ? Number(formatHoursDecimal(eveningCommute)) : "",
      autre: entry.transport?.description ?? "",
    });
  }
}

function buildWeeklySheet(workbook: import("exceljs").Workbook, entries: Record<string, DayEntry>) {
  const sheet = workbook.addWorksheet("Récap semaine");
  sheet.columns = [
    { header: "Semaine", key: "semaine", width: 42 },
    { header: "Jours travaillés", key: "jours", width: 16 },
    { header: "Jours de congé", key: "conges", width: 16 },
    { header: "Total heures", key: "total", width: 14 },
    { header: "Moyenne / jour (h)", key: "moyenne", width: 18 },
  ];
  styleHeader(sheet.getRow(1));

  const weeks = aggregateByWeek(entries).sort((a, b) => a.start.getTime() - b.start.getTime());
  for (const week of weeks) {
    sheet.addRow({
      semaine: formatWeekLabel(week.start),
      jours: week.daysWorked,
      conges: week.daysOnLeave,
      total: Number(formatHoursDecimal(week.totalMinutes)),
      moyenne: week.daysWorked > 0 ? Number(formatHoursDecimal(week.totalMinutes / week.daysWorked)) : "",
    });
  }
}

function buildMonthlySheet(workbook: import("exceljs").Workbook, entries: Record<string, DayEntry>) {
  const sheet = workbook.addWorksheet("Récap mois");
  sheet.columns = [
    { header: "Mois", key: "mois", width: 20 },
    { header: "Jours travaillés", key: "jours", width: 16 },
    { header: "Jours de congé", key: "conges", width: 16 },
    { header: "Total heures", key: "total", width: 14 },
    { header: "Moyenne / jour (h)", key: "moyenne", width: 18 },
  ];
  styleHeader(sheet.getRow(1));

  const months = aggregateByMonth(entries).sort((a, b) => a.start.getTime() - b.start.getTime());
  for (const month of months) {
    sheet.addRow({
      mois: formatMonthLabel(month.start),
      jours: month.daysWorked,
      conges: month.daysOnLeave,
      total: Number(formatHoursDecimal(month.totalMinutes)),
      moyenne: month.daysWorked > 0 ? Number(formatHoursDecimal(month.totalMinutes / month.daysWorked)) : "",
    });
  }
}

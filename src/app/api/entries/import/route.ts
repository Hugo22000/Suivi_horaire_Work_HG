import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sanitizeTransport } from "@/lib/transportValidation";
import type { LeaveStatus } from "@/lib/types";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const LEAVE_VALUES: LeaveStatus[] = ["none", "full", "morning", "afternoon"];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const entries = body?.entries;
  if (!entries || typeof entries !== "object") {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const existingCount = await prisma.dayEntry.count({ where: { userId: session.userId } });
  if (existingCount > 0) {
    return NextResponse.json(
      { error: "Des données existent déjà pour ce compte, import ignoré." },
      { status: 409 }
    );
  }

  const rows = Object.entries(entries as Record<string, Record<string, unknown>>)
    .filter(([date]) => DATE_REGEX.test(date))
    .map(([date, entry]) => {
      const leave: LeaveStatus = LEAVE_VALUES.includes(entry.leave as LeaveStatus)
        ? (entry.leave as LeaveStatus)
        : "none";
      const transport = sanitizeTransport(entry.transport);
      return {
        userId: session.userId,
        date,
        matinDebut: typeof entry.matinDebut === "string" ? entry.matinDebut : "",
        matinFin: typeof entry.matinFin === "string" ? entry.matinFin : "",
        apremDebut: typeof entry.apremDebut === "string" ? entry.apremDebut : "",
        apremFin: typeof entry.apremFin === "string" ? entry.apremFin : "",
        leave,
        transport: (transport ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
        notes: typeof entry.notes === "string" ? entry.notes : null,
      };
    });

  if (rows.length === 0) {
    return NextResponse.json({ imported: 0 });
  }

  await prisma.dayEntry.createMany({ data: rows });
  return NextResponse.json({ imported: rows.length });
}

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { toDayEntry } from "@/lib/entryMapper";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sanitizeTransport } from "@/lib/transportValidation";
import type { LeaveStatus } from "@/lib/types";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const LEAVE_VALUES: LeaveStatus[] = ["none", "full", "morning", "afternoon"];

export async function PUT(request: Request, { params }: { params: Promise<{ date: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { date } = await params;
  if (!DATE_REGEX.test(date)) {
    return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const leave: LeaveStatus = LEAVE_VALUES.includes(body.leave) ? body.leave : "none";
  const transport = sanitizeTransport(body.transport);

  const data = {
    matinDebut: typeof body.matinDebut === "string" ? body.matinDebut : "",
    matinFin: typeof body.matinFin === "string" ? body.matinFin : "",
    apremDebut: typeof body.apremDebut === "string" ? body.apremDebut : "",
    apremFin: typeof body.apremFin === "string" ? body.apremFin : "",
    leave,
    transport: (transport ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
    notes: typeof body.notes === "string" ? body.notes : null,
  };

  const row = await prisma.dayEntry.upsert({
    where: { userId_date: { userId: session.userId, date } },
    update: data,
    create: { ...data, userId: session.userId, date },
  });

  return NextResponse.json({ entry: toDayEntry(row) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { date } = await params;
  if (!DATE_REGEX.test(date)) {
    return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  }

  await prisma.dayEntry.deleteMany({ where: { userId: session.userId, date } });
  return NextResponse.json({ ok: true });
}

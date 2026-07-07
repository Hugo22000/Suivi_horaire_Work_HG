import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { toDayEntry } from "@/lib/entryMapper";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { DayEntry } from "@/lib/types";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const rows = await prisma.dayEntry.findMany({ where: { userId: session.userId } });
  const initialEntries: Record<string, DayEntry> = {};
  for (const row of rows) {
    initialEntries[row.date] = toDayEntry(row);
  }

  return <AppShell userEmail={session.email} initialEntries={initialEntries} />;
}

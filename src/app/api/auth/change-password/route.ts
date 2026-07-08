import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IMPERSONATION_COOKIE } from "@/lib/session-lo";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lo = await prisma.loanOfficer.findUnique({ where: { id } });
  if (!lo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const res = NextResponse.json({ success: true });
  res.cookies.set(IMPERSONATION_COOKIE, lo.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
  return res;
}

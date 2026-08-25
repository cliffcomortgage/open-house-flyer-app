import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendLoanOfficerWelcomeEmail } from "@/lib/email";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if ((session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lo = await prisma.loanOfficer.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!lo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (lo.user.password) {
    return NextResponse.json(
      { error: "This loan officer has already set their password" },
      { status: 400 }
    );
  }

  const passwordSetToken = randomBytes(32).toString("hex");
  const passwordSetExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: lo.userId },
    data: { passwordSetToken, passwordSetExpiresAt },
  });

  try {
    await sendLoanOfficerWelcomeEmail({
      toEmail: lo.user.email,
      loName: `${lo.firstName} ${lo.lastName}`,
      setPasswordToken: passwordSetToken,
      baseUrl: process.env.NEXTAUTH_URL || req.nextUrl.origin,
    });
  } catch (err) {
    console.error("Failed to resend loan officer welcome email:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

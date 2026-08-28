import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSessionLoanOfficerId } from "@/lib/session-lo";
import { sendRealtorInviteEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loId = await getSessionLoanOfficerId(session);
  if (!loId) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const lo = await prisma.loanOfficer.findUnique({ where: { id: loId } });
  const realtor = await prisma.realtor.findFirst({
    where: { id, loanOfficerId: loId },
    include: { user: true },
  });
  if (!realtor || !lo) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  if (!realtor.user) {
    return NextResponse.json({ error: "This realtor hasn't been invited yet" }, { status: 400 });
  }
  if (realtor.user.password) {
    return NextResponse.json({ error: "This realtor has already set their password" }, { status: 400 });
  }

  const passwordSetToken = randomBytes(32).toString("hex");
  const passwordSetExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: realtor.user.id },
    data: { passwordSetToken, passwordSetExpiresAt },
  });

  try {
    await sendRealtorInviteEmail({
      toEmail: realtor.user.email,
      realtorName: `${realtor.firstName} ${realtor.lastName}`,
      loName: `${lo.firstName} ${lo.lastName}`,
      setPasswordToken: passwordSetToken,
      baseUrl: process.env.NEXTAUTH_URL || req.nextUrl.origin,
    });
  } catch (err) {
    console.error("Failed to resend realtor invite email:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

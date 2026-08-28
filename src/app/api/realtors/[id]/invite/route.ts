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
  const realtor = await prisma.realtor.findFirst({ where: { id, loanOfficerId: loId } });
  if (!realtor || !lo) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  if (!realtor.email) {
    return NextResponse.json(
      { error: "Add an email address for this realtor before inviting them" },
      { status: 400 }
    );
  }

  if (realtor.userId) {
    return NextResponse.json(
      { error: "This realtor has already been invited" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email: realtor.email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordSetToken = randomBytes(32).toString("hex");
  const passwordSetExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: realtor.email!,
        password: null,
        role: "REALTOR",
        isActive: true,
        passwordSetToken,
        passwordSetExpiresAt,
      },
    });
    return tx.realtor.update({
      where: { id: realtor.id },
      data: { userId: user.id },
    });
  });

  try {
    await sendRealtorInviteEmail({
      toEmail: realtor.email,
      realtorName: `${realtor.firstName} ${realtor.lastName}`,
      loName: `${lo.firstName} ${lo.lastName}`,
      setPasswordToken: passwordSetToken,
      baseUrl: process.env.NEXTAUTH_URL || req.nextUrl.origin,
    });
  } catch (err) {
    console.error("Failed to send realtor invite email:", err);
  }

  return NextResponse.json(updated);
}

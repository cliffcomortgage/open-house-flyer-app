import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

// Always returns a generic success response, regardless of whether the email
// matched an account, so this endpoint can't be used to enumerate users.
const GENERIC_RESPONSE = {
  message: "If an account exists for that email, we've sent a password reset link.",
};

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { loanOfficer: true, realtor: true },
  });

  if (!user || !user.isActive || !user.password) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const name = user.loanOfficer
    ? `${user.loanOfficer.firstName} ${user.loanOfficer.lastName}`
    : user.realtor
      ? `${user.realtor.firstName} ${user.realtor.lastName}`
      : "there";

  const resetToken = randomBytes(32).toString("hex");
  const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordSetToken: resetToken, passwordSetExpiresAt: resetExpiresAt },
  });

  try {
    await sendPasswordResetEmail({
      toEmail: user.email,
      name,
      resetToken,
      baseUrl: process.env.NEXTAUTH_URL || req.nextUrl.origin,
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }

  return NextResponse.json(GENERIC_RESPONSE);
}

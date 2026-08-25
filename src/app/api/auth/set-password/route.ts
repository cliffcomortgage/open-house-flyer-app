import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { passwordSetToken: token } });

  if (!user || !user.passwordSetExpiresAt || user.passwordSetExpiresAt < new Date()) {
    return NextResponse.json(
      { error: "This link is invalid or has expired. Ask your administrator to resend an invite." },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordSetToken: null,
      passwordSetExpiresAt: null,
    },
  });

  return NextResponse.json({ success: true });
}

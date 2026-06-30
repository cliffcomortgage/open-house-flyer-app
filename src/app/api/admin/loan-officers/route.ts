import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if ((session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const loanOfficers = await prisma.loanOfficer.findMany({
    include: {
      user: { select: { email: true, isActive: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(loanOfficers);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    email, password, firstName, lastName, title,
    nmlsNumber, officePhone, cellPhone, branchAddress, branchNmls, headshotUrl,
  } = body;

  if (!email || !password || !firstName || !lastName || !nmlsNumber) {
    return NextResponse.json(
      { error: "email, password, firstName, lastName, and nmlsNumber are required" },
      { status: 400 }
    );
  }

  // Check if email is already taken
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "LO",
          isActive: true,
        },
      });

      const lo = await tx.loanOfficer.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          title: title || "Loan Officer",
          nmlsNumber,
          email,
          officePhone: officePhone || null,
          cellPhone: cellPhone || null,
          branchAddress: branchAddress || null,
          branchNmls: branchNmls || null,
          headshotUrl: headshotUrl || null,
        },
        include: {
          user: { select: { email: true, isActive: true, role: true } },
        },
      });

      return lo;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("Create LO error:", err);
    return NextResponse.json({ error: "Failed to create loan officer" }, { status: 500 });
  }
}

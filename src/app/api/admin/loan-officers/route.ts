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

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const loanOfficers = await prisma.loanOfficer.findMany({
    include: {
      user: { select: { email: true, isActive: true, role: true, password: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const withHasPassword = loanOfficers.map((lo) => ({
    ...lo,
    user: {
      email: lo.user.email,
      isActive: lo.user.isActive,
      role: lo.user.role,
      hasPassword: lo.user.password !== null,
    },
  }));

  return NextResponse.json(withHasPassword);
}

function assembleBranchAddress(street?: string, suite?: string, city?: string, state?: string, zip?: string): string | null {
  const parts: string[] = [];
  if (street?.trim()) parts.push(street.trim());
  if (suite?.trim()) parts.push(`Suite ${suite.trim()}`);
  if (city?.trim()) parts.push(city.trim());
  const stateZip = [state?.trim(), zip?.trim()].filter(Boolean).join(" ");
  if (stateZip) parts.push(stateZip);
  return parts.join(", ") || null;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    email, firstName, lastName, title,
    nmlsNumber, officePhone, cellPhone, website,
    branchStreet, branchSuite, branchCity, branchState, branchZip,
    branchNmls, headshotUrl,
  } = body;

  if (!email || !firstName || !lastName || !nmlsNumber) {
    return NextResponse.json(
      { error: "email, firstName, lastName, and nmlsNumber are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordSetToken = randomBytes(32).toString("hex");
  const passwordSetExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const branchAddress = assembleBranchAddress(branchStreet, branchSuite, branchCity, branchState, branchZip);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: null,
          role: "LO",
          isActive: true,
          passwordSetToken,
          passwordSetExpiresAt,
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
          website: website || null,
          branchAddress,
          branchStreet: branchStreet || null,
          branchSuite: branchSuite || null,
          branchCity: branchCity || null,
          branchState: branchState || null,
          branchZip: branchZip || null,
          branchNmls: branchNmls || null,
          headshotUrl: headshotUrl || null,
        },
        include: {
          user: { select: { email: true, isActive: true, role: true } },
        },
      });

      return lo;
    });

    try {
      await sendLoanOfficerWelcomeEmail({
        toEmail: email,
        loName: `${firstName} ${lastName}`,
        setPasswordToken: passwordSetToken,
        baseUrl: process.env.NEXTAUTH_URL || req.nextUrl.origin,
      });
    } catch (err) {
      console.error("Failed to send loan officer welcome email:", err);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("Create LO error:", err);
    return NextResponse.json({ error: "Failed to create loan officer" }, { status: 500 });
  }
}

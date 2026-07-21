import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function assembleBranchAddress(street?: string, suite?: string, city?: string, state?: string, zip?: string): string | null {
  const parts: string[] = [];
  if (street?.trim()) parts.push(street.trim());
  if (suite?.trim()) parts.push(`Suite ${suite.trim()}`);
  if (city?.trim()) parts.push(city.trim());
  const stateZip = [state?.trim(), zip?.trim()].filter(Boolean).join(" ");
  if (stateZip) parts.push(stateZip);
  return parts.join(", ") || null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const lo = await prisma.loanOfficer.findUnique({
    where: { userId },
    include: { user: { select: { email: true, isActive: true } } },
  });

  if (!lo) {
    return NextResponse.json({ error: "Loan officer not found" }, { status: 404 });
  }

  return NextResponse.json(lo);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const lo = await prisma.loanOfficer.findUnique({ where: { userId } });
  if (!lo) {
    return NextResponse.json({ error: "Loan officer not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    firstName, lastName, title, nmlsNumber,
    officePhone, cellPhone, email, website,
    branchStreet, branchSuite, branchCity, branchState, branchZip,
    branchNmls, disclaimer, headshotUrl,
  } = body;

  const branchAddress = assembleBranchAddress(branchStreet, branchSuite, branchCity, branchState, branchZip);

  const updated = await prisma.loanOfficer.update({
    where: { id: lo.id },
    data: {
      firstName, lastName, title, nmlsNumber,
      officePhone: officePhone || null,
      cellPhone: cellPhone || null,
      email,
      website: website || null,
      branchAddress,
      branchStreet: branchStreet || null,
      branchSuite: branchSuite || null,
      branchCity: branchCity || null,
      branchState: branchState || null,
      branchZip: branchZip || null,
      branchNmls: branchNmls || null,
      disclaimer: disclaimer || null,
      headshotUrl: headshotUrl || null,
    },
    include: { user: { select: { email: true, isActive: true } } },
  });

  return NextResponse.json(updated);
}

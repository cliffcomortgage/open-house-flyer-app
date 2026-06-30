import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if ((session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lo = await prisma.loanOfficer.findUnique({
    where: { id },
    include: { user: { select: { email: true, isActive: true, role: true } } },
  });

  if (!lo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lo);
}

export async function PUT(
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

  const body = await req.json();
  const {
    firstName, lastName, title, nmlsNumber, email,
    officePhone, cellPhone, website, branchAddress, branchNmls, disclaimer,
    headshotUrl, isActive,
  } = body;

  const [updated] = await prisma.$transaction([
    prisma.loanOfficer.update({
      where: { id },
      data: {
        firstName: firstName ?? lo.firstName,
        lastName: lastName ?? lo.lastName,
        title: title ?? lo.title,
        nmlsNumber: nmlsNumber ?? lo.nmlsNumber,
        email: email ?? lo.email,
        officePhone: officePhone !== undefined ? (officePhone || null) : lo.officePhone,
        cellPhone: cellPhone !== undefined ? (cellPhone || null) : lo.cellPhone,
        website: website !== undefined ? (website || null) : lo.website,
        branchAddress: branchAddress !== undefined ? (branchAddress || null) : lo.branchAddress,
        branchNmls: branchNmls !== undefined ? (branchNmls || null) : lo.branchNmls,
        disclaimer: disclaimer !== undefined ? (disclaimer || null) : lo.disclaimer,
        headshotUrl: headshotUrl !== undefined ? (headshotUrl || null) : lo.headshotUrl,
      },
      include: { user: { select: { email: true, isActive: true, role: true } } },
    }),
    ...(isActive !== undefined
      ? [
          prisma.user.update({
            where: { id: lo.userId },
            data: { isActive: !!isActive },
          }),
        ]
      : []),
  ]);

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lo = await prisma.loanOfficer.findUnique({ where: { id } });
  if (!lo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cascade: deleting the user will delete the LoanOfficer due to onDelete: Cascade
  await prisma.user.delete({ where: { id: lo.userId } });

  return NextResponse.json({ success: true });
}

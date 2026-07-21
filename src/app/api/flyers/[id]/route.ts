import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getLO(userId: string) {
  return prisma.loanOfficer.findUnique({ where: { userId } });
}

async function getOwnedFlyer(flyerId: string, loId: string) {
  return prisma.flyer.findFirst({
    where: { id: flyerId, loanOfficerId: loId },
    include: {
      loanOfficer: {
        include: { user: { select: { email: true, isActive: true } } },
      },
      realtor: true,
    },
  });
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lo = await getLO((session.user as any).id);
  if (!lo) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const flyer = await getOwnedFlyer(id, lo.id);
  if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  return NextResponse.json(flyer);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lo = await getLO((session.user as any).id);
  if (!lo) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const existing = await getOwnedFlyer(id, lo.id);
  if (!existing) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  const body = await req.json();
  const {
    templateId, title, propertyData, realtorId,
    loanScenarios, qrCodeData, status, distributionState,
  } = body;

  if (realtorId) {
    const realtor = await prisma.realtor.findFirst({
      where: { id: realtorId, loanOfficerId: lo.id },
    });
    if (!realtor) {
      return NextResponse.json({ error: "Realtor not found" }, { status: 400 });
    }
  }

  const updated = await prisma.flyer.update({
    where: { id },
    data: {
      templateId: templateId || existing.templateId,
      title: title ?? existing.title,
      propertyData: propertyData !== undefined ? propertyData : existing.propertyData,
      realtorId: realtorId !== undefined ? (realtorId || null) : existing.realtorId,
      loanScenarios: loanScenarios !== undefined ? loanScenarios : existing.loanScenarios,
      qrCodeData: qrCodeData !== undefined ? qrCodeData : existing.qrCodeData,
      status: status || existing.status,
      distributionState: distributionState !== undefined ? (distributionState || null) : existing.distributionState,
    },
    include: {
      loanOfficer: {
        include: { user: { select: { email: true, isActive: true } } },
      },
      realtor: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lo = await getLO((session.user as any).id);
  if (!lo) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const existing = await getOwnedFlyer(id, lo.id);
  if (!existing) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  await prisma.flyer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

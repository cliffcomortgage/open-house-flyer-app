import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSessionRealtorId } from "@/lib/session-realtor";
import { FLYER_TEMPLATES } from "@/types";

const PROPERTY_ONLY_TEMPLATE_IDS = FLYER_TEMPLATES.filter((t) => !t.hasLoanScenarios).map((t) => t.id);

async function getOwnedFlyer(flyerId: string, realtorId: string) {
  return prisma.flyer.findFirst({
    where: { id: flyerId, realtorId },
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

  const realtorId = await getSessionRealtorId(session);
  if (!realtorId) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  const flyer = await getOwnedFlyer(id, realtorId);
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

  const realtorId = await getSessionRealtorId(session);
  if (!realtorId) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  const existing = await getOwnedFlyer(id, realtorId);
  if (!existing) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  const body = await req.json();
  const { templateId, title, propertyData, qrCodeData, status, distributionState } = body;

  if (templateId && !PROPERTY_ONLY_TEMPLATE_IDS.includes(templateId)) {
    return NextResponse.json(
      { error: "That template isn't available for realtor-created flyers" },
      { status: 400 }
    );
  }

  const updated = await prisma.flyer.update({
    where: { id },
    data: {
      templateId: templateId || existing.templateId,
      title: title ?? existing.title,
      propertyData: propertyData !== undefined ? propertyData : existing.propertyData,
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

  const realtorId = await getSessionRealtorId(session);
  if (!realtorId) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  const existing = await getOwnedFlyer(id, realtorId);
  if (!existing) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  await prisma.flyer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

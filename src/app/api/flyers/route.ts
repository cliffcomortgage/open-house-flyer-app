import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateShareToken } from "@/lib/utils";
import { getSessionLoanOfficerId } from "@/lib/session-lo";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loId = await getSessionLoanOfficerId(session);
  if (!loId) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const flyers = await prisma.flyer.findMany({
    where: { loanOfficerId: loId },
    include: {
      realtor: {
        select: { firstName: true, lastName: true, companyName: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(flyers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loId = await getSessionLoanOfficerId(session);
  if (!loId) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const body = await req.json();
  const {
    templateId, title, propertyData, realtorId,
    loanScenarios, qrCodeData, status, distributionState,
  } = body;

  // Validate realtor ownership if provided
  if (realtorId) {
    const realtor = await prisma.realtor.findFirst({
      where: { id: realtorId, loanOfficerId: loId },
    });
    if (!realtor) {
      return NextResponse.json({ error: "Realtor not found" }, { status: 400 });
    }
  }

  const shareToken = generateShareToken();

  const flyer = await prisma.flyer.create({
    data: {
      loanOfficerId: loId,
      templateId,
      title: title || null,
      propertyData: propertyData || undefined,
      realtorId: realtorId || null,
      loanScenarios: loanScenarios || undefined,
      qrCodeData: qrCodeData || null,
      shareToken,
      status: status || "DRAFT",
      distributionState: distributionState || null,
    },
  });

  return NextResponse.json(flyer, { status: 201 });
}

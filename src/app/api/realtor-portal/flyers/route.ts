import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateShareToken } from "@/lib/utils";
import { getSessionRealtorId } from "@/lib/session-realtor";
import { FLYER_TEMPLATES } from "@/types";

const PROPERTY_ONLY_TEMPLATE_IDS = FLYER_TEMPLATES.filter((t) => !t.hasLoanScenarios).map((t) => t.id);

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const realtorId = await getSessionRealtorId(session);
  if (!realtorId) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  const flyers = await prisma.flyer.findMany({
    where: { realtorId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(flyers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const realtorId = await getSessionRealtorId(session);
  if (!realtorId) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  const realtor = await prisma.realtor.findUnique({ where: { id: realtorId } });
  if (!realtor) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  const body = await req.json();
  const { templateId, title, propertyData, qrCodeData, status, distributionState } = body;

  if (!PROPERTY_ONLY_TEMPLATE_IDS.includes(templateId)) {
    return NextResponse.json(
      { error: "That template isn't available for realtor-created flyers" },
      { status: 400 }
    );
  }

  const shareToken = generateShareToken();

  const flyer = await prisma.flyer.create({
    data: {
      loanOfficerId: realtor.loanOfficerId,
      realtorId: realtor.id,
      templateId,
      title: title || null,
      propertyData: propertyData || undefined,
      qrCodeData: qrCodeData || null,
      shareToken,
      status: status || "DRAFT",
      distributionState: distributionState || null,
    },
  });

  return NextResponse.json(flyer, { status: 201 });
}

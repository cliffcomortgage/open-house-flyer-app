import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateShareToken } from "@/lib/utils";

async function getLO(userId: string) {
  return prisma.loanOfficer.findUnique({ where: { userId } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lo = await getLO((session.user as any).id);
  if (!lo) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const flyers = await prisma.flyer.findMany({
    where: { loanOfficerId: lo.id },
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

  const lo = await getLO((session.user as any).id);
  if (!lo) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const body = await req.json();
  const {
    templateId, title, propertyData, realtorId,
    loanScenarios, qrCodeData, status,
  } = body;

  // Validate realtor ownership if provided
  if (realtorId) {
    const realtor = await prisma.realtor.findFirst({
      where: { id: realtorId, loanOfficerId: lo.id },
    });
    if (!realtor) {
      return NextResponse.json({ error: "Realtor not found" }, { status: 400 });
    }
  }

  const shareToken = generateShareToken();

  const flyer = await prisma.flyer.create({
    data: {
      loanOfficerId: lo.id,
      templateId,
      title: title || null,
      propertyData: propertyData || undefined,
      realtorId: realtorId || null,
      loanScenarios: loanScenarios || undefined,
      qrCodeData: qrCodeData || null,
      shareToken,
      status: status || "DRAFT",
    },
  });

  return NextResponse.json(flyer, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if ((session.user as any).role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { error } = await requireAdmin();
  if (error) return error;

  const flyer = await prisma.flyer.findUnique({
    where: { id },
    include: {
      loanOfficer: {
        include: {
          user: { select: { email: true, isActive: true } },
          realtors: { orderBy: { createdAt: "desc" } },
        },
      },
      realtor: true,
    },
  });

  if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  return NextResponse.json(flyer);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { error, session } = await requireAdmin();
  if (error) return error;

  const flyer = await prisma.flyer.findUnique({ where: { id } });
  if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  const body = await req.json();
  const {
    decision, reviewNotes, loanScenarios,
    templateId, propertyData, realtorId, qrCodeData, distributionState,
  } = body as {
    decision?: "APPROVED" | "REJECTED";
    reviewNotes?: string;
    loanScenarios?: unknown;
    templateId?: string;
    propertyData?: unknown;
    realtorId?: string | null;
    qrCodeData?: string | null;
    distributionState?: string | null;
  };

  if (decision !== undefined && decision !== "APPROVED" && decision !== "REJECTED") {
    return NextResponse.json({ error: "decision must be APPROVED or REJECTED" }, { status: 400 });
  }

  if (realtorId) {
    const realtor = await prisma.realtor.findFirst({
      where: { id: realtorId, loanOfficerId: flyer.loanOfficerId },
    });
    if (!realtor) {
      return NextResponse.json({ error: "Realtor not found" }, { status: 400 });
    }
  }

  // decision is optional: omitting it just saves the edited fields
  // (e.g. "Apply Changes") without recording an approve/reject verdict.
  const updated = await prisma.flyer.update({
    where: { id },
    data: {
      ...(reviewNotes !== undefined ? { reviewNotes: reviewNotes || null } : {}),
      ...(loanScenarios !== undefined ? { loanScenarios: loanScenarios as any } : {}),
      ...(templateId !== undefined ? { templateId } : {}),
      ...(propertyData !== undefined ? { propertyData: propertyData as any } : {}),
      ...(realtorId !== undefined ? { realtorId: realtorId || null } : {}),
      ...(qrCodeData !== undefined ? { qrCodeData: qrCodeData || null } : {}),
      ...(distributionState !== undefined ? { distributionState: distributionState || null } : {}),
      ...(decision
        ? {
            approvalStatus: decision,
            reviewedAt: new Date(),
            reviewedByUserId: (session!.user as any).id,
          }
        : {}),
    },
    include: {
      loanOfficer: {
        include: {
          user: { select: { email: true, isActive: true } },
          realtors: { orderBy: { createdAt: "desc" } },
        },
      },
      realtor: true,
    },
  });

  return NextResponse.json(updated);
}

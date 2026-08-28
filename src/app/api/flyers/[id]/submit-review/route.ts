import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendComplianceReviewRequestEmail } from "@/lib/email";
import { getSessionLoanOfficerId } from "@/lib/session-lo";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loId = await getSessionLoanOfficerId(session);
  if (!loId) return NextResponse.json({ error: "LO not found" }, { status: 404 });
  const lo = await prisma.loanOfficer.findUnique({ where: { id: loId } });
  if (!lo) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const flyer = await prisma.flyer.findFirst({ where: { id, loanOfficerId: lo.id } });
  if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  const scenarios = (flyer.loanScenarios as any[]) || [];
  if (scenarios.length === 0) {
    return NextResponse.json(
      { error: "This flyer has no loan scenarios — nothing requires compliance review" },
      { status: 400 }
    );
  }

  if (flyer.status !== "SAVED") {
    return NextResponse.json(
      { error: "Save the flyer before submitting it for compliance review" },
      { status: 400 }
    );
  }

  const updated = await prisma.flyer.update({
    where: { id },
    data: {
      approvalStatus: "PENDING",
      submittedForReviewAt: new Date(),
      reviewedAt: null,
      reviewNotes: null,
    },
    include: {
      loanOfficer: { include: { user: { select: { email: true, isActive: true } } } },
      realtor: true,
    },
  });

  const pd = (flyer.propertyData as any) || {};
  const address = pd.address ? `${pd.address}${pd.city ? `, ${pd.city}` : ""}` : flyer.title || "Untitled property";

  try {
    await sendComplianceReviewRequestEmail({
      flyerId: id,
      address,
      loName: `${lo.firstName} ${lo.lastName}`,
      baseUrl: process.env.NEXTAUTH_URL || req.nextUrl.origin,
    });
  } catch (err) {
    console.error("Failed to send compliance review notification email:", err);
  }

  return NextResponse.json(updated);
}

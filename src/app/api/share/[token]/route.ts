import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const flyer = await prisma.flyer.findUnique({
    where: { shareToken: token },
    include: {
      loanOfficer: {
        include: { user: { select: { email: true, isActive: true } } },
      },
      realtor: true,
    },
  });

  if (!flyer) {
    return NextResponse.json({ error: "Flyer not found" }, { status: 404 });
  }

  const scenarios = (flyer.loanScenarios as any[]) || [];
  if (scenarios.length > 0 && flyer.approvalStatus !== "APPROVED") {
    return NextResponse.json({ error: "pending_review" }, { status: 403 });
  }

  return NextResponse.json(flyer);
}

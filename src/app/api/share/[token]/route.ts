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

  return NextResponse.json(flyer);
}

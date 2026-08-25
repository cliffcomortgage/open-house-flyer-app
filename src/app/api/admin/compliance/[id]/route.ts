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
      loanOfficer: { include: { user: { select: { email: true, isActive: true } } } },
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
  const { decision, reviewNotes, loanScenarios } = body as {
    decision: "APPROVED" | "REJECTED";
    reviewNotes?: string;
    loanScenarios?: unknown;
  };

  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return NextResponse.json({ error: "decision must be APPROVED or REJECTED" }, { status: 400 });
  }

  const updated = await prisma.flyer.update({
    where: { id },
    data: {
      approvalStatus: decision,
      reviewedAt: new Date(),
      reviewedByUserId: (session!.user as any).id,
      reviewNotes: reviewNotes ?? null,
      ...(loanScenarios !== undefined ? { loanScenarios: loanScenarios as any } : {}),
    },
  });

  return NextResponse.json(updated);
}

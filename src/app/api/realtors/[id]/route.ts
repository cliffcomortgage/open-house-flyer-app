import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getLO(userId: string) {
  return prisma.loanOfficer.findUnique({ where: { userId } });
}

async function getOwnedRealtor(realtorId: string, loId: string) {
  return prisma.realtor.findFirst({
    where: { id: realtorId, loanOfficerId: loId },
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

  const realtor = await getOwnedRealtor(id, lo.id);
  if (!realtor) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  return NextResponse.json(realtor);
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

  const existing = await getOwnedRealtor(id, lo.id);
  if (!existing) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  const body = await req.json();
  const {
    firstName, lastName, title, companyName,
    officePhone, cellPhone, email, website, officeAddress,
    headshotUrl, companyLogoUrl, brandPrimary, brandSecondary,
  } = body;

  const updated = await prisma.realtor.update({
    where: { id },
    data: {
      firstName, lastName,
      title: title || "Realtor",
      companyName,
      officePhone: officePhone || null,
      cellPhone: cellPhone || null,
      email: email || null,
      website: website || null,
      officeAddress: officeAddress || null,
      headshotUrl: headshotUrl ?? existing.headshotUrl,
      companyLogoUrl: companyLogoUrl ?? existing.companyLogoUrl,
      brandPrimary: brandPrimary || null,
      brandSecondary: brandSecondary || null,
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

  const existing = await getOwnedRealtor(id, lo.id);
  if (!existing) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  await prisma.realtor.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

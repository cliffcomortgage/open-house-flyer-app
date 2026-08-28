import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSessionLoanOfficerId } from "@/lib/session-lo";

async function getOwnedRealtor(realtorId: string, loId: string) {
  return prisma.realtor.findFirst({
    where: { id: realtorId, loanOfficerId: loId },
  });
}

function assembleOfficeAddress(street?: string, suite?: string, city?: string, state?: string, zip?: string): string | null {
  const parts: string[] = [];
  if (street?.trim()) parts.push(street.trim());
  if (suite?.trim()) parts.push(`Suite ${suite.trim()}`);
  if (city?.trim()) parts.push(city.trim());
  const stateZip = [state?.trim(), zip?.trim()].filter(Boolean).join(" ");
  if (stateZip) parts.push(stateZip);
  return parts.join(", ") || null;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loId = await getSessionLoanOfficerId(session);
  if (!loId) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const realtor = await getOwnedRealtor(id, loId);
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

  const loId = await getSessionLoanOfficerId(session);
  if (!loId) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const existing = await getOwnedRealtor(id, loId);
  if (!existing) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  const body = await req.json();
  const {
    firstName, lastName, title, companyName,
    officePhone, cellPhone, email, website,
    officeStreet, officeSuite, officeCity, officeState, officeZip,
    headshotUrl, companyLogoUrl, brandPrimary, brandSecondary,
  } = body;

  const officeAddress = assembleOfficeAddress(officeStreet, officeSuite, officeCity, officeState, officeZip);

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
      officeAddress,
      officeStreet: officeStreet || null,
      officeSuite: officeSuite || null,
      officeCity: officeCity || null,
      officeState: officeState || null,
      officeZip: officeZip || null,
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

  const loId = await getSessionLoanOfficerId(session);
  if (!loId) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const existing = await getOwnedRealtor(id, loId);
  if (!existing) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  await prisma.realtor.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

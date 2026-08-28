import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSessionRealtorId } from "@/lib/session-realtor";

function assembleOfficeAddress(street?: string, suite?: string, city?: string, state?: string, zip?: string): string | null {
  const parts: string[] = [];
  if (street?.trim()) parts.push(street.trim());
  if (suite?.trim()) parts.push(`Suite ${suite.trim()}`);
  if (city?.trim()) parts.push(city.trim());
  const stateZip = [state?.trim(), zip?.trim()].filter(Boolean).join(" ");
  if (stateZip) parts.push(stateZip);
  return parts.join(", ") || null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const realtorId = await getSessionRealtorId(session);
  if (!realtorId) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  const realtor = await prisma.realtor.findUnique({
    where: { id: realtorId },
    include: {
      user: { select: { email: true, isActive: true } },
      loanOfficer: { select: { firstName: true, lastName: true, title: true, email: true, officePhone: true, cellPhone: true } },
    },
  });

  if (!realtor) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });
  return NextResponse.json(realtor);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const realtorId = await getSessionRealtorId(session);
  if (!realtorId) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  const existing = await prisma.realtor.findUnique({ where: { id: realtorId } });
  if (!existing) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  const body = await req.json();
  const {
    firstName, lastName, title, companyName,
    officePhone, cellPhone, website,
    officeStreet, officeSuite, officeCity, officeState, officeZip,
    headshotUrl, companyLogoUrl, brandPrimary, brandSecondary,
  } = body;

  const officeAddress = assembleOfficeAddress(officeStreet, officeSuite, officeCity, officeState, officeZip);

  const updated = await prisma.realtor.update({
    where: { id: realtorId },
    data: {
      firstName, lastName,
      title: title || "Realtor",
      companyName,
      officePhone: officePhone || null,
      cellPhone: cellPhone || null,
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

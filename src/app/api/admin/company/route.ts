import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if ((session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  // Company settings are readable by authenticated users (needed for flyer footers)
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let company = await prisma.company.findFirst();

  // Create default company record if none exists
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Cliffco, Inc.",
        primaryColor: "#6633cc",
        secondaryColor: "#0d0d0d",
      },
    });
  }

  return NextResponse.json(company);
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    name, website, phone, primaryColor, secondaryColor, logoUrl, logoUrlLight, licenseText,
    standardDisclaimer, stateDisclaimers,
  } = body;

  let company = await prisma.company.findFirst();

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: name || "Cliffco, Inc.",
        primaryColor: primaryColor || "#6633cc",
        secondaryColor: secondaryColor || "#0d0d0d",
        website: website || null,
        phone: phone || null,
        logoUrl: logoUrl || null,
        logoUrlLight: logoUrlLight || null,
        licenseText: licenseText || null,
        standardDisclaimer: standardDisclaimer || null,
        stateDisclaimers: stateDisclaimers ?? undefined,
      },
    });
  } else {
    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        name: name ?? company.name,
        primaryColor: primaryColor ?? company.primaryColor,
        secondaryColor: secondaryColor ?? company.secondaryColor,
        website: website !== undefined ? (website || null) : company.website,
        phone: phone !== undefined ? (phone || null) : company.phone,
        logoUrl: logoUrl !== undefined ? (logoUrl || null) : company.logoUrl,
        logoUrlLight: logoUrlLight !== undefined ? (logoUrlLight || null) : company.logoUrlLight,
        licenseText: licenseText !== undefined ? (licenseText || null) : company.licenseText,
        standardDisclaimer: standardDisclaimer !== undefined ? (standardDisclaimer || null) : company.standardDisclaimer,
        stateDisclaimers: stateDisclaimers !== undefined ? stateDisclaimers : company.stateDisclaimers,
      },
    });
  }

  return NextResponse.json(company);
}

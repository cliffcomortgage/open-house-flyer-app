import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { detectBrand } from "@/lib/real-estate-brands";

async function getLO(userId: string) {
  return prisma.loanOfficer.findUnique({ where: { userId } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lo = await getLO((session.user as any).id);
  if (!lo) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const realtors = await prisma.realtor.findMany({
    where: { loanOfficerId: lo.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(realtors);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lo = await getLO((session.user as any).id);
  if (!lo) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const body = await req.json();
  const {
    firstName, lastName, title, companyName,
    officePhone, cellPhone, email, website, officeAddress,
    headshotUrl, companyLogoUrl, brandPrimary, brandSecondary,
  } = body;

  // Auto-detect brand colors if not provided
  let primary = brandPrimary || null;
  let secondary = brandSecondary || null;
  if (!primary && companyName) {
    const brand = detectBrand(companyName);
    if (brand) {
      primary = brand.primaryColor;
      secondary = brand.secondaryColor;
    }
  }

  const realtor = await prisma.realtor.create({
    data: {
      loanOfficerId: lo.id,
      firstName,
      lastName,
      title: title || "Realtor",
      companyName,
      officePhone: officePhone || null,
      cellPhone: cellPhone || null,
      email: email || null,
      website: website || null,
      officeAddress: officeAddress || null,
      headshotUrl: headshotUrl || null,
      companyLogoUrl: companyLogoUrl || null,
      brandPrimary: primary,
      brandSecondary: secondary,
    },
  });

  return NextResponse.json(realtor, { status: 201 });
}

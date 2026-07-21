import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const flyers = await prisma.flyer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      loanOfficer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nmlsNumber: true,
          branchState: true,
          email: true,
        },
      },
      realtor: {
        select: { firstName: true, lastName: true, companyName: true },
      },
    },
  });

  return NextResponse.json(flyers);
}

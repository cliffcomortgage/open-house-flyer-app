import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { flyerIds }: { flyerIds: string[] } = body;

  if (!flyerIds?.length) {
    return NextResponse.json({ error: "No flyer IDs provided" }, { status: 400 });
  }

  const flyers = await prisma.flyer.findMany({
    where: { id: { in: flyerIds } },
    include: {
      loanOfficer: { include: { user: { select: { email: true, isActive: true } } } },
      realtor: true,
    },
  });

  const cookieHeader = req.headers.get("cookie") || "";
  const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;

  try {
    const puppeteer = await import("puppeteer");
    const JSZip = (await import("jszip")).default;

    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const zip = new JSZip();

    for (const flyer of flyers) {
      const pd = (flyer.propertyData as any) || {};
      if (!flyer.propertyData) {
        console.warn(`Skipping flyer ${flyer.id} in compliance export: missing property data`);
        continue;
      }

      const page = await browser.newPage();
      if (cookieHeader) await page.setExtraHTTPHeaders({ Cookie: cookieHeader });
      await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
      await page.goto(`${baseUrl}/print/flyers/${flyer.id}`, { waitUntil: "networkidle0" });
      const pdfUint8 = await page.pdf({
        width: "8.5in",
        height: "11in",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });
      await page.close();

      const loName = `${flyer.loanOfficer.firstName} ${flyer.loanOfficer.lastName}`;
      const address = pd.address || "unknown-address";
      const state = flyer.distributionState || "XX";
      const safeAddress = address.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 40);
      const filename = `${state}_${safeAddress}_${loName.replace(/\s+/g, "-")}.pdf`;

      zip.file(filename, Buffer.from(pdfUint8));
    }

    await browser.close();

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="compliance-flyers.zip"`,
      },
    });
  } catch (err) {
    console.error("Compliance export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

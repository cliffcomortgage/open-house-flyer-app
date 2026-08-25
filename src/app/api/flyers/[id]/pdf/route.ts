import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getLO(userId: string) {
  return prisma.loanOfficer.findUnique({ where: { userId } });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lo = await getLO((session.user as any).id);
  if (!lo) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const flyer = await prisma.flyer.findFirst({ where: { id, loanOfficerId: lo.id } });
  if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  const scenarios = (flyer.loanScenarios as any[]) || [];
  if (scenarios.length > 0 && flyer.approvalStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "This flyer includes loan scenarios pending compliance approval and cannot be downloaded until approved." },
      { status: 403 }
    );
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const printUrl = `${process.env.NEXTAUTH_URL || req.nextUrl.origin}/print/flyers/${id}`;

  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    if (cookieHeader) await page.setExtraHTTPHeaders({ Cookie: cookieHeader });
    await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
    await page.goto(printUrl, { waitUntil: "networkidle0" });
    const pdfUint8 = await page.pdf({
      width: "8.5in",
      height: "11in",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    const pdfBuffer = Buffer.from(pdfUint8);
    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="flyer-${id}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "PDF generation failed. Ensure puppeteer is installed." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  const flyer = await prisma.flyer.findUnique({ where: { shareToken: token } });
  if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  const scenarios = (flyer.loanScenarios as unknown[]) || [];
  if (scenarios.length > 0 && flyer.approvalStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "This flyer includes loan scenario details pending compliance approval." },
      { status: 403 }
    );
  }

  const printUrl = `${process.env.NEXTAUTH_URL || req.nextUrl.origin}/print/share/${token}`;

  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
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
        "Content-Disposition": `attachment; filename="flyer-${flyer.id}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Share PDF generation error:", err);
    return NextResponse.json({ error: "PDF generation failed." }, { status: 500 });
  }
}

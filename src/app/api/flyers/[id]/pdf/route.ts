import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatPhone } from "@/lib/utils";

async function getLO(userId: string) {
  return prisma.loanOfficer.findUnique({ where: { userId } });
}

function buildFlyerHTML(flyer: any, company: any): string {
  const pd = flyer.propertyData || {};
  const lo = flyer.loanOfficer;
  const realtor = flyer.realtor;
  const scenarios: any[] = flyer.loanScenarios || [];
  const primaryColor = realtor?.brandPrimary || company?.primaryColor || "#6633cc";
  const secondaryColor = realtor?.brandSecondary || company?.secondaryColor || "#0d0d0d";

  const statsRow = `
    <div style="display:flex;gap:24px;padding:12px 0;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin:12px 0;">
      ${pd.bedrooms ? `<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#1e293b;">${pd.bedrooms}</div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Beds</div></div>` : ""}
      ${pd.bathrooms ? `<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#1e293b;">${pd.bathrooms}</div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Baths</div></div>` : ""}
      ${pd.squareFeet ? `<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#1e293b;">${pd.squareFeet.toLocaleString()}</div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Sq Ft</div></div>` : ""}
      ${pd.yearBuilt ? `<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#1e293b;">${pd.yearBuilt}</div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Built</div></div>` : ""}
      ${pd.garage ? `<div style="text-align:center;"><div style="font-size:14px;font-weight:700;color:#1e293b;">${pd.garage}</div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Garage</div></div>` : ""}
    </div>
  `;

  const footer = `
    <div style="background:${primaryColor}15;border-top:3px solid ${primaryColor};padding:16px;margin-top:auto;">
      <div style="display:flex;gap:24px;justify-content:space-between;">
        ${realtor ? `
          <div style="display:flex;align-items:center;gap:12px;">
            ${realtor.headshotUrl ? `<img src="${realtor.headshotUrl}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;" />` : ""}
            <div>
              <div style="font-weight:700;font-size:13px;color:#1e293b;">${realtor.firstName} ${realtor.lastName}</div>
              <div style="font-size:11px;color:#475569;">${realtor.title} · ${realtor.companyName}</div>
              ${realtor.cellPhone ? `<div style="font-size:10px;color:#64748b;">${formatPhone(realtor.cellPhone)}</div>` : ""}
              ${realtor.email ? `<div style="font-size:10px;color:#64748b;">${realtor.email}</div>` : ""}
            </div>
          </div>
        ` : ""}
        ${lo ? `
          <div style="display:flex;align-items:center;gap:12px;">
            ${lo.headshotUrl ? `<img src="${lo.headshotUrl}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;" />` : ""}
            <div>
              <div style="font-weight:700;font-size:13px;color:#1e293b;">${lo.firstName} ${lo.lastName}</div>
              <div style="font-size:11px;color:#475569;">${lo.title}</div>
              <div style="font-size:10px;color:#64748b;">NMLS# ${lo.nmlsNumber}</div>
              ${lo.cellPhone ? `<div style="font-size:10px;color:#64748b;">${formatPhone(lo.cellPhone)}</div>` : ""}
              ${lo.email ? `<div style="font-size:10px;color:#64748b;">${lo.email}</div>` : ""}
            </div>
            ${company?.logoUrl ? `<img src="${company.logoUrl}" style="height:32px;object-fit:contain;margin-left:12px;" />` : ""}
          </div>
        ` : ""}
        ${flyer.qrCodeData ? `<div style="text-align:center;"><div style="width:60px;height:60px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:8px;color:#94a3b8;">QR</div><div style="font-size:9px;color:#64748b;margin-top:4px;">Scan to view</div></div>` : ""}
      </div>
      ${lo?.disclaimer ? `<div style="font-size:8px;color:#94a3b8;margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.1);">${lo.disclaimer}</div>` : ""}
    </div>
  `;

  const scenarioColumns = scenarios.slice(0, 3).map((s: any) => `
    <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <div style="background:${primaryColor};color:white;padding:8px 12px;font-weight:700;font-size:12px;">${s.label || s.loanType}</div>
      <div style="padding:10px 12px;font-size:11px;">
        ${s.interestRate ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#64748b;">Rate</span><span style="font-weight:600;">${Number(s.interestRate).toFixed(3)}%</span></div>` : ""}
        ${s.apr ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#64748b;">APR</span><span style="font-weight:600;">${Number(s.apr).toFixed(3)}%</span></div>` : ""}
        ${s.downPaymentPercent ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#64748b;">Down</span><span style="font-weight:600;">${s.downPaymentPercent}%</span></div>` : ""}
        ${s.loanAmount ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#64748b;">Loan Amt</span><span style="font-weight:600;">${formatCurrency(s.loanAmount)}</span></div>` : ""}
        ${s.piPayment ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#64748b;">P&amp;I</span><span style="font-weight:600;">${formatCurrency(s.piPayment)}/mo</span></div>` : ""}
        ${s.taxesInsurance ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#64748b;">Tax+Ins</span><span style="font-weight:600;">${formatCurrency(s.taxesInsurance)}/mo</span></div>` : ""}
        ${s.miPayment ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#64748b;">MI</span><span style="font-weight:600;">${formatCurrency(s.miPayment)}/mo</span></div>` : ""}
        ${s.hoaFee ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#64748b;">HOA</span><span style="font-weight:600;">${formatCurrency(s.hoaFee)}/mo</span></div>` : ""}
        ${s.monthlyPayment ? `<div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid #e5e7eb;margin-top:4px;"><span style="color:#1e293b;font-weight:700;">Total</span><span style="font-weight:700;color:${primaryColor};">${formatCurrency(s.monthlyPayment)}/mo</span></div>` : ""}
      </div>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; width: 816px; background: white; }
  </style>
</head>
<body>
  <div style="width:816px;min-height:1056px;display:flex;flex-direction:column;background:white;">
    ${pd.photos?.[0] ? `
      <div style="position:relative;width:100%;height:400px;overflow:hidden;">
        <img src="${pd.photos[0]}" style="width:100%;height:100%;object-fit:cover;" />
        ${pd.openHouseDate ? `
          <div style="position:absolute;top:16px;left:16px;background:${primaryColor};color:white;padding:8px 16px;border-radius:8px;font-weight:700;font-size:13px;">
            OPEN HOUSE — ${new Date(pd.openHouseDate).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
            ${pd.openHouseStartTime ? ` · ${pd.openHouseStartTime}` : ""}${pd.openHouseEndTime ? ` – ${pd.openHouseEndTime}` : ""}
          </div>
        ` : ""}
      </div>
    ` : `<div style="height:200px;background:${primaryColor};display:flex;align-items:center;justify-content:center;"><span style="color:rgba(255,255,255,0.5);font-size:48px;">🏠</span></div>`}

    <div style="padding:24px;flex:1;display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
        <div>
          <div style="font-size:32px;font-weight:800;color:#1e293b;">${pd.price ? formatCurrency(pd.price) : "Call for Price"}</div>
          <div style="font-size:16px;color:#475569;margin-top:4px;">
            ${[pd.address, pd.city, pd.state].filter(Boolean).join(", ")} ${pd.zipCode || ""}
          </div>
        </div>
        <div style="background:${secondaryColor};color:white;padding:6px 14px;border-radius:8px;font-weight:700;font-size:12px;white-space:nowrap;">
          FOR SALE
        </div>
      </div>

      ${statsRow}

      ${pd.description ? `<div style="font-size:12px;color:#475569;line-height:1.6;">${pd.description}</div>` : ""}

      ${scenarios.length > 0 ? `
        <div>
          <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em;">Financing Options</div>
          <div style="display:flex;gap:12px;">${scenarioColumns}</div>
        </div>
      ` : ""}

      ${footer}
    </div>
  </div>
</body>
</html>`;
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lo = await getLO((session.user as any).id);
  if (!lo) return NextResponse.json({ error: "LO not found" }, { status: 404 });

  const flyer = await prisma.flyer.findFirst({
    where: { id, loanOfficerId: lo.id },
    include: {
      loanOfficer: { include: { user: { select: { email: true, isActive: true } } } },
      realtor: true,
    },
  });

  if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  const company = await prisma.company.findFirst();

  const html = buildFlyerHTML(flyer, company);

  try {
    // Dynamic import to avoid bundling puppeteer in edge runtime
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
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

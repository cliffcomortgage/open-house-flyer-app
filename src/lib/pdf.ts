import type { Flyer, CompanySettings } from "@/types";

export function buildFlyerHTML(
  flyer: Flyer,
  company: CompanySettings,
  qrCodeDataUrl: string | null
): string {
  const { realtor, loanOfficer, propertyData, loanScenarios, templateId } = flyer;

  const brandPrimary =
    realtor?.brandPrimary || company.primaryColor || "#6633cc";
  const brandSecondary =
    realtor?.brandSecondary || company.secondaryColor || "#0d0d0d";

  const formatCurrencyInline = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0 });

  const formatRateInline = (r: number) => r.toFixed(3) + "%";

  const addressLine = propertyData
    ? `${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zipCode}`
    : "";

  const photos = propertyData?.photos || [];
  const firstPhoto = photos[0] || "";

  const openHouseDate = propertyData?.openHouseDate
    ? new Date(propertyData.openHouseDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const openHouseTime =
    propertyData?.openHouseStartTime && propertyData?.openHouseEndTime
      ? `${propertyData.openHouseStartTime} - ${propertyData.openHouseEndTime}`
      : null;

  const loInfo = loanOfficer
    ? `
    <div style="display:flex;align-items:center;gap:12px;">
      ${loanOfficer.headshotUrl ? `<img src="${loanOfficer.headshotUrl}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;" />` : ""}
      <div>
        <div style="font-weight:700;font-size:14px;color:#6633cc;">${loanOfficer.firstName} ${loanOfficer.lastName}</div>
        <div style="font-size:11px;color:#555;">${loanOfficer.title}</div>
        <div style="font-size:11px;color:#555;">NMLS# ${loanOfficer.nmlsNumber}</div>
        ${loanOfficer.cellPhone ? `<div style="font-size:11px;color:#555;">📱 ${loanOfficer.cellPhone}</div>` : ""}
        ${loanOfficer.email ? `<div style="font-size:11px;color:#555;">✉ ${loanOfficer.email}</div>` : ""}
        ${loanOfficer.website ? `<div style="font-size:11px;color:#555;">🌐 ${loanOfficer.website}</div>` : ""}
      </div>
    </div>
    `
    : "";

  const realtorInfo = realtor
    ? `
    <div style="display:flex;align-items:center;gap:12px;">
      ${realtor.headshotUrl ? `<img src="${realtor.headshotUrl}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;" />` : ""}
      <div>
        ${realtor.companyLogoUrl ? `<img src="${realtor.companyLogoUrl}" style="max-height:30px;max-width:120px;object-fit:contain;margin-bottom:4px;" />` : ""}
        <div style="font-weight:700;font-size:14px;color:${brandPrimary};">${realtor.firstName} ${realtor.lastName}</div>
        <div style="font-size:11px;color:#555;">${realtor.title}</div>
        <div style="font-size:11px;color:#555;">${realtor.companyName}</div>
        ${realtor.cellPhone ? `<div style="font-size:11px;color:#555;">📱 ${realtor.cellPhone}</div>` : ""}
        ${realtor.email ? `<div style="font-size:11px;color:#555;">✉ ${realtor.email}</div>` : ""}
      </div>
    </div>
    `
    : "";

  const footer = `
    <div style="border-top:4px solid ${brandPrimary};padding:16px 24px;background:#f8f8f8;display:flex;justify-content:space-between;align-items:center;gap:16px;font-family:Arial,sans-serif;">
      ${realtorInfo}
      ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" style="width:70px;height:70px;" />` : ""}
      ${loInfo}
    </div>
    ${loanOfficer?.disclaimer ? `<div style="font-size:8px;color:#999;padding:4px 24px;font-family:Arial,sans-serif;">${loanOfficer.disclaimer}</div>` : ""}
  `;

  const statsRow = propertyData
    ? `
    <div style="display:flex;gap:24px;padding:12px 24px;background:#f0f0f0;font-family:Arial,sans-serif;">
      <span style="font-size:13px;"><b>${propertyData.bedrooms}</b> Beds</span>
      <span style="font-size:13px;"><b>${propertyData.bathrooms}</b> Baths</span>
      ${propertyData.squareFeet ? `<span style="font-size:13px;"><b>${propertyData.squareFeet.toLocaleString()}</b> sq ft</span>` : ""}
      ${propertyData.yearBuilt ? `<span style="font-size:13px;">Built <b>${propertyData.yearBuilt}</b></span>` : ""}
      ${propertyData.garage ? `<span style="font-size:13px;"><b>${propertyData.garage}</b> Garage</span>` : ""}
    </div>
    `
    : "";

  const scenarioCard = (s: any, index: number) => `
    <div style="flex:1;border:1px solid #ddd;border-radius:8px;overflow:hidden;font-family:Arial,sans-serif;">
      <div style="background:${brandPrimary};color:white;padding:10px 14px;font-size:13px;font-weight:700;">${s.label || `Scenario ${index + 1}`}</div>
      <div style="padding:12px 14px;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <tr><td style="color:#555;padding:3px 0;">Loan Type</td><td style="text-align:right;font-weight:600;">${s.loanType} ${s.term}-yr</td></tr>
          <tr><td style="color:#555;padding:3px 0;">Purchase Price</td><td style="text-align:right;font-weight:600;">${formatCurrencyInline(s.purchasePrice)}</td></tr>
          <tr><td style="color:#555;padding:3px 0;">Down Payment</td><td style="text-align:right;font-weight:600;">${s.downPaymentPercent}% (${formatCurrencyInline(s.downPaymentAmount)})</td></tr>
          <tr><td style="color:#555;padding:3px 0;">Loan Amount</td><td style="text-align:right;font-weight:600;">${formatCurrencyInline(s.loanAmount)}</td></tr>
          <tr><td style="color:#555;padding:3px 0;">Rate / APR</td><td style="text-align:right;font-weight:600;">${formatRateInline(s.interestRate)} / ${formatRateInline(s.apr)}</td></tr>
          ${s.piPayment ? `<tr><td style="color:#555;padding:3px 0;">P&I</td><td style="text-align:right;">${formatCurrencyInline(s.piPayment)}/mo</td></tr>` : ""}
          ${s.taxesInsurance ? `<tr><td style="color:#555;padding:3px 0;">Taxes & Ins.</td><td style="text-align:right;">${formatCurrencyInline(s.taxesInsurance)}/mo</td></tr>` : ""}
          ${s.miPayment ? `<tr><td style="color:#555;padding:3px 0;">MI</td><td style="text-align:right;">${formatCurrencyInline(s.miPayment)}/mo</td></tr>` : ""}
          ${s.hoaFee ? `<tr><td style="color:#555;padding:3px 0;">HOA</td><td style="text-align:right;">${formatCurrencyInline(s.hoaFee)}/mo</td></tr>` : ""}
          <tr style="border-top:2px solid ${brandPrimary};"><td style="font-weight:700;padding:6px 0;">Total Payment</td><td style="text-align:right;font-weight:700;font-size:14px;color:${brandPrimary};">${formatCurrencyInline(s.monthlyPayment)}/mo</td></tr>
        </table>
      </div>
    </div>
  `;

  let bodyHTML = "";

  if (templateId === "modern-minimal") {
    bodyHTML = `
      <div style="position:relative;width:100%;height:500px;overflow:hidden;">
        ${firstPhoto ? `<img src="${firstPhoto}" style="width:100%;height:100%;object-fit:cover;" />` : `<div style="width:100%;height:100%;background:#ccc;"></div>`}
        <div style="position:absolute;top:24px;left:0;background:${brandPrimary};color:white;padding:12px 28px;font-size:22px;font-weight:700;font-family:Arial,sans-serif;letter-spacing:4px;">OPEN HOUSE</div>
        ${openHouseDate ? `<div style="position:absolute;bottom:24px;right:24px;background:rgba(0,0,0,0.7);color:white;padding:8px 16px;font-size:14px;font-family:Arial,sans-serif;border-radius:4px;">${openHouseDate}${openHouseTime ? " · " + openHouseTime : ""}</div>` : ""}
      </div>
      <div style="padding:20px 24px;font-family:Arial,sans-serif;">
        <div style="font-size:28px;font-weight:700;color:#1a1a1a;">${propertyData ? formatCurrencyInline(propertyData.price) : ""}</div>
        <div style="font-size:16px;color:#555;margin-top:4px;">${addressLine}</div>
      </div>
      ${statsRow}
      ${propertyData?.description ? `<div style="padding:12px 24px;font-size:13px;color:#444;line-height:1.6;font-family:Arial,sans-serif;">${propertyData.description.substring(0, 300)}${propertyData.description.length > 300 ? "..." : ""}</div>` : ""}
      ${footer}
    `;
  } else if (templateId === "gallery-grid") {
    const gridPhotos = photos.slice(0, 4);
    while (gridPhotos.length < 4) gridPhotos.push("");
    bodyHTML = `
      <div style="background:${brandPrimary};color:white;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;font-family:Arial,sans-serif;">
        <div style="font-size:22px;font-weight:700;letter-spacing:3px;">OPEN HOUSE</div>
        ${openHouseDate ? `<div style="font-size:14px;">${openHouseDate}${openHouseTime ? " | " + openHouseTime : ""}</div>` : ""}
      </div>
      <div style="display:flex;gap:0;">
        <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;flex:2;gap:4px;height:480px;">
          ${gridPhotos.map((p) => `<div style="overflow:hidden;">${p ? `<img src="${p}" style="width:100%;height:100%;object-fit:cover;" />` : `<div style="width:100%;height:100%;background:#ddd;"></div>`}</div>`).join("")}
        </div>
        <div style="flex:1;padding:20px;font-family:Arial,sans-serif;border-left:1px solid #eee;">
          <div style="font-size:22px;font-weight:700;color:${brandPrimary};">${propertyData ? formatCurrencyInline(propertyData.price) : ""}</div>
          <div style="font-size:13px;color:#555;margin:4px 0 16px;">${addressLine}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
            ${propertyData ? `
            <div style="background:#f5f5f5;padding:8px;border-radius:4px;text-align:center;"><div style="font-weight:700;font-size:18px;">${propertyData.bedrooms}</div><div style="font-size:10px;color:#777;">BEDS</div></div>
            <div style="background:#f5f5f5;padding:8px;border-radius:4px;text-align:center;"><div style="font-weight:700;font-size:18px;">${propertyData.bathrooms}</div><div style="font-size:10px;color:#777;">BATHS</div></div>
            ${propertyData.squareFeet ? `<div style="background:#f5f5f5;padding:8px;border-radius:4px;text-align:center;"><div style="font-weight:700;font-size:18px;">${propertyData.squareFeet.toLocaleString()}</div><div style="font-size:10px;color:#777;">SQ FT</div></div>` : ""}
            ${propertyData.yearBuilt ? `<div style="background:#f5f5f5;padding:8px;border-radius:4px;text-align:center;"><div style="font-weight:700;font-size:18px;">${propertyData.yearBuilt}</div><div style="font-size:10px;color:#777;">YEAR BUILT</div></div>` : ""}
            ` : ""}
          </div>
          ${propertyData?.description ? `<div style="font-size:12px;color:#555;line-height:1.6;">${propertyData.description.substring(0, 250)}...</div>` : ""}
        </div>
      </div>
      ${footer}
    `;
  } else if (templateId === "showcase-one-rate") {
    const scenario = loanScenarios?.[0];
    bodyHTML = `
      <div style="position:relative;width:100%;height:380px;overflow:hidden;">
        ${firstPhoto ? `<img src="${firstPhoto}" style="width:100%;height:100%;object-fit:cover;" />` : `<div style="width:100%;height:100%;background:#ccc;"></div>`}
        <div style="position:absolute;top:0;left:0;right:0;background:${brandPrimary};opacity:0.9;color:white;padding:10px 20px;font-size:18px;font-weight:700;font-family:Arial,sans-serif;letter-spacing:3px;">OPEN HOUSE${openHouseDate ? " | " + openHouseDate : ""}</div>
      </div>
      <div style="padding:16px 24px;font-family:Arial,sans-serif;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:26px;font-weight:700;color:#1a1a1a;">${propertyData ? formatCurrencyInline(propertyData.price) : ""}</div>
          <div style="font-size:14px;color:#555;margin-top:2px;">${addressLine}</div>
          ${statsRow}
        </div>
        ${scenario ? `<div style="min-width:260px;">${scenarioCard(scenario, 0)}</div>` : ""}
      </div>
      ${footer}
    `;
  } else {
    const scenarios = loanScenarios?.slice(0, 3) || [];
    const stripPhotos = photos.slice(0, 3);
    bodyHTML = `
      <div style="display:flex;height:280px;gap:4px;">
        ${stripPhotos.map((p) => `<div style="flex:1;overflow:hidden;">${p ? `<img src="${p}" style="width:100%;height:100%;object-fit:cover;" />` : `<div style="width:100%;height:100%;background:#ddd;"></div>`}</div>`).join("")}
      </div>
      <div style="background:${brandPrimary};color:white;padding:12px 24px;font-family:Arial,sans-serif;">
        <div style="font-size:20px;font-weight:700;">${propertyData ? formatCurrencyInline(propertyData.price) : ""} · ${addressLine}</div>
        <div style="font-size:13px;margin-top:4px;">
          ${propertyData ? `${propertyData.bedrooms} Bed · ${propertyData.bathrooms} Bath${propertyData.squareFeet ? ` · ${propertyData.squareFeet.toLocaleString()} sq ft` : ""}` : ""}
          ${openHouseDate ? ` · Open House: ${openHouseDate}${openHouseTime ? " " + openHouseTime : ""}` : ""}
        </div>
      </div>
      ${scenarios.length > 0 ? `
      <div style="display:flex;gap:16px;padding:16px 24px;font-family:Arial,sans-serif;">
        ${scenarios.map((s, i) => scenarioCard(s, i)).join("")}
      </div>
      ` : ""}
      ${footer}
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; background: white; width: 816px; }
  img { display: block; max-width: 100%; }
</style>
</head>
<body>
${bodyHTML}
</body>
</html>`;
}

export async function generateFlyerPDF(html: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });

    const pdf = await page.pdf({
      width: "8.5in",
      height: "11in",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

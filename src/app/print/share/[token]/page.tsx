import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateQRCodeDataURL } from "@/lib/qr-code";
import { TemplateModernMinimal } from "@/components/flyer-templates/TemplateModernMinimal";
import { TemplateGalleryGrid } from "@/components/flyer-templates/TemplateGalleryGrid";
import { TemplateShowcaseOneRate } from "@/components/flyer-templates/TemplateShowcaseOneRate";
import { TemplateMarketLeader } from "@/components/flyer-templates/TemplateMarketLeader";
import type { Flyer, CompanySettings } from "@/types";

/**
 * Public, unauthenticated counterpart to /print/flyers/[id] — this is what
 * Puppeteer navigates to when generating a PDF from a public share link, so
 * it has to work without a session. Access is gated by the share token
 * itself (and the same pending-compliance check the share page/API use),
 * not by ownership.
 */
export default async function PrintSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const flyerRecord = await prisma.flyer.findUnique({
    where: { shareToken: token },
    include: {
      loanOfficer: { include: { user: { select: { email: true, isActive: true } } } },
      realtor: true,
    },
  });
  if (!flyerRecord) notFound();

  const scenarios = (flyerRecord.loanScenarios as unknown[]) || [];
  if (scenarios.length > 0 && flyerRecord.approvalStatus !== "APPROVED") notFound();

  const companyRecord = await prisma.company.findFirst();
  if (!companyRecord) notFound();

  const flyer: Flyer = JSON.parse(JSON.stringify(flyerRecord));
  const company: CompanySettings = JSON.parse(JSON.stringify(companyRecord));

  if (!flyer.loanOfficer || !flyer.propertyData) notFound();

  const qrCodeDataUrl = flyer.qrCodeData ? await generateQRCodeDataURL(flyer.qrCodeData) : null;

  const templateProps = {
    propertyData: flyer.propertyData,
    loanOfficer: flyer.loanOfficer,
    realtor: flyer.realtor || null,
    company,
    qrCodeDataUrl,
    loanScenarios: flyer.loanScenarios || undefined,
    distributionState: flyer.distributionState,
  };

  switch (flyer.templateId) {
    case "gallery-grid":
      return <TemplateGalleryGrid {...templateProps} />;
    case "showcase-one-rate":
      return <TemplateShowcaseOneRate {...templateProps} />;
    case "market-leader":
      return <TemplateMarketLeader {...templateProps} />;
    case "modern-minimal":
    default:
      return <TemplateModernMinimal {...templateProps} />;
  }
}

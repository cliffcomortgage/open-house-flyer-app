import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateQRCodeDataURL } from "@/lib/qr-code";
import { TemplateModernMinimal } from "@/components/flyer-templates/TemplateModernMinimal";
import { TemplateGalleryGrid } from "@/components/flyer-templates/TemplateGalleryGrid";
import { TemplateShowcaseOneRate } from "@/components/flyer-templates/TemplateShowcaseOneRate";
import { TemplateMarketLeader } from "@/components/flyer-templates/TemplateMarketLeader";
import type { Flyer, CompanySettings } from "@/types";

/**
 * Chrome-free, native-size render of a flyer using the same template
 * components as the on-screen preview. Not linked from the UI — this is
 * the source Puppeteer navigates to when generating a PDF, so the PDF
 * always matches what the LO sees in `/dashboard/flyers/[id]/preview`.
 */
export default async function PrintFlyerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const role = (session.user as any).role;
  const isAdmin = role === "ADMIN";
  const isRealtor = role === "REALTOR";
  const userId = (session.user as any).id;

  const flyerRecord = await prisma.flyer.findFirst({
    where: isAdmin
      ? { id }
      : isRealtor
      ? { id, realtor: { userId } }
      : { id, loanOfficer: { userId } },
    include: {
      loanOfficer: { include: { user: { select: { email: true, isActive: true } } } },
      realtor: true,
    },
  });
  if (!flyerRecord) notFound();

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

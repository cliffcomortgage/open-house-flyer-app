import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateQRCodeDataURL } from "@/lib/qr-code";
import { FlyerPreview } from "@/components/flyer-templates/FlyerPreview";
import type { Flyer, CompanySettings } from "@/types";

async function getFlyer(
  token: string
): Promise<{ status: "ok"; flyer: Flyer } | { status: "pending" } | { status: "not_found" }> {
  const flyer = await prisma.flyer.findUnique({
    where: { shareToken: token },
    include: {
      loanOfficer: { include: { user: { select: { email: true, isActive: true } } } },
      realtor: true,
    },
  });
  if (!flyer) return { status: "not_found" };

  const scenarios = (flyer.loanScenarios as unknown[]) || [];
  if (scenarios.length > 0 && flyer.approvalStatus !== "APPROVED") return { status: "pending" };

  return { status: "ok", flyer: JSON.parse(JSON.stringify(flyer)) };
}

async function getCompany(): Promise<CompanySettings | null> {
  try {
    const company = await prisma.company.findFirst();
    return company as unknown as CompanySettings | null;
  } catch {
    return null;
  }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [flyerResult, company] = await Promise.all([getFlyer(token), getCompany()]);

  if (flyerResult.status === "not_found") notFound();

  if (flyerResult.status === "pending") {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Pending compliance review</h1>
        <p className="text-sm text-slate-500 max-w-md">
          This flyer includes loan scenario details that are still awaiting compliance approval.
          It will be available here once approved.
        </p>
      </div>
    );
  }

  const flyer = flyerResult.flyer;
  const primaryColor = flyer.realtor?.brandPrimary || company?.primaryColor || "#6633cc";
  const qrCodeDataUrl = flyer.qrCodeData ? await generateQRCodeDataURL(flyer.qrCodeData) : null;

  if (!company || !flyer.loanOfficer || !flyer.propertyData) notFound();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4">
      {/* Header bar */}
      <div className="w-full max-w-3xl mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="h-8 object-contain" />
          ) : (
            <div
              className="px-3 py-1.5 rounded text-white text-sm font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {company.name || "Cliffco Mortgage"}
            </div>
          )}
        </div>
        <a
          href={`/api/share/${token}/pdf`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: primaryColor }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </a>
      </div>

      {/* Flyer — same template components as the in-app preview and PDF, so this always matches */}
      <div className="w-full flex justify-center overflow-x-auto">
        <FlyerPreview flyer={flyer} company={company} qrCodeDataUrl={qrCodeDataUrl} scale={0.9} />
      </div>

      <p className="text-xs text-slate-400 mt-6">
        Powered by Cliffco Flyer Studio · Equal Housing Lender
      </p>
    </div>
  );
}

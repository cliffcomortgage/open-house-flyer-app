import { notFound } from "next/navigation";
import type { Flyer, CompanySettings } from "@/types";
import { formatCurrency } from "@/lib/utils";

async function getFlyer(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/share/${token}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<Flyer>;
}

async function getCompany() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/admin/company`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json() as Promise<CompanySettings>;
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
  const [flyer, company] = await Promise.all([
    getFlyer(token),
    getCompany(),
  ]);

  if (!flyer) notFound();

  const propertyData = flyer.propertyData;
  const lo = flyer.loanOfficer;
  const realtor = flyer.realtor;
  const primaryColor = (realtor as any)?.brandPrimary || company?.primaryColor || "#6633cc";
  const secondaryColor = (realtor as any)?.brandSecondary || company?.secondaryColor || "#0d0d0d";

  const shareUrl = typeof window !== "undefined"
    ? window.location.href
    : `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/share/${token}`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4">
      {/* Header bar */}
      <div className="w-full max-w-4xl mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="h-8 object-contain" />
          ) : (
            <div
              className="px-3 py-1.5 rounded text-white text-sm font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {company?.name || "Cliffco Mortgage"}
            </div>
          )}
        </div>
        <a
          href={`/api/flyers/${flyer.id}/pdf`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: primaryColor }}
          download
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </a>
      </div>

      {/* Flyer card */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Hero photo */}
        {propertyData?.photos?.[0] && (
          <div className="relative w-full h-80">
            <img
              src={propertyData.photos[0]}
              alt="Property"
              className="w-full h-full object-cover"
            />
            {/* Open house banner */}
            {propertyData.openHouseDate && (
              <div
                className="absolute top-4 left-4 px-4 py-2 rounded-lg text-white text-sm font-bold shadow"
                style={{ backgroundColor: primaryColor }}
              >
                OPEN HOUSE — {new Date(propertyData.openHouseDate).toLocaleDateString("en-US", {
                  weekday: "short", month: "long", day: "numeric"
                })}
                {propertyData.openHouseStartTime && ` · ${propertyData.openHouseStartTime}`}
                {propertyData.openHouseEndTime && ` – ${propertyData.openHouseEndTime}`}
              </div>
            )}
          </div>
        )}

        {/* Property info */}
        <div className="p-8">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {propertyData?.price ? formatCurrency(propertyData.price) : "Call for Price"}
              </h1>
              <p className="text-lg text-slate-700 mt-1">
                {propertyData?.address && `${propertyData.address}, `}
                {propertyData?.city && `${propertyData.city}, `}
                {propertyData?.state} {propertyData?.zipCode}
              </p>
            </div>
            <div
              className="shrink-0 px-3 py-1.5 rounded-lg text-white text-sm font-bold"
              style={{ backgroundColor: secondaryColor }}
            >
              {flyer.templateId === "modern-minimal" ? "OPEN HOUSE" : "FOR SALE"}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mb-6 py-4 border-y border-slate-100">
            {propertyData?.bedrooms && (
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{propertyData.bedrooms}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Beds</p>
              </div>
            )}
            {propertyData?.bathrooms && (
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{propertyData.bathrooms}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Baths</p>
              </div>
            )}
            {propertyData?.squareFeet && (
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{propertyData.squareFeet.toLocaleString()}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Sq Ft</p>
              </div>
            )}
            {propertyData?.yearBuilt && (
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{propertyData.yearBuilt}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Built</p>
              </div>
            )}
            {propertyData?.garage && (
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">{propertyData.garage}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Garage</p>
              </div>
            )}
          </div>

          {propertyData?.description && (
            <p className="text-slate-600 leading-relaxed mb-6">{propertyData.description}</p>
          )}

          {/* Photo grid */}
          {(propertyData?.photos?.length ?? 0) > 1 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {propertyData!.photos!.slice(1, 4).map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Photo ${idx + 2}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {/* Loan scenarios */}
          {flyer.loanScenarios && (flyer.loanScenarios as any[]).length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Financing Options</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(flyer.loanScenarios as any[]).map((s, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 overflow-hidden"
                  >
                    <div className="p-3 text-white text-sm font-bold" style={{ backgroundColor: primaryColor }}>
                      {s.label || s.loanType}
                    </div>
                    <div className="p-3 space-y-1.5 text-sm">
                      {s.interestRate && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rate</span>
                          <span className="font-semibold">{Number(s.interestRate).toFixed(3)}%</span>
                        </div>
                      )}
                      {s.apr && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">APR</span>
                          <span className="font-semibold">{Number(s.apr).toFixed(3)}%</span>
                        </div>
                      )}
                      {s.piPayment && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">P&I</span>
                          <span className="font-semibold">{formatCurrency(s.piPayment)}/mo</span>
                        </div>
                      )}
                      {s.monthlyPayment && (
                        <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                          <span className="text-slate-700 font-medium">Total</span>
                          <span className="font-bold text-blue-900">{formatCurrency(s.monthlyPayment)}/mo</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer: LO + Realtor */}
          <div
            className="rounded-xl p-4 mt-4"
            style={{ backgroundColor: primaryColor + "10", borderTop: `3px solid ${primaryColor}` }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {realtor && (
                <div className="flex items-center gap-3">
                  {realtor.headshotUrl && (
                    <img src={realtor.headshotUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{realtor.firstName} {realtor.lastName}</p>
                    <p className="text-xs text-slate-600">{realtor.title} · {realtor.companyName}</p>
                    {realtor.cellPhone && <p className="text-xs text-slate-500">{realtor.cellPhone}</p>}
                    {realtor.email && <p className="text-xs text-slate-500">{realtor.email}</p>}
                  </div>
                </div>
              )}
              {lo && (
                <div className="flex items-center gap-3">
                  {lo.headshotUrl && (
                    <img src={lo.headshotUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{lo.firstName} {lo.lastName}</p>
                    <p className="text-xs text-slate-600">{lo.title}</p>
                    <p className="text-xs text-slate-500">NMLS# {lo.nmlsNumber}</p>
                    {lo.cellPhone && <p className="text-xs text-slate-500">{lo.cellPhone}</p>}
                    {lo.email && <p className="text-xs text-slate-500">{lo.email}</p>}
                  </div>
                </div>
              )}
            </div>
            {lo?.disclaimer && (
              <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-200">
                {lo.disclaimer}
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-6">
        Powered by Cliffco Flyer Studio · Equal Housing Lender
      </p>
    </div>
  );
}

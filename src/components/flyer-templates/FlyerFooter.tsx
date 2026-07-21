import type { LoanOfficer, Realtor, CompanySettings } from "@/types";
import { formatPhone } from "@/lib/utils";

interface FlyerFooterProps {
  loanOfficer: LoanOfficer;
  realtor: Realtor | null;
  company: CompanySettings;
  qrCodeDataUrl: string | null;
}

function EHLLogo() {
  return (
    <img
      src="/logos/equal-housing-lender-1.svg"
      alt="Equal Housing Lender"
      style={{ width: "26px", height: "26px", flexShrink: 0, objectFit: "contain" }}
    />
  );
}

function MLSBadge() {
  return (
    <img
      src="/logos/MLS-Realtor-Logo.png"
      alt="MLS REALTOR"
      style={{
        height: "26px",
        flexShrink: 0,
        objectFit: "contain",
        alignSelf: "flex-start",
        marginTop: "1px",
      }}
    />
  );
}

function buildOneLiner(
  street: string | null,
  suite: string | null,
  city: string | null,
  state: string | null,
  zip: string | null,
  fallback: string | null
): string | null {
  if (street) {
    const parts: string[] = [street];
    if (suite) parts.push(`Ste ${suite}`);
    const cityLine = [city, state, zip].filter(Boolean).join(" ");
    if (cityLine) parts.push(cityLine);
    return parts.join(", ");
  }
  return fallback;
}

// Fixed bounding box for both logos — objectFit:contain means each logo scales to fit.
// KW (1.9:1 ratio) fills most of the 44px height; Cliffco (3.83:1) fills the width, appearing shorter.
const LOGO_BOX_W = 92;
const LOGO_BOX_H = 44;

// ─── Single agent card: [headshot] [info] [logo] ──────────────────────────────
function AgentCard({
  headshotUrl,
  name,
  title,
  companyName,
  phones,
  email,
  website,
  address,
  logoUrl,
  logoAlt,
  primaryColor,
}: {
  headshotUrl: string | null;
  name: string;
  title?: string | null;
  companyName?: string | null;
  phones: string;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  logoAlt?: string;
  primaryColor: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
        minWidth: 0,
        paddingRight: "24px",
      }}
    >
      {/* Headshot */}
      {headshotUrl && (
        <img
          src={headshotUrl}
          alt={name}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            border: `2px solid ${primaryColor}28`,
          }}
        />
      )}

      {/* Info text */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "12px", color: "#0f172a", lineHeight: "1.2" }}>
          {name}
        </div>
        {title && (
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "1px" }}>{title}</div>
        )}
        {companyName && (
          <div style={{ fontSize: "9.5px", color: "#64748b" }}>{companyName}</div>
        )}
        {phones && (
          <div style={{ fontSize: "9.5px", color: "#475569", marginTop: "3px" }}>{phones}</div>
        )}
        {email && <div style={{ fontSize: "9.5px", color: "#64748b" }}>{email}</div>}
        {website && (
          <div style={{ fontSize: "9.5px", color: "#64748b" }}>
            {website.replace(/^https?:\/\//, "")}
          </div>
        )}
        {address && (
          <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "2px" }}>{address}</div>
        )}
      </div>

      {/* Company logo — same fixed bounding box for both agents, top-aligned with name */}
      {logoUrl && (
        <div
          style={{
            flexShrink: 0,
            width: `${LOGO_BOX_W}px`,
            height: `${LOGO_BOX_H}px`,
            alignSelf: "flex-start",
          }}
        >
          <img
            src={logoUrl}
            alt={logoAlt || ""}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "left top",
            }}
          />
        </div>
      )}
    </div>
  );
}

export function FlyerFooter({
  loanOfficer,
  realtor,
  company,
  qrCodeDataUrl,
}: FlyerFooterProps) {
  const primaryColor = realtor?.brandPrimary || company.primaryColor || "#6633cc";

  const loPhone = [
    loanOfficer.cellPhone && `C: ${formatPhone(loanOfficer.cellPhone)}`,
    loanOfficer.officePhone && `O: ${formatPhone(loanOfficer.officePhone)}`,
  ]
    .filter(Boolean)
    .join("  |  ");

  const rePhone = realtor
    ? [
        realtor.cellPhone && `C: ${formatPhone(realtor.cellPhone)}`,
        realtor.officePhone && `O: ${formatPhone(realtor.officePhone)}`,
      ]
        .filter(Boolean)
        .join("  |  ")
    : "";

  const loAddr = buildOneLiner(
    loanOfficer.branchStreet,
    loanOfficer.branchSuite,
    loanOfficer.branchCity,
    loanOfficer.branchState,
    loanOfficer.branchZip,
    loanOfficer.branchAddress
  );

  const reAddr = realtor
    ? buildOneLiner(
        realtor.officeStreet,
        realtor.officeSuite,
        realtor.officeCity,
        realtor.officeState,
        realtor.officeZip,
        realtor.officeAddress
      )
    : null;

  const showLicenseLine = !!(company.licenseText || loanOfficer.branchNmls);

  // Build LO name + NMLS as the "title" line
  const loSubtitle = [loanOfficer.title, `NMLS# ${loanOfficer.nmlsNumber}`]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div style={{ flexShrink: 0 }}>
      {/* ── Main footer body ── */}
      <div
        style={{
          borderTop: `4px solid ${primaryColor}`,
          background: "#ffffff",
          padding: "14px 22px 12px",
        }}
      >
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>

          {/* LO: [headshot] [info] [Cliffco logo] */}
          <AgentCard
            headshotUrl={loanOfficer.headshotUrl}
            name={`${loanOfficer.firstName} ${loanOfficer.lastName}`}
            title={loSubtitle}
            phones={loPhone}
            email={loanOfficer.email}
            website={loanOfficer.website}
            address={loAddr}
            logoUrl={company.logoUrl}
            logoAlt={company.name}
            primaryColor={primaryColor}
          />

          {/* QR code with dividers */}
          {qrCodeDataUrl && (
            <>
              <div
                style={{
                  width: "1px",
                  alignSelf: "stretch",
                  background: `${primaryColor}22`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flexShrink: 0, textAlign: "center", paddingTop: "2px" }}>
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  style={{ width: "54px", height: "54px" }}
                />
                <div style={{ fontSize: "7px", color: "#94a3b8", marginTop: "2px" }}>
                  Scan to view
                </div>
              </div>
              <div
                style={{
                  width: "1px",
                  alignSelf: "stretch",
                  background: `${primaryColor}22`,
                  flexShrink: 0,
                }}
              />
            </>
          )}

          {/* Realtor: [headshot] [info] [brokerage logo] — same format as LO */}
          {realtor && (
            <AgentCard
              headshotUrl={realtor.headshotUrl}
              name={`${realtor.firstName} ${realtor.lastName}`}
              title={realtor.title}
              companyName={realtor.companyName}
              phones={rePhone}
              email={realtor.email}
              website={realtor.website}
              address={reAddr}
              logoUrl={realtor.companyLogoUrl}
              logoAlt={realtor.companyName || "Realtor"}
              primaryColor={primaryColor}
            />
          )}
        </div>
      </div>

      {/* ── MLS + license strip ── */}
      <div
        style={{
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          padding: "5px 22px",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
        }}
      >
        <MLSBadge />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "7px", color: "#64748b", lineHeight: "1.45", margin: 0 }}>
            Each office is independently owned and operated. If your home is currently listed for
            sale with a real estate agent, disregard this notice. It is not our intent to solicit
            the offerings of other brokers.
          </p>
          {showLicenseLine && (
            <p
              style={{ fontSize: "7px", color: "#64748b", lineHeight: "1.45", margin: "2px 0 0" }}
            >
              {company.licenseText}
              {company.licenseText && loanOfficer.branchNmls ? "  |  " : ""}
              {loanOfficer.branchNmls && `Branch NMLS# ${loanOfficer.branchNmls}`}
            </p>
          )}
        </div>
      </div>

      {/* ── Disclaimer strip with EHL logo ── */}
      {loanOfficer.disclaimer && (
        <div
          style={{
            background: "#f1f5f9",
            borderTop: "1px solid #e2e8f0",
            padding: "5px 22px",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <EHLLogo />
          <p style={{ fontSize: "6px", color: "#94a3b8", lineHeight: "1.5", margin: 0 }}>
            {loanOfficer.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

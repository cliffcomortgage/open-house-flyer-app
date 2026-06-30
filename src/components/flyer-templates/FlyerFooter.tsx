import type { LoanOfficer, Realtor, CompanySettings } from "@/types";
import { formatPhone } from "@/lib/utils";

interface FlyerFooterProps {
  loanOfficer: LoanOfficer;
  realtor: Realtor | null;
  company: CompanySettings;
  qrCodeDataUrl: string | null;
}

export function FlyerFooter({
  loanOfficer,
  realtor,
  company,
  qrCodeDataUrl,
}: FlyerFooterProps) {
  const primaryColor = realtor?.brandPrimary || company.primaryColor || "#6633cc";

  return (
    <div
      style={{
        background: `${primaryColor}12`,
        borderTop: `3px solid ${primaryColor}`,
        padding: "16px 24px 12px",
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
      }}
    >
      {/* Realtor column */}
      {realtor && (
        <div style={{ flex: 1, display: "flex", gap: "12px", alignItems: "center" }}>
          {realtor.headshotUrl && (
            <img
              src={realtor.headshotUrl}
              alt={`${realtor.firstName} ${realtor.lastName}`}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b", lineHeight: "1.2" }}>
              {realtor.firstName} {realtor.lastName}
            </div>
            <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
              {realtor.title}
            </div>
            {realtor.companyName && (
              <div style={{ fontSize: "11px", color: "#475569" }}>
                {realtor.companyName}
              </div>
            )}
            {realtor.cellPhone && (
              <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                {formatPhone(realtor.cellPhone)}
              </div>
            )}
            {realtor.officePhone && (
              <div style={{ fontSize: "10px", color: "#64748b" }}>
                {formatPhone(realtor.officePhone)}
              </div>
            )}
            {realtor.email && (
              <div style={{ fontSize: "10px", color: "#64748b" }}>{realtor.email}</div>
            )}
            {realtor.website && (
              <div style={{ fontSize: "10px", color: "#64748b" }}>
                {realtor.website.replace(/^https?:\/\//, "")}
              </div>
            )}
            {realtor.companyLogoUrl && (
              <img
                src={realtor.companyLogoUrl}
                alt={realtor.companyName}
                style={{ height: "20px", objectFit: "contain", marginTop: "6px" }}
              />
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      {realtor && (
        <div
          style={{
            width: "1px",
            background: `${primaryColor}30`,
            alignSelf: "stretch",
            flexShrink: 0,
          }}
        />
      )}

      {/* QR code (center column) */}
      {qrCodeDataUrl && (
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <img
            src={qrCodeDataUrl}
            alt="QR Code"
            style={{ width: "64px", height: "64px" }}
          />
          <div style={{ fontSize: "8px", color: "#94a3b8", marginTop: "2px" }}>Scan to view</div>
        </div>
      )}

      {/* LO column */}
      <div style={{ flex: 1, display: "flex", gap: "12px", alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "right", minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b", lineHeight: "1.2" }}>
            {loanOfficer.firstName} {loanOfficer.lastName}
          </div>
          <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
            {loanOfficer.title}
          </div>
          <div style={{ fontSize: "10px", color: "#64748b" }}>
            NMLS# {loanOfficer.nmlsNumber}
          </div>
          {loanOfficer.cellPhone && (
            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
              {formatPhone(loanOfficer.cellPhone)}
            </div>
          )}
          {loanOfficer.officePhone && (
            <div style={{ fontSize: "10px", color: "#64748b" }}>
              {formatPhone(loanOfficer.officePhone)}
            </div>
          )}
          {loanOfficer.email && (
            <div style={{ fontSize: "10px", color: "#64748b" }}>{loanOfficer.email}</div>
          )}
          {loanOfficer.website && (
            <div style={{ fontSize: "10px", color: "#64748b" }}>
              {loanOfficer.website.replace(/^https?:\/\//, "")}
            </div>
          )}
          {loanOfficer.branchAddress && (
            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
              {loanOfficer.branchAddress}
            </div>
          )}
        </div>
        {loanOfficer.headshotUrl && (
          <img
            src={loanOfficer.headshotUrl}
            alt={`${loanOfficer.firstName} ${loanOfficer.lastName}`}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        )}
        {(company.logoUrl || company.website) && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, gap: "3px" }}>
            {company.logoUrl && (
              <img
                src={company.logoUrl}
                alt={company.name}
                style={{ height: "32px", objectFit: "contain" }}
              />
            )}
            {company.website && (
              <div style={{ fontSize: "9px", color: "#64748b" }}>
                {company.website.replace(/^https?:\/\//, "")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      {loanOfficer.disclaimer && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            fontSize: "7.5px",
            color: "#94a3b8",
            padding: "4px 24px",
            background: `${primaryColor}08`,
          }}
        >
          {loanOfficer.disclaimer}
        </div>
      )}
    </div>
  );
}

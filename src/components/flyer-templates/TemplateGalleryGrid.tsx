import type { LoanOfficer, Realtor, CompanySettings, PropertyData } from "@/types";
import { FlyerFooter } from "./FlyerFooter";
import { formatCurrency } from "@/lib/utils";

interface TemplateGalleryGridProps {
  propertyData: PropertyData;
  loanOfficer: LoanOfficer;
  realtor: Realtor | null;
  company: CompanySettings;
  qrCodeDataUrl: string | null;
}

export function TemplateGalleryGrid({
  propertyData,
  loanOfficer,
  realtor,
  company,
  qrCodeDataUrl,
}: TemplateGalleryGridProps) {
  const primaryColor = realtor?.brandPrimary || company.primaryColor || "#6633cc";
  const secondaryColor = realtor?.brandSecondary || company.secondaryColor || "#0d0d0d";
  const photos = propertyData.photos || [];

  return (
    <div
      style={{
        width: "816px",
        minHeight: "1056px",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: primaryColor,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "18px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Open House
          </div>
          {propertyData.openHouseDate && (
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", marginTop: "2px" }}>
              {new Date(propertyData.openHouseDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              {propertyData.openHouseStartTime && ` · ${propertyData.openHouseStartTime}`}
              {propertyData.openHouseEndTime && ` – ${propertyData.openHouseEndTime}`}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "22px" }}>
            {propertyData.price ? formatCurrency(propertyData.price) : ""}
          </div>
          {company.logoUrl && (
            <img src={company.logoUrl} alt={company.name} style={{ height: "24px", objectFit: "contain", marginTop: "4px" }} />
          )}
        </div>
      </div>

      {/* Main content: photos left, details right */}
      <div style={{ flex: 1, display: "flex", gap: "0" }}>
        {/* Photo grid (70%) */}
        <div style={{ width: "70%", padding: "12px 8px 12px 12px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: "8px",
              height: "100%",
            }}
          >
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                style={{
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: `${primaryColor}20`,
                  minHeight: "200px",
                }}
              >
                {photos[idx] ? (
                  <img
                    src={photos[idx]}
                    alt={`Property photo ${idx + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      opacity: 0.3,
                    }}
                  >
                    🏡
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Property details panel (30%) */}
        <div
          style={{
            width: "30%",
            padding: "16px 16px 16px 8px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Address */}
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", lineHeight: "1.3" }}>
              {propertyData.address}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              {[propertyData.city, propertyData.state, propertyData.zipCode].filter(Boolean).join(", ")}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: "2px", background: primaryColor, borderRadius: "1px" }} />

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              propertyData.bedrooms ? { label: "Bedrooms", value: propertyData.bedrooms } : null,
              propertyData.bathrooms ? { label: "Bathrooms", value: propertyData.bathrooms } : null,
              propertyData.squareFeet ? { label: "Square Feet", value: propertyData.squareFeet.toLocaleString() } : null,
              propertyData.yearBuilt ? { label: "Year Built", value: propertyData.yearBuilt } : null,
              propertyData.lotSize ? { label: "Lot Size", value: propertyData.lotSize } : null,
              propertyData.garage ? { label: "Garage", value: propertyData.garage } : null,
            ]
              .filter(Boolean)
              .map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{stat!.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>{stat!.value}</span>
                </div>
              ))}
          </div>

          {/* Description excerpt */}
          {propertyData.description && (
            <div style={{ fontSize: "10.5px", color: "#64748b", lineHeight: "1.6" }}>
              {propertyData.description.slice(0, 200)}
              {propertyData.description.length > 200 ? "…" : ""}
            </div>
          )}

          {/* MLS */}
          {propertyData.mlsNumber && (
            <div style={{ fontSize: "9px", color: "#94a3b8" }}>
              MLS# {propertyData.mlsNumber}
            </div>
          )}

          {/* Accent bar */}
          <div
            style={{
              marginTop: "auto",
              background: secondaryColor,
              borderRadius: "6px",
              padding: "8px 12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#ffffff",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              For Sale
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "relative" }}>
        <FlyerFooter
          loanOfficer={loanOfficer}
          realtor={realtor}
          company={company}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      </div>
    </div>
  );
}

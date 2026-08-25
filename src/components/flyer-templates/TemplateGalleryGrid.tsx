import type { LoanOfficer, Realtor, CompanySettings, PropertyData } from "@/types";
import { FlyerFooter } from "./FlyerFooter";
import { formatCurrency } from "@/lib/utils";

interface TemplateGalleryGridProps {
  propertyData: PropertyData;
  loanOfficer: LoanOfficer;
  realtor: Realtor | null;
  company: CompanySettings;
  qrCodeDataUrl: string | null;
  distributionState?: string | null;
}

export function TemplateGalleryGrid({
  propertyData,
  loanOfficer,
  realtor,
  company,
  qrCodeDataUrl,
  distributionState,
}: TemplateGalleryGridProps) {
  const primaryColor = realtor?.brandPrimary || company.primaryColor || "#6633cc";
  const photos = propertyData.photos || [];

  const formattedDate = propertyData.openHouseDate
    ? new Date(propertyData.openHouseDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  const timeStr = [propertyData.openHouseStartTime, propertyData.openHouseEndTime]
    .filter(Boolean)
    .join(" – ");

  const stats = [
    propertyData.bedrooms ? { label: "Beds", value: propertyData.bedrooms } : null,
    propertyData.bathrooms ? { label: "Baths", value: propertyData.bathrooms } : null,
    propertyData.squareFeet
      ? { label: "Sq Ft", value: propertyData.squareFeet.toLocaleString() }
      : null,
    propertyData.yearBuilt ? { label: "Year Built", value: propertyData.yearBuilt } : null,
    propertyData.lotSize ? { label: "Lot Size", value: propertyData.lotSize } : null,
    propertyData.garage ? { label: "Garage", value: propertyData.garage } : null,
    propertyData.stories ? { label: "Stories", value: propertyData.stories } : null,
    propertyData.units ? { label: "Units", value: propertyData.units } : null,
  ].filter(Boolean);

  const cityStateZipLine = [propertyData.city, propertyData.state, propertyData.zipCode]
    .filter(Boolean)
    .join(", ");
  const subAddressLine = [cityStateZipLine, propertyData.propertyType, propertyData.propertyUse]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      style={{
        width: "816px",
        height: "1056px",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        fontFamily: 'var(--font-sans), "Segoe UI", Arial, sans-serif',
        overflow: "hidden",
      }}
    >
      {/* Brand accent bar */}
      <div style={{ height: "3px", background: primaryColor, flexShrink: 0 }} />

      {/* Editorial header: Open House label left · large price right */}
      <div
        style={{
          padding: "20px 36px 0",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: primaryColor,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Open House
          </div>
          {(formattedDate || propertyData.city) && (
            <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px", fontWeight: 400 }}>
              {formattedDate || [propertyData.city, propertyData.state].filter(Boolean).join(", ")}
              {formattedDate && timeStr && (
                <span style={{ color: "#94a3b8" }}> · {timeStr}</span>
              )}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1,
              letterSpacing: "-2.5px",
            }}
          >
            {propertyData.price ? formatCurrency(propertyData.price) : ""}
          </div>
          {propertyData.mlsNumber && (
            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px", letterSpacing: "0.04em" }}>
              MLS# {propertyData.mlsNumber}
            </div>
          )}
        </div>
      </div>

      {/* Address block */}
      <div style={{ padding: "10px 36px 14px", flexShrink: 0 }}>
        <div style={{ fontSize: "19px", fontWeight: 700, color: "#0f172a" }}>
          {propertyData.address}
        </div>
        <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
          {subAddressLine}
        </div>
      </div>

      {/* Photo grid — 2×2, thin 2px gaps, full width */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "2px",
          height: "490px",
          flexShrink: 0,
          marginTop: "18px",
        }}
      >
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            style={{
              overflow: "hidden",
              background: "#e8edf2",
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
                }}
              >
                <span style={{ fontSize: "32px", opacity: 0.07 }}>🏡</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stats strip — editorial columns */}
      {stats.length > 0 && (
        <div style={{ padding: "16px 36px 0", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "14px",
            }}
          >
            {stats.map((stat, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  textAlign: "center",
                  borderRight:
                    idx < stats.length - 1 ? "1px solid #e2e8f0" : "none",
                  padding: "0 8px",
                }}
              >
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    color: "#0f172a",
                    lineHeight: 1,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {stat!.value}
                </div>
                <div
                  style={{
                    fontSize: "8.5px",
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginTop: "4px",
                  }}
                >
                  {stat!.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {propertyData.description && (
        <div style={{ padding: "16px 36px 0", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div
            style={{
              fontSize: "11px",
              color: "#64748b",
              lineHeight: "1.72",
              display: "-webkit-box",
              WebkitLineClamp: 5,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {propertyData.description}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <FlyerFooter
        loanOfficer={loanOfficer}
        realtor={realtor}
        company={company}
        qrCodeDataUrl={qrCodeDataUrl}
        distributionState={distributionState}
      />
    </div>
  );
}

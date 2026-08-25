import type { LoanOfficer, Realtor, CompanySettings, PropertyData } from "@/types";
import { FlyerFooter } from "./FlyerFooter";
import { formatCurrency } from "@/lib/utils";

interface TemplateModernMinimalProps {
  propertyData: PropertyData;
  loanOfficer: LoanOfficer;
  realtor: Realtor | null;
  company: CompanySettings;
  qrCodeDataUrl: string | null;
  distributionState?: string | null;
}

export function TemplateModernMinimal({
  propertyData,
  loanOfficer,
  realtor,
  company,
  qrCodeDataUrl,
  distributionState,
}: TemplateModernMinimalProps) {
  const primaryColor = realtor?.brandPrimary || company.primaryColor || "#6633cc";
  const heroPhoto = propertyData.photos?.[0];

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
    propertyData.bedrooms ? { value: propertyData.bedrooms, label: "Beds" } : null,
    propertyData.bathrooms ? { value: propertyData.bathrooms, label: "Baths" } : null,
    propertyData.squareFeet
      ? { value: propertyData.squareFeet.toLocaleString(), label: "Sq Ft" }
      : null,
    propertyData.yearBuilt ? { value: propertyData.yearBuilt, label: "Year Built" } : null,
    propertyData.garage ? { value: propertyData.garage, label: "Garage" } : null,
    propertyData.stories ? { value: propertyData.stories, label: "Stories" } : null,
    propertyData.units ? { value: propertyData.units, label: "Units" } : null,
  ].filter(Boolean);

  const fullAddress = [propertyData.address, propertyData.city, propertyData.state]
    .filter(Boolean)
    .join(", ")
    .concat(propertyData.zipCode ? ` ${propertyData.zipCode}` : "");

  const addressLine = [fullAddress, propertyData.propertyType, propertyData.propertyUse]
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

      {/* Editorial header — bold headline, plain */}
      <div
        style={{
          padding: "24px 36px 0",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: primaryColor,
              letterSpacing: "-1px",
              lineHeight: 1,
            }}
          >
            Open House
          </div>
          {(formattedDate || propertyData.city) && (
            <div style={{ fontSize: "13px", color: "#334155", marginTop: "8px", fontWeight: 600 }}>
              {formattedDate || [propertyData.city, propertyData.state].filter(Boolean).join(", ")}
              {formattedDate && timeStr && (
                <span style={{ color: "#94a3b8", fontWeight: 400 }}> · {timeStr}</span>
              )}
            </div>
          )}
        </div>
        {propertyData.mlsNumber && (
          <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "0.04em", marginTop: "4px" }}>
            MLS# {propertyData.mlsNumber}
          </div>
        )}
      </div>

      {/* Hero photo — full bleed, clean */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "460px",
          flexShrink: 0,
          overflow: "hidden",
          background: "#e8edf2",
          marginTop: "18px",
        }}
      >
        {heroPhoto ? (
          <img
            src={heroPhoto}
            alt="Property"
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
            <span style={{ fontSize: "90px", opacity: 0.06 }}>🏡</span>
          </div>
        )}
      </div>

      {/* Price — editorial, oversized, white background */}
      <div style={{ padding: "26px 36px 0", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "10.5px",
            fontWeight: 700,
            color: primaryColor,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Offered At
        </div>
        <div
          style={{
            fontSize: "62px",
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1,
            letterSpacing: "-2.5px",
            marginTop: "6px",
          }}
        >
          {propertyData.price ? formatCurrency(propertyData.price) : "Price Upon Request"}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginTop: "13px",
          }}
        >
          <div style={{ height: "1px", width: "48px", background: primaryColor, flexShrink: 0 }} />
          <div style={{ fontSize: "14px", color: "#475569", fontWeight: 400, letterSpacing: "0.01em" }}>
            {addressLine}
          </div>
        </div>
      </div>

      {/* Stats — plain, bold numbers with thin hairline dividers */}
      {stats.length > 0 && (
        <div style={{ padding: "20px 36px 0", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "16px",
            }}
          >
            {stats.map((stat, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  textAlign: "center",
                  borderRight: idx < stats.length - 1 ? "1px solid #e2e8f0" : "none",
                  padding: "0 10px",
                }}
              >
                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
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
                    letterSpacing: "0.14em",
                    marginTop: "5px",
                  }}
                >
                  {stat!.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description — plain paragraph */}
      {propertyData.description && (
        <div style={{ padding: "20px 36px 0", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div
            style={{
              fontSize: "12px",
              color: "#475569",
              lineHeight: "1.78",
              display: "-webkit-box",
              WebkitLineClamp: 7,
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

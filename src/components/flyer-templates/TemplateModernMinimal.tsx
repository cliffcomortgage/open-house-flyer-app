import type { LoanOfficer, Realtor, CompanySettings, PropertyData } from "@/types";
import { FlyerFooter } from "./FlyerFooter";
import { formatCurrency } from "@/lib/utils";

interface TemplateModernMinimalProps {
  propertyData: PropertyData;
  loanOfficer: LoanOfficer;
  realtor: Realtor | null;
  company: CompanySettings;
  qrCodeDataUrl: string | null;
}

export function TemplateModernMinimal({
  propertyData,
  loanOfficer,
  realtor,
  company,
  qrCodeDataUrl,
}: TemplateModernMinimalProps) {
  const primaryColor = realtor?.brandPrimary || company.primaryColor || "#6633cc";
  const secondaryColor = realtor?.brandSecondary || company.secondaryColor || "#0d0d0d";
  const heroPhoto = propertyData.photos?.[0];

  return (
    <div
      style={{
        width: "816px",
        minHeight: "1056px",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hero photo — 55% height */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "580px",
          flexShrink: 0,
          overflow: "hidden",
          background: primaryColor,
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
              background: primaryColor,
            }}
          >
            <span style={{ fontSize: "80px", opacity: 0.2 }}>🏡</span>
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "200px",
            background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
          }}
        />

        {/* OPEN HOUSE banner */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "24px",
            background: primaryColor,
            color: "#ffffff",
            padding: "8px 18px",
            borderRadius: "6px",
            fontWeight: 700,
            fontSize: "13px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {propertyData.openHouseDate
            ? `Open House · ${new Date(propertyData.openHouseDate).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}`
            : "Open House"}
          {propertyData.openHouseStartTime && ` · ${propertyData.openHouseStartTime}`}
          {propertyData.openHouseEndTime && ` – ${propertyData.openHouseEndTime}`}
        </div>

        {/* Price & address overlay on photo */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "24px",
            right: "24px",
          }}
        >
          <div
            style={{
              fontSize: "38px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            {propertyData.price ? formatCurrency(propertyData.price) : "Price Upon Request"}
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.90)",
              marginTop: "4px",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            {[propertyData.address, propertyData.city, propertyData.state].filter(Boolean).join(", ")}
            {propertyData.zipCode ? ` ${propertyData.zipCode}` : ""}
          </div>
        </div>
      </div>

      {/* Property details section */}
      <div style={{ padding: "24px 28px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "0",
            borderRadius: "10px",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          {[
            propertyData.bedrooms ? { label: "Bedrooms", value: propertyData.bedrooms } : null,
            propertyData.bathrooms ? { label: "Bathrooms", value: propertyData.bathrooms } : null,
            propertyData.squareFeet ? { label: "Sq Ft", value: propertyData.squareFeet.toLocaleString() } : null,
            propertyData.yearBuilt ? { label: "Year Built", value: propertyData.yearBuilt } : null,
            propertyData.garage ? { label: "Garage", value: propertyData.garage } : null,
          ]
            .filter(Boolean)
            .map((stat, idx, arr) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "12px 8px",
                  borderRight: idx < arr.length - 1 ? "1px solid #e5e7eb" : "none",
                  background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                }}
              >
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>
                  {stat!.value}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginTop: "2px",
                  }}
                >
                  {stat!.label}
                </div>
              </div>
            ))}
        </div>

        {/* Description */}
        {propertyData.description && (
          <div
            style={{
              fontSize: "12px",
              color: "#475569",
              lineHeight: "1.65",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {propertyData.description}
          </div>
        )}

        {/* MLS number */}
        {propertyData.mlsNumber && (
          <div style={{ fontSize: "10px", color: "#94a3b8" }}>
            MLS# {propertyData.mlsNumber}
          </div>
        )}
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

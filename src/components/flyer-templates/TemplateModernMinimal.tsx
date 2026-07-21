import { CalendarDays, BedDouble, Bath, Ruler, Car, MapPin } from "lucide-react";
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

const STAT_ICONS: Record<string, React.ElementType> = {
  Beds: BedDouble,
  Baths: Bath,
  "Sq Ft": Ruler,
  "Year Built": CalendarDays,
  Garage: Car,
};

const CLIFFCO_DARK = "#0d0d0d";
const CLIFFCO_SKY = "#bde8f1";

export function TemplateModernMinimal({
  propertyData,
  loanOfficer,
  realtor,
  company,
  qrCodeDataUrl,
}: TemplateModernMinimalProps) {
  const primaryColor = realtor?.brandPrimary || company.primaryColor || "#6633cc";
  const heroPhoto = propertyData.photos?.[0];

  const formattedDate = propertyData.openHouseDate
    ? new Date(propertyData.openHouseDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
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
  ].filter(Boolean);

  const fullAddress = [propertyData.address, propertyData.city, propertyData.state]
    .filter(Boolean)
    .join(", ")
    .concat(propertyData.zipCode ? ` ${propertyData.zipCode}` : "");

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
      <div style={{ height: "4px", background: primaryColor, flexShrink: 0 }} />

      {/* Hero photo — full bleed, with badge overlays */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "490px",
          flexShrink: 0,
          overflow: "hidden",
          background: "#e8edf2",
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

        {/* Open House badge — realtor/company brand color */}
        <div
          style={{
            position: "absolute",
            top: "22px",
            left: "22px",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            background: primaryColor,
            padding: "9px 18px",
            borderRadius: "999px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Open House
          </span>
        </div>

        {/* Date/time badge — Cliffco brand (dark + sky), distinct from realtor color */}
        {(formattedDate || timeStr) && (
          <div
            style={{
              position: "absolute",
              bottom: "22px",
              left: "22px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: CLIFFCO_DARK,
              padding: "9px 16px",
              borderRadius: "10px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.28)",
            }}
          >
            <CalendarDays size={15} color={CLIFFCO_SKY} strokeWidth={2.25} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
              {formattedDate}
              {formattedDate && timeStr && <span style={{ color: CLIFFCO_SKY }}> · {timeStr}</span>}
            </span>
          </div>
        )}

        {propertyData.mlsNumber && (
          <div
            style={{
              position: "absolute",
              top: "22px",
              right: "22px",
              background: "rgba(15,23,42,0.55)",
              padding: "7px 14px",
              borderRadius: "8px",
            }}
          >
            <span style={{ fontSize: "10px", color: "#ffffff", letterSpacing: "0.06em" }}>
              MLS# {propertyData.mlsNumber}
            </span>
          </div>
        )}
      </div>

      {/* Price — editorial, oversized, white background */}
      <div style={{ padding: "26px 36px 0", flexShrink: 0 }}>
        <div
          style={{
            display: "inline-block",
            fontSize: "10.5px",
            fontWeight: 700,
            color: primaryColor,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            background: `${primaryColor}14`,
            padding: "4px 10px",
            borderRadius: "5px",
            marginBottom: "10px",
          }}
        >
          Listed At
        </div>
        <div
          style={{
            fontSize: "66px",
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1,
            letterSpacing: "-2.5px",
          }}
        >
          {propertyData.price ? formatCurrency(propertyData.price) : "Price Upon Request"}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "13px",
          }}
        >
          <MapPin size={15} color="#94a3b8" strokeWidth={2} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: "14px", color: "#475569", fontWeight: 400, letterSpacing: "0.01em" }}>
            {fullAddress}
          </div>
        </div>
      </div>

      {/* Stats — soft tinted card, icon-led */}
      {stats.length > 0 && (
        <div style={{ padding: "22px 36px 0", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              background: `${primaryColor}09`,
              borderRadius: "12px",
              padding: "16px 8px",
            }}
          >
            {stats.map((stat, idx) => {
              const Icon = STAT_ICONS[stat!.label] || Ruler;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    borderRight: idx < stats.length - 1 ? `1px solid ${primaryColor}1c` : "none",
                    padding: "0 10px",
                  }}
                >
                  <Icon size={15} color={primaryColor} strokeWidth={2.1} style={{ margin: "0 auto 6px" }} />
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      color: "#0f172a",
                      lineHeight: 1,
                      letterSpacing: "-0.4px",
                    }}
                  >
                    {stat!.value}
                  </div>
                  <div
                    style={{
                      fontSize: "8.5px",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.13em",
                      marginTop: "5px",
                    }}
                  >
                    {stat!.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Description — yields space to the footer/disclaimer below, which must never be clipped */}
      {propertyData.description && (
        <div style={{ padding: "22px 36px 0", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              marginBottom: "10px",
            }}
          >
            About This Home
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ width: "3px", background: primaryColor, borderRadius: "2px", flexShrink: 0 }} />
            <div style={{ fontSize: "12px", color: "#475569", lineHeight: "1.78" }}>
              {propertyData.description.slice(0, 340)}
              {propertyData.description.length > 340 ? "…" : ""}
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <FlyerFooter
        loanOfficer={loanOfficer}
        realtor={realtor}
        company={company}
        qrCodeDataUrl={qrCodeDataUrl}
      />
    </div>
  );
}

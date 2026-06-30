import type { LoanOfficer, Realtor, CompanySettings, PropertyData, LoanScenario } from "@/types";
import { FlyerFooter } from "./FlyerFooter";
import { formatCurrency, formatRate } from "@/lib/utils";

interface TemplateShowcaseOneRateProps {
  propertyData: PropertyData;
  loanOfficer: LoanOfficer;
  realtor: Realtor | null;
  company: CompanySettings;
  qrCodeDataUrl: string | null;
  loanScenarios?: LoanScenario[];
}

function ScenarioRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 0",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.8)" }}>{label}</span>
      <span style={{ fontSize: "11px", fontWeight: 600, color: "#ffffff" }}>{value}</span>
    </div>
  );
}

export function TemplateShowcaseOneRate({
  propertyData,
  loanOfficer,
  realtor,
  company,
  qrCodeDataUrl,
  loanScenarios,
}: TemplateShowcaseOneRateProps) {
  const primaryColor = realtor?.brandPrimary || company.primaryColor || "#6633cc";
  const secondaryColor = realtor?.brandSecondary || company.secondaryColor || "#0d0d0d";
  const heroPhoto = propertyData.photos?.[0];
  const scenario = loanScenarios?.[0];

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
      {/* Hero photo */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "420px",
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
          <div style={{ width: "100%", height: "100%", background: primaryColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "80px", opacity: 0.2 }}>🏡</span>
          </div>
        )}

        {/* Bottom gradient */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "120px",
            background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
          }}
        />

        {/* Open house tag */}
        {propertyData.openHouseDate && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "20px",
              background: primaryColor,
              color: "#ffffff",
              padding: "7px 16px",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "12px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            Open House
          </div>
        )}
      </div>

      {/* Address + price */}
      <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b" }}>
              {propertyData.price ? formatCurrency(propertyData.price) : "Price Upon Request"}
            </div>
            <div style={{ fontSize: "15px", color: "#475569", marginTop: "4px" }}>
              {[propertyData.address, propertyData.city, propertyData.state].filter(Boolean).join(", ")}
              {propertyData.zipCode ? ` ${propertyData.zipCode}` : ""}
            </div>
          </div>
          {propertyData.openHouseDate && (
            <div
              style={{
                textAlign: "right",
                flexShrink: 0,
                background: `${primaryColor}12`,
                border: `1px solid ${primaryColor}30`,
                borderRadius: "8px",
                padding: "8px 14px",
              }}
            >
              <div style={{ fontSize: "10px", color: primaryColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Open House</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginTop: "2px" }}>
                {new Date(propertyData.openHouseDate).toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                })}
              </div>
              {(propertyData.openHouseStartTime || propertyData.openHouseEndTime) && (
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {propertyData.openHouseStartTime}
                  {propertyData.openHouseEndTime ? ` – ${propertyData.openHouseEndTime}` : ""}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats + description row */}
      <div style={{ padding: "16px 28px", display: "flex", gap: "24px" }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: "20px", flexShrink: 0 }}>
          {[
            propertyData.bedrooms ? { label: "Beds", value: propertyData.bedrooms } : null,
            propertyData.bathrooms ? { label: "Baths", value: propertyData.bathrooms } : null,
            propertyData.squareFeet ? { label: "Sq Ft", value: propertyData.squareFeet.toLocaleString() } : null,
            propertyData.yearBuilt ? { label: "Built", value: propertyData.yearBuilt } : null,
          ]
            .filter(Boolean)
            .map((stat, idx) => (
              <div key={idx} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#1e293b" }}>{stat!.value}</div>
                <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat!.label}</div>
              </div>
            ))}
        </div>

        {/* Description */}
        {propertyData.description && (
          <div style={{ flex: 1, fontSize: "11.5px", color: "#475569", lineHeight: "1.65" }}>
            {propertyData.description.slice(0, 220)}
            {propertyData.description.length > 220 ? "…" : ""}
          </div>
        )}
      </div>

      {/* Loan scenario card */}
      {scenario && (
        <div style={{ padding: "0 28px 20px" }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
              borderRadius: "12px",
              padding: "20px 24px",
              display: "flex",
              gap: "28px",
            }}
          >
            {/* Left: headline */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                Financing Scenario
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", marginBottom: "2px" }}>
                {scenario.label || `${scenario.term}yr ${scenario.loanType}`}
              </div>
              {scenario.interestRate && (
                <div style={{ fontSize: "38px", fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
                  {formatRate(scenario.interestRate)}
                </div>
              )}
              {scenario.apr && (
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>
                  APR {formatRate(scenario.apr)}
                </div>
              )}
            </div>

            {/* Right: breakdown */}
            <div style={{ flex: 1 }}>
              {scenario.purchasePrice && (
                <ScenarioRow label="Purchase Price" value={formatCurrency(scenario.purchasePrice)} />
              )}
              {scenario.downPaymentPercent !== undefined && (
                <ScenarioRow
                  label="Down Payment"
                  value={`${scenario.downPaymentPercent}% (${scenario.downPaymentAmount ? formatCurrency(scenario.downPaymentAmount) : ""})`}
                />
              )}
              {scenario.loanAmount && (
                <ScenarioRow label="Loan Amount" value={formatCurrency(scenario.loanAmount)} />
              )}
              {scenario.piPayment && (
                <ScenarioRow label="P&I" value={`${formatCurrency(scenario.piPayment)}/mo`} />
              )}
              {scenario.taxesInsurance && (
                <ScenarioRow label="Taxes & Insurance" value={`${formatCurrency(scenario.taxesInsurance)}/mo`} />
              )}
              {scenario.miPayment && (
                <ScenarioRow label="MI" value={`${formatCurrency(scenario.miPayment)}/mo`} />
              )}
              {scenario.hoaFee && (
                <ScenarioRow label="HOA" value={`${formatCurrency(scenario.hoaFee)}/mo`} />
              )}
              {scenario.monthlyPayment && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0 0",
                    borderTop: "2px solid rgba(255,255,255,0.3)",
                    marginTop: "4px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff" }}>Total Monthly</span>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff" }}>
                    {formatCurrency(scenario.monthlyPayment)}/mo
                  </span>
                </div>
              )}
            </div>
          </div>
          <p style={{ fontSize: "8px", color: "#94a3b8", marginTop: "6px", lineHeight: "1.4" }}>
            *Estimated payment. Actual payment may vary. Rates subject to change. Contact your loan officer for details.
          </p>
        </div>
      )}

      <div style={{ flex: 1 }} />

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

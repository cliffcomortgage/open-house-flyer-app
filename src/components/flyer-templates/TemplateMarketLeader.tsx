import type { LoanOfficer, Realtor, CompanySettings, PropertyData, LoanScenario } from "@/types";
import { FlyerFooter } from "./FlyerFooter";
import { formatCurrency, formatRate } from "@/lib/utils";

interface TemplateMarketLeaderProps {
  propertyData: PropertyData;
  loanOfficer: LoanOfficer;
  realtor: Realtor | null;
  company: CompanySettings;
  qrCodeDataUrl: string | null;
  loanScenarios?: LoanScenario[];
}

function ScenarioColumn({
  scenario,
  primaryColor,
  index,
}: {
  scenario: LoanScenario;
  primaryColor: string;
  index: number;
}) {
  const headerBg = index === 0 ? primaryColor : index === 1 ? `${primaryColor}cc` : `${primaryColor}99`;

  return (
    <div
      style={{
        flex: 1,
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: headerBg,
          padding: "12px 14px",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "13px", lineHeight: 1.2 }}>
          {scenario.label || `${scenario.term}yr ${scenario.loanType}`}
        </div>
        {scenario.loanType && scenario.loanType !== scenario.label && (
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "10px", marginTop: "2px" }}>
            {scenario.loanType}
          </div>
        )}
      </div>

      {/* Rate highlight */}
      {scenario.interestRate && (
        <div
          style={{
            textAlign: "center",
            padding: "12px 8px",
            borderBottom: "1px solid #f1f5f9",
            background: "#fafafa",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b" }}>
            {formatRate(scenario.interestRate)}
          </div>
          {scenario.apr && (
            <div style={{ fontSize: "10px", color: "#64748b" }}>
              APR {formatRate(scenario.apr)}
            </div>
          )}
        </div>
      )}

      {/* Breakdown table */}
      <div style={{ padding: "10px 14px" }}>
        {scenario.downPaymentPercent !== undefined && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "10.5px" }}>
            <span style={{ color: "#64748b" }}>Down</span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>{scenario.downPaymentPercent}%</span>
          </div>
        )}
        {scenario.loanAmount && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "10.5px", borderTop: "1px solid #f8fafc" }}>
            <span style={{ color: "#64748b" }}>Loan Amt</span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>{formatCurrency(scenario.loanAmount)}</span>
          </div>
        )}
        {scenario.piPayment && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "10.5px", borderTop: "1px solid #f8fafc" }}>
            <span style={{ color: "#64748b" }}>P&I</span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>{formatCurrency(scenario.piPayment)}/mo</span>
          </div>
        )}
        {scenario.taxesInsurance && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "10.5px", borderTop: "1px solid #f8fafc" }}>
            <span style={{ color: "#64748b" }}>Tax+Ins</span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>{formatCurrency(scenario.taxesInsurance)}/mo</span>
          </div>
        )}
        {scenario.miPayment && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "10.5px", borderTop: "1px solid #f8fafc" }}>
            <span style={{ color: "#64748b" }}>MI</span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>{formatCurrency(scenario.miPayment)}/mo</span>
          </div>
        )}
        {scenario.hoaFee && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "10.5px", borderTop: "1px solid #f8fafc" }}>
            <span style={{ color: "#64748b" }}>HOA</span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>{formatCurrency(scenario.hoaFee)}/mo</span>
          </div>
        )}
        {scenario.monthlyPayment && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "7px 0 4px",
              borderTop: "2px solid #e5e7eb",
              marginTop: "4px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e293b" }}>Total/mo</span>
            <span style={{ fontSize: "13px", fontWeight: 800, color: primaryColor }}>
              {formatCurrency(scenario.monthlyPayment)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function TemplateMarketLeader({
  propertyData,
  loanOfficer,
  realtor,
  company,
  qrCodeDataUrl,
  loanScenarios,
}: TemplateMarketLeaderProps) {
  const primaryColor = realtor?.brandPrimary || company.primaryColor || "#6633cc";
  const secondaryColor = realtor?.brandSecondary || company.secondaryColor || "#0d0d0d";
  const photos = propertyData.photos || [];
  const scenarios = (loanScenarios || []).slice(0, 3);

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
      {/* Photo strip — 3 photos side by side */}
      <div style={{ display: "flex", height: "280px", flexShrink: 0, gap: "3px" }}>
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              overflow: "hidden",
              background: `${primaryColor}${idx === 0 ? "" : idx === 1 ? "cc" : "88"}`,
            }}
          >
            {photos[idx] ? (
              <img
                src={photos[idx]}
                alt={`Property ${idx + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `${primaryColor}${idx === 0 ? "ff" : idx === 1 ? "bb" : "77"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "40px", opacity: 0.3 }}>🏡</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Property info bar */}
      <div
        style={{
          background: "#f8fafc",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#1e293b" }}>
            {propertyData.price ? formatCurrency(propertyData.price) : "Price Upon Request"}
          </div>
          <div style={{ fontSize: "14px", color: "#475569", marginTop: "2px" }}>
            {[propertyData.address, propertyData.city, propertyData.state].filter(Boolean).join(", ")}
            {propertyData.zipCode ? ` ${propertyData.zipCode}` : ""}
          </div>
        </div>

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
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>{stat!.value}</div>
                <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {stat!.label}
                </div>
              </div>
            ))}
        </div>

        {/* Open house badge */}
        {propertyData.openHouseDate && (
          <div
            style={{
              background: primaryColor,
              color: "#ffffff",
              padding: "10px 16px",
              borderRadius: "8px",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.85 }}>
              Open House
            </div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>
              {new Date(propertyData.openHouseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            {(propertyData.openHouseStartTime || propertyData.openHouseEndTime) && (
              <div style={{ fontSize: "10px", opacity: 0.85 }}>
                {propertyData.openHouseStartTime}
                {propertyData.openHouseEndTime ? `–${propertyData.openHouseEndTime}` : ""}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Three scenario columns */}
      {scenarios.length > 0 && (
        <div style={{ padding: "20px 28px 16px", flex: 1 }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "12px",
            }}
          >
            Financing Options
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {scenarios.map((s, idx) => (
              <ScenarioColumn
                key={idx}
                scenario={s}
                primaryColor={primaryColor}
                index={idx}
              />
            ))}
            {/* Fill empty columns */}
            {scenarios.length === 1 && <div style={{ flex: 2 }} />}
            {scenarios.length === 2 && <div style={{ flex: 1 }} />}
          </div>
          <p style={{ fontSize: "8px", color: "#94a3b8", marginTop: "8px", lineHeight: "1.4" }}>
            *Rates shown are for illustrative purposes only. Actual rates may vary. Contact your loan officer for a personalized quote.
          </p>
        </div>
      )}

      {/* Description (when no scenarios) */}
      {scenarios.length === 0 && propertyData.description && (
        <div style={{ padding: "20px 28px", flex: 1 }}>
          <div style={{ fontSize: "12px", color: "#475569", lineHeight: "1.7" }}>
            {propertyData.description.slice(0, 400)}
            {propertyData.description.length > 400 ? "…" : ""}
          </div>
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

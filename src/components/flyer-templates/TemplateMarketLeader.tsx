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
}: {
  scenario: LoanScenario;
  primaryColor: string;
}) {
  const rows = [
    scenario.downPaymentPercent !== undefined
      ? { label: "Down", value: `${scenario.downPaymentPercent}%` }
      : null,
    scenario.loanAmount
      ? { label: "Loan Amt", value: formatCurrency(scenario.loanAmount) }
      : null,
    scenario.piPayment
      ? { label: "P&I", value: `${formatCurrency(scenario.piPayment)}/mo` }
      : null,
    scenario.taxesInsurance
      ? { label: "Tax+Ins", value: `${formatCurrency(scenario.taxesInsurance)}/mo` }
      : null,
    scenario.miPayment
      ? { label: "MI", value: `${formatCurrency(scenario.miPayment)}/mo` }
      : null,
    scenario.hoaFee
      ? { label: "HOA", value: `${formatCurrency(scenario.hoaFee)}/mo` }
      : null,
  ].filter(Boolean);

  return (
    <div
      style={{
        flex: 1,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Label header */}
      <div
        style={{
          borderBottom: `2px solid ${primaryColor}`,
          padding: "9px 12px",
          background: "#fafafa",
        }}
      >
        <div
          style={{
            fontSize: "9px",
            fontWeight: 700,
            color: primaryColor,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {scenario.label ||
            [scenario.term && `${scenario.term}yr`, scenario.loanType]
              .filter(Boolean)
              .join(" ")}
        </div>
      </div>

      {/* Rate */}
      {scenario.interestRate && (
        <div
          style={{
            textAlign: "center",
            padding: "13px 8px 10px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              fontSize: "36px",
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1,
              letterSpacing: "-1.5px",
            }}
          >
            {formatRate(scenario.interestRate)}
          </div>
          {scenario.apr && (
            <div
              style={{ fontSize: "9px", color: "#94a3b8", marginTop: "4px", letterSpacing: "0.04em" }}
            >
              APR {formatRate(scenario.apr)}
            </div>
          )}
        </div>
      )}

      {/* Breakdown rows */}
      <div style={{ padding: "9px 12px", flex: 1 }}>
        {rows.map((row, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
              fontSize: "10px",
              borderTop: idx > 0 ? "1px solid #f8fafc" : "none",
            }}
          >
            <span style={{ color: "#64748b" }}>{row!.label}</span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>{row!.value}</span>
          </div>
        ))}

        {scenario.monthlyPayment && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "7px 0 2px",
              borderTop: "1px solid #e2e8f0",
              marginTop: "5px",
            }}
          >
            <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#0f172a" }}>Total/mo</span>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 900,
                color: primaryColor,
                letterSpacing: "-0.5px",
              }}
            >
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
  const photos = propertyData.photos || [];
  const scenarios = (loanScenarios || []).slice(0, 3);

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
    propertyData.bedrooms ? { label: "Beds", value: propertyData.bedrooms } : null,
    propertyData.bathrooms ? { label: "Baths", value: propertyData.bathrooms } : null,
    propertyData.squareFeet
      ? { label: "Sq Ft", value: propertyData.squareFeet.toLocaleString() }
      : null,
    propertyData.yearBuilt ? { label: "Built", value: propertyData.yearBuilt } : null,
    propertyData.garage ? { label: "Garage", value: propertyData.garage } : null,
  ].filter(Boolean);

  return (
    <div
      style={{
        width: "816px",
        height: "1056px",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Brand accent bar */}
      <div style={{ height: "3px", background: primaryColor, flexShrink: 0 }} />

      {/* Editorial header — white, generous padding */}
      <div style={{ padding: "18px 36px 0", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
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
              <div
                style={{ fontSize: "13px", color: "#475569", marginTop: "4px", fontWeight: 400 }}
              >
                {formattedDate ||
                  [propertyData.city, propertyData.state].filter(Boolean).join(", ")}
                {formattedDate && timeStr && (
                  <span style={{ color: "#94a3b8" }}> · {timeStr}</span>
                )}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "50px",
                fontWeight: 900,
                color: "#0f172a",
                lineHeight: 1,
                letterSpacing: "-2px",
              }}
            >
              {propertyData.price ? formatCurrency(propertyData.price) : ""}
            </div>
            {propertyData.mlsNumber && (
              <div
                style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px", letterSpacing: "0.04em" }}
              >
                MLS# {propertyData.mlsNumber}
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div style={{ marginTop: "10px" }}>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>
            {propertyData.address}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
            {[propertyData.city, propertyData.state, propertyData.zipCode]
              .filter(Boolean)
              .join(", ")}
          </div>
        </div>
      </div>

      {/* Thin accent rule */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor}44 60%, transparent 100%)`,
          margin: "12px 36px 0",
          flexShrink: 0,
        }}
      />

      {/* Photo strip: 60% large + 40% two stacked */}
      <div
        style={{
          display: "flex",
          height: "280px",
          flexShrink: 0,
          gap: "2px",
          marginTop: "10px",
        }}
      >
        {/* Main photo */}
        <div
          style={{
            width: "60%",
            overflow: "hidden",
            flexShrink: 0,
            background: "#e8edf2",
          }}
        >
          {photos[0] ? (
            <img
              src={photos[0]}
              alt="Property main"
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
              <span style={{ fontSize: "56px", opacity: 0.07 }}>🏡</span>
            </div>
          )}
        </div>

        {/* Two stacked photos */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
          {[1, 2].map((idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                overflow: "hidden",
                background: "#e8edf2",
                opacity: idx === 2 ? 0.9 : 1,
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
      </div>

      {/* Stats strip */}
      {stats.length > 0 && (
        <div style={{ padding: "14px 36px 0", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "12px",
            }}
          >
            {stats.map((stat, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  textAlign: "center",
                  borderRight: idx < stats.length - 1 ? "1px solid #e2e8f0" : "none",
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

      {/* Scenarios or description — yields space to the footer/disclaimer below, which must never be clipped */}
      {scenarios.length > 0 ? (
        <div style={{ padding: "18px 36px 0", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              marginBottom: "12px",
            }}
          >
            Financing Options
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {scenarios.map((s, idx) => (
              <ScenarioColumn key={idx} scenario={s} primaryColor={primaryColor} />
            ))}
            {scenarios.length === 1 && <div style={{ flex: 2 }} />}
            {scenarios.length === 2 && <div style={{ flex: 1 }} />}
          </div>
          <p
            style={{
              fontSize: "7.5px",
              color: "#94a3b8",
              marginTop: "8px",
              lineHeight: "1.4",
            }}
          >
            *Rates shown for illustrative purposes only. Actual rates may vary. Contact your loan
            officer for a personalized quote.
          </p>
        </div>
      ) : propertyData.description ? (
        <div style={{ padding: "18px 36px 0", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div style={{ fontSize: "12px", color: "#475569", lineHeight: "1.72" }}>
            {propertyData.description.slice(0, 360)}
            {propertyData.description.length > 360 ? "…" : ""}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
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

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
  distributionState?: string | null;
}

function ScenarioRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 0",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span style={{ fontSize: "10.5px", color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: "11px", fontWeight: 600, color: "#1e293b" }}>{value}</span>
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
  distributionState,
}: TemplateShowcaseOneRateProps) {
  const primaryColor = realtor?.brandPrimary || company.primaryColor || "#6633cc";
  const heroPhoto = propertyData.photos?.[0];
  const scenario = loanScenarios?.[0];

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

      {/* Hero photo — full bleed, no gradient */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "350px",
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

        {/* Open house badge — thin outline, inside photo */}
        {propertyData.openHouseDate && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "24px",
              border: "1px solid rgba(255,255,255,0.72)",
              backgroundColor: "rgba(0,0,0,0.32)",
              padding: "7px 18px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: "#ffffff",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Open House
            </span>
          </div>
        )}
      </div>

      {/* Price + address — white, editorial */}
      <div style={{ padding: "24px 36px 0", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "62px",
                fontWeight: 900,
                color: "#0f172a",
                lineHeight: 1,
                letterSpacing: "-3px",
              }}
            >
              {propertyData.price ? formatCurrency(propertyData.price) : "Price Upon Request"}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginTop: "11px",
              }}
            >
              <div
                style={{
                  height: "1px",
                  width: "44px",
                  background: primaryColor,
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: "14px", color: "#475569", fontWeight: 400 }}>
                {addressLine}
              </div>
            </div>
          </div>

          {/* Date/time badge — editorial, thin border */}
          {formattedDate && (
            <div
              style={{
                flexShrink: 0,
                border: "1px solid #e2e8f0",
                padding: "12px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: primaryColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                Open House
              </div>
              <div
                style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}
              >
                {formattedDate}
              </div>
              {timeStr && (
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                  {timeStr}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats + description */}
      <div style={{ padding: "18px 36px 0", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            gap: "24px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "16px",
          }}
        >
          {stats.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "20px",
                flexShrink: 0,
                alignItems: "flex-start",
              }}
            >
              {stats.map((stat, idx) => (
                <div key={idx} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "26px",
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
          )}

          {propertyData.description && (
            <div
              style={{
                flex: 1,
                fontSize: "11px",
                color: "#64748b",
                lineHeight: "1.70",
                borderLeft: stats.length > 0 ? "1px solid #e2e8f0" : "none",
                paddingLeft: stats.length > 0 ? "20px" : "0",
              }}
            >
              {propertyData.description.slice(0, 220)}
              {propertyData.description.length > 220 ? "…" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Loan scenario — white, editorial. Fixed to its natural size so rows are never mid-clipped */}
      {scenario && (
        <div style={{ padding: "14px 36px 0", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              marginBottom: "10px",
            }}
          >
            Financing Scenario
          </div>

          <div
            style={{
              border: `1px solid ${primaryColor}`,
              display: "flex",
              gap: "0",
            }}
          >
            {/* Rate column */}
            <div
              style={{
                padding: "14px 24px",
                minWidth: "180px",
                flexShrink: 0,
                borderRight: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {scenario.label && (
                <div
                  style={{
                    fontSize: "9px",
                    color: primaryColor,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    fontWeight: 700,
                    marginBottom: "6px",
                  }}
                >
                  {scenario.label}
                </div>
              )}
              {!scenario.label && (scenario.term || scenario.loanType) && (
                <div
                  style={{
                    fontSize: "9px",
                    color: primaryColor,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    fontWeight: 700,
                    marginBottom: "6px",
                  }}
                >
                  {[scenario.term && `${scenario.term}yr`, scenario.loanType]
                    .filter(Boolean)
                    .join(" ")}
                </div>
              )}
              {scenario.interestRate && (
                <div
                  style={{
                    fontSize: "58px",
                    fontWeight: 900,
                    color: "#0f172a",
                    lineHeight: 1,
                    letterSpacing: "-3px",
                  }}
                >
                  {formatRate(scenario.interestRate)}
                </div>
              )}
              <div
                style={{
                  height: "2px",
                  width: "32px",
                  background: primaryColor,
                  margin: "10px 0",
                }}
              />
              {scenario.apr && (
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  APR {formatRate(scenario.apr)}
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div
              style={{
                flex: 1,
                padding: "12px 24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {scenario.purchasePrice && (
                <ScenarioRow
                  label="Purchase Price"
                  value={formatCurrency(scenario.purchasePrice)}
                />
              )}
              {scenario.downPaymentPercent !== undefined && (
                <ScenarioRow
                  label="Down Payment"
                  value={`${scenario.downPaymentPercent}%${
                    scenario.downPaymentAmount
                      ? ` (${formatCurrency(scenario.downPaymentAmount)})`
                      : ""
                  }`}
                />
              )}
              {scenario.loanAmount && (
                <ScenarioRow
                  label="Loan Amount"
                  value={formatCurrency(scenario.loanAmount)}
                />
              )}
              {scenario.piPayment && (
                <ScenarioRow
                  label="P&I Payment"
                  value={`${formatCurrency(scenario.piPayment)}/mo`}
                />
              )}
              {scenario.taxesInsurance && (
                <ScenarioRow
                  label="Taxes & Insurance"
                  value={`${formatCurrency(scenario.taxesInsurance)}/mo`}
                />
              )}
              {scenario.miPayment && (
                <ScenarioRow label="MI" value={`${formatCurrency(scenario.miPayment)}/mo`} />
              )}
              {scenario.upfrontMip && (
                <ScenarioRow label="Upfront MIP" value={formatCurrency(scenario.upfrontMip)} />
              )}
              {scenario.monthlyMip && (
                <ScenarioRow label="Monthly MIP" value={`${formatCurrency(scenario.monthlyMip)}/mo`} />
              )}
              {scenario.vaFundingFee && (
                <ScenarioRow label="VA Funding Fee" value={formatCurrency(scenario.vaFundingFee)} />
              )}
              {scenario.usdaGuaranteeFee && (
                <ScenarioRow label="Upfront Guarantee Fee" value={formatCurrency(scenario.usdaGuaranteeFee)} />
              )}
              {scenario.usdaAnnualFee && (
                <ScenarioRow label="Annual Fee" value={`${formatCurrency(scenario.usdaAnnualFee)}/mo`} />
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
                    padding: "10px 0 0",
                    borderTop: "1px solid #e2e8f0",
                    marginTop: "5px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a" }}>
                    Estimated Monthly Payment
                  </span>
                  <span
                    style={{
                      fontSize: "22px",
                      fontWeight: 900,
                      color: primaryColor,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {formatCurrency(scenario.monthlyPayment)}/mo
                  </span>
                </div>
              )}
            </div>
          </div>

          <p
            style={{
              fontSize: "7.5px",
              color: "#94a3b8",
              marginTop: "7px",
              lineHeight: "1.4",
            }}
          >
            *Estimated payment for illustrative purposes only. Rates subject to change without
            notice. Contact your loan officer for a personalized quote.
          </p>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <FlyerFooter
        loanOfficer={loanOfficer}
        realtor={realtor}
        company={company}
        qrCodeDataUrl={qrCodeDataUrl}
        distributionState={distributionState}
        loanScenarios={scenario ? [scenario] : undefined}
      />
    </div>
  );
}

import type { LoanOfficer, Realtor, CompanySettings, PropertyData, LoanScenario } from "@/types";
import { FlyerFooter } from "./FlyerFooter";
import { PositionableImage, type PhotoPosition } from "./PositionableImage";
import { formatCurrency, formatRate, formatTime } from "@/lib/utils";

interface TemplateShowcaseOneRateProps {
  propertyData: PropertyData;
  loanOfficer: LoanOfficer;
  realtor: Realtor | null;
  company: CompanySettings;
  qrCodeDataUrl: string | null;
  loanScenarios?: LoanScenario[];
  distributionState?: string | null;
  onPhotoPositionChange?: (photoUrl: string, position: PhotoPosition) => void;
}

function ScenarioRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "10.5px", color: "#64748b" }}>{label}</span>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#1e293b" }}>{value}</span>
      </div>
      {note && (
        <p style={{ fontSize: "7.5px", color: "#94a3b8", margin: "2px 0 0", lineHeight: 1.3 }}>{note}</p>
      )}
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
  onPhotoPositionChange,
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

  const timeStr = [formatTime(propertyData.openHouseStartTime), formatTime(propertyData.openHouseEndTime)]
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
          height: "290px",
          flexShrink: 0,
          overflow: "hidden",
          background: "#e8edf2",
        }}
      >
        {heroPhoto ? (
          <PositionableImage
            src={heroPhoto}
            alt="Property"
            style={{ width: "100%", height: "100%" }}
            position={propertyData.photoPositions?.[heroPhoto]}
            onPositionChange={
              onPhotoPositionChange ? (pos) => onPhotoPositionChange(heroPhoto, pos) : undefined
            }
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
              {propertyData.headline || "Open House"}
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
                {propertyData.headline || "Open House"}
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

      {/* Stats + description — grows to fill remaining space */}
      <div style={{ padding: "18px 36px 0", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            gap: "24px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "16px",
            height: "100%",
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
                minWidth: 0,
                fontSize: `${propertyData.descriptionFontSize || 11}px`,
                color: "#64748b",
                lineHeight: "1.70",
                borderLeft: stats.length > 0 ? "1px solid #e2e8f0" : "none",
                paddingLeft: stats.length > 0 ? "20px" : "0",
                display: "-webkit-box",
                WebkitLineClamp: 14,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {propertyData.description}
            </div>
          )}
        </div>
      </div>

      {/* Loan scenario — white, editorial. Fixed to its natural size so rows are never mid-clipped */}
      {scenario && (
        <div style={{ padding: "8px 36px 0", flexShrink: 0 }}>
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

          <div style={{ border: `1px solid ${primaryColor}` }}>
            {/* Header: label + term badge. Rate/APR no longer get an oversized
                showcase treatment — they're just rows below, same as everything else. */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                padding: "8px 16px",
                borderBottom: `2px solid ${primaryColor}`,
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: primaryColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                }}
              >
                {scenario.label ||
                  [scenario.term && `${scenario.term}yr`, scenario.loanType].filter(Boolean).join(" ")}
              </div>
              {scenario.term && (
                <div
                  style={{
                    fontSize: "8.5px",
                    color: "#64748b",
                    background: "#eef2f6",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {scenario.term} year fixed rate
                </div>
              )}
            </div>

            <div
              style={{
                padding: "12px 24px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: "32px",
              }}
            >
              {scenario.interestRate && (
                <ScenarioRow label="Rate" value={formatRate(scenario.interestRate)} />
              )}
              {scenario.apr && <ScenarioRow label="APR" value={formatRate(scenario.apr)} />}
              {scenario.purchasePrice && (
                <ScenarioRow
                  label="Purchase Price"
                  value={formatCurrency(scenario.purchasePrice)}
                />
              )}
              {scenario.loanType === "FHA" ? (
                <>
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
                    <ScenarioRow label="Base Loan Amount" value={formatCurrency(scenario.loanAmount)} />
                  )}
                  {scenario.upfrontMip && (
                    <ScenarioRow label="Upfront MIP (Financed)" value={formatCurrency(scenario.upfrontMip)} />
                  )}
                  {scenario.loanAmount && scenario.upfrontMip && (
                    <ScenarioRow
                      label="Fully Financed Loan Amount"
                      value={formatCurrency(scenario.loanAmount + scenario.upfrontMip)}
                    />
                  )}
                  {scenario.piPayment && (
                    <ScenarioRow label="P&I" value={`${formatCurrency(scenario.piPayment)}/mo`} />
                  )}
                  {scenario.taxesInsurance && (
                    <ScenarioRow
                      label="Taxes and Insurance"
                      value={`${formatCurrency(scenario.taxesInsurance)}/mo`}
                    />
                  )}
                  {scenario.monthlyMip && (
                    <ScenarioRow label="Monthly MIP" value={`${formatCurrency(scenario.monthlyMip)}/mo`} />
                  )}
                  {scenario.hoaFee && (
                    <ScenarioRow label="HOA" value={`${formatCurrency(scenario.hoaFee)}/mo`} />
                  )}
                </>
              ) : (
                <>
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
                      label="Taxes and Insurance"
                      value={`${formatCurrency(scenario.taxesInsurance)}/mo`}
                    />
                  )}
                  {scenario.miPayment && (
                    <ScenarioRow
                      label="MI"
                      value={`${formatCurrency(scenario.miPayment)}/mo`}
                      note="MI quote based on estimated 700 credit score"
                    />
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
                </>
              )}
            </div>

            {scenario.monthlyPayment && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 24px",
                  borderTop: `1px solid ${primaryColor}`,
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

"use client";

import type { Flyer, CompanySettings } from "@/types";
import { TemplateModernMinimal } from "./TemplateModernMinimal";
import { TemplateGalleryGrid } from "./TemplateGalleryGrid";
import { TemplateShowcaseOneRate } from "./TemplateShowcaseOneRate";
import { TemplateMarketLeader } from "./TemplateMarketLeader";

interface FlyerPreviewProps {
  flyer: Flyer;
  company: CompanySettings;
  qrCodeDataUrl: string | null;
  scale?: number;
}

export function FlyerPreview({
  flyer,
  company,
  qrCodeDataUrl,
  scale = 0.5,
}: FlyerPreviewProps) {
  if (!flyer.loanOfficer || !flyer.propertyData) {
    return (
      <div
        style={{
          width: `${816 * scale}px`,
          height: `${400 * scale}px`,
          background: "#f8fafc",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px dashed #e2e8f0",
        }}
      >
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Preview unavailable</p>
      </div>
    );
  }

  const templateProps = {
    propertyData: flyer.propertyData,
    loanOfficer: flyer.loanOfficer,
    realtor: flyer.realtor || null,
    company,
    qrCodeDataUrl,
    loanScenarios: flyer.loanScenarios || undefined,
    distributionState: flyer.distributionState,
  };

  const renderTemplate = () => {
    switch (flyer.templateId) {
      case "modern-minimal":
        return <TemplateModernMinimal {...templateProps} />;
      case "gallery-grid":
        return <TemplateGalleryGrid {...templateProps} />;
      case "showcase-one-rate":
        return <TemplateShowcaseOneRate {...templateProps} />;
      case "market-leader":
        return <TemplateMarketLeader {...templateProps} />;
      default:
        return <TemplateModernMinimal {...templateProps} />;
    }
  };

  return (
    <div
      style={{
        width: `${816 * scale}px`,
        height: `${1056 * scale}px`,
        overflow: "hidden",
        borderRadius: `${8 / scale}px`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: "816px",
          height: "1056px",
        }}
      >
        {renderTemplate()}
      </div>
    </div>
  );
}

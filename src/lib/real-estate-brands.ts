import type { REBrand } from "@/types";

export const RE_BRANDS: REBrand[] = [
  {
    name: "Keller Williams",
    aliases: ["keller williams", "kw realty", "kw"],
    primaryColor: "#B40101",
    secondaryColor: "#707372",
  },
  {
    name: "RE/MAX",
    aliases: ["remax", "re/max", "re max"],
    primaryColor: "#DC1C2E",
    secondaryColor: "#003DA5",
  },
  {
    name: "Coldwell Banker",
    aliases: ["coldwell banker", "coldwell"],
    primaryColor: "#003399",
    secondaryColor: "#FFFFFF",
  },
  {
    name: "Compass",
    aliases: ["compass"],
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
  },
  {
    name: "eXp Realty",
    aliases: ["exp realty", "exp realty llc", "exp"],
    primaryColor: "#19469D",
    secondaryColor: "#00A3E0",
  },
  {
    name: "Century 21",
    aliases: ["century 21", "c21"],
    primaryColor: "#EAAA00",
    secondaryColor: "#000000",
  },
  {
    name: "Berkshire Hathaway HomeServices",
    aliases: ["berkshire hathaway", "bhhs", "berkshire hathaway homeservices"],
    primaryColor: "#552448",
    secondaryColor: "#E7E0C5",
  },
  {
    name: "Sotheby's International Realty",
    aliases: ["sotheby's", "sothebys", "sotheby", "sotheby's international"],
    primaryColor: "#0C2340",
    secondaryColor: "#999999",
  },
  {
    name: "Douglas Elliman",
    aliases: ["douglas elliman", "elliman"],
    primaryColor: "#0084B4",
    secondaryColor: "#6B7280",
  },
  {
    name: "Corcoran",
    aliases: ["corcoran"],
    primaryColor: "#000000",
    secondaryColor: "#E06A78",
  },
  {
    // Colors are a directional estimate (confirmed forest-green + gold since
    // their Sept. 2025 rebrand) — exact hex not verified against an official
    // source. Update once confirmed.
    name: "Howard Hanna",
    aliases: ["howard hanna", "hanna"],
    primaryColor: "#1A4D2E",
    secondaryColor: "#C9A227",
  },
  {
    name: "Long & Foster",
    aliases: ["long & foster", "long and foster", "long foster"],
    primaryColor: "#041E3F",
    secondaryColor: "#F15F41",
  },
  {
    name: "Weichert Realtors",
    aliases: ["weichert", "weichert realtors"],
    primaryColor: "#FFD700",
    secondaryColor: "#000000",
  },
  {
    name: "Better Homes and Gardens",
    aliases: ["better homes and gardens", "bhg real estate"],
    primaryColor: "#006633",
    secondaryColor: "#FFFFFF",
  },
  {
    name: "ERA Real Estate",
    aliases: ["era real estate", "era realty"],
    primaryColor: "#CC0000",
    secondaryColor: "#FFFFFF",
  },
  {
    name: "Redfin",
    aliases: ["redfin"],
    primaryColor: "#A02021",
    secondaryColor: "#FFFFFF",
  },
];

export function detectBrand(companyName: string): REBrand | null {
  if (!companyName) return null;
  const normalized = companyName.toLowerCase().trim();
  return (
    RE_BRANDS.find((brand) =>
      brand.aliases.some((alias) => normalized.includes(alias))
    ) || null
  );
}

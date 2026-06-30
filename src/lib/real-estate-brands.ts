import type { REBrand } from "@/types";

export const RE_BRANDS: REBrand[] = [
  {
    name: "Keller Williams",
    aliases: ["keller williams", "kw realty", "kw"],
    primaryColor: "#B40101",
    secondaryColor: "#000000",
  },
  {
    name: "RE/MAX",
    aliases: ["remax", "re/max", "re max"],
    primaryColor: "#DC143C",
    secondaryColor: "#003DA5",
  },
  {
    name: "Coldwell Banker",
    aliases: ["coldwell banker", "coldwell"],
    primaryColor: "#003087",
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
    primaryColor: "#004C8C",
    secondaryColor: "#00A3E0",
  },
  {
    name: "Century 21",
    aliases: ["century 21", "c21"],
    primaryColor: "#B59A5A",
    secondaryColor: "#000000",
  },
  {
    name: "Berkshire Hathaway HomeServices",
    aliases: ["berkshire hathaway", "bhhs", "berkshire hathaway homeservices"],
    primaryColor: "#4B0082",
    secondaryColor: "#C4A44C",
  },
  {
    name: "Sotheby's International Realty",
    aliases: ["sotheby's", "sothebys", "sotheby", "sotheby's international"],
    primaryColor: "#002B5C",
    secondaryColor: "#C4A44C",
  },
  {
    name: "Douglas Elliman",
    aliases: ["douglas elliman", "elliman"],
    primaryColor: "#000000",
    secondaryColor: "#BE9A5B",
  },
  {
    name: "Corcoran",
    aliases: ["corcoran"],
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
  },
  {
    name: "Howard Hanna",
    aliases: ["howard hanna", "hanna"],
    primaryColor: "#CC0000",
    secondaryColor: "#FFFFFF",
  },
  {
    name: "Long & Foster",
    aliases: ["long & foster", "long and foster", "long foster"],
    primaryColor: "#003087",
    secondaryColor: "#CC0000",
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
    primaryColor: "#CC0033",
    secondaryColor: "#FFFFFF",
  },
  {
    name: "Engel & Völkers",
    aliases: ["engel & volkers", "engel and volkers", "engel volkers"],
    primaryColor: "#CC0000",
    secondaryColor: "#000000",
  },
  {
    name: "Brown Harris Stevens",
    aliases: ["brown harris stevens", "bhs"],
    primaryColor: "#000000",
    secondaryColor: "#8B7355",
  },
  {
    name: "Halstead",
    aliases: ["halstead"],
    primaryColor: "#000000",
    secondaryColor: "#CC0000",
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

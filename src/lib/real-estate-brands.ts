import type { REBrand } from "@/types";

export const RE_BRANDS: REBrand[] = [
  {
    name: "Keller Williams",
    aliases: ["keller williams", "kw realty", "kw"],
    primaryColor: "#B40101",
    secondaryColor: "#999999",
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
    primaryColor: "#012169",
    secondaryColor: "#F0F5FB",
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
    primaryColor: "#506CAA",
    secondaryColor: "#31303F",
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
    primaryColor: "#670038",
    secondaryColor: "#FFFFFF",
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
    secondaryColor: "#002A76",
  },
  {
    name: "Corcoran",
    aliases: ["corcoran"],
    primaryColor: "#F05A28",
    secondaryColor: "#58595B",
  },
  {
    name: "Howard Hanna",
    aliases: ["howard hanna", "hanna"],
    primaryColor: "#005A4E",
    secondaryColor: "#B78126",
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
    primaryColor: "#FFDC27",
    secondaryColor: "#8B211E",
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
    primaryColor: "#C8102E",
    secondaryColor: "#202A54",
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

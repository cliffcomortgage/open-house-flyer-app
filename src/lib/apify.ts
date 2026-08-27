import type { PropertyData } from "@/types";

const ZILLOW_SCRAPER_ACTOR_ID = "dYj8mIdQOTfCyxEGU";

interface ZillowScraperItem {
  statusCode?: number;
  statusMessage?: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  livingArea?: number | null;
  lotAreaValue?: number | null;
  lotAreaUnits?: string | null;
  yearBuilt?: number | null;
  description?: string | null;
}

export class ZillowLookupError extends Error {}

/**
 * Looks up a Zillow listing via the Apify "Property V2" scraper and maps
 * the result onto our PropertyData shape. Photos are intentionally not
 * pulled in — the LO uploads their own.
 */
export async function lookupZillowProperty(
  zillowUrl: string
): Promise<Partial<PropertyData>> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    throw new ZillowLookupError("Property lookup isn't configured (missing APIFY_API_TOKEN).");
  }

  const res = await fetch(
    `https://api.apify.com/v2/actors/${ZILLOW_SCRAPER_ACTOR_ID}/run-sync-get-dataset-items?format=json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        input: [{ url: zillowUrl }],
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ZillowLookupError(`Apify request failed (${res.status}): ${body}`);
  }

  const items: ZillowScraperItem[] = await res.json();
  const item = items[0];

  if (!item) {
    throw new ZillowLookupError("No data returned for that listing.");
  }
  if (item.statusCode !== 200) {
    throw new ZillowLookupError(
      `Couldn't fetch that listing (${item.statusMessage || item.statusCode || "unknown error"}). Double-check the URL.`
    );
  }

  const data: Partial<PropertyData> = {};
  if (item.streetAddress) data.address = item.streetAddress;
  if (item.city) data.city = item.city;
  if (item.state) data.state = item.state;
  if (item.zipcode) data.zipCode = item.zipcode;
  if (typeof item.price === "number") data.price = item.price;
  if (typeof item.bedrooms === "number") data.bedrooms = item.bedrooms;
  if (typeof item.bathrooms === "number") data.bathrooms = item.bathrooms;
  if (typeof item.livingArea === "number") data.squareFeet = item.livingArea;
  if (typeof item.lotAreaValue === "number") {
    data.lotSize = item.lotAreaUnits
      ? `${item.lotAreaValue.toLocaleString()} ${item.lotAreaUnits}`
      : String(item.lotAreaValue);
  }
  if (typeof item.yearBuilt === "number") data.yearBuilt = item.yearBuilt;
  if (item.description) data.description = item.description;

  return data;
}

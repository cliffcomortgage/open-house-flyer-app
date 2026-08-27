import type { PropertyData } from "@/types";

const ZILLOW_SCRAPER_ACTOR_ID = "dYj8mIdQOTfCyxEGU";

interface ZillowScraperItem {
  status: string;
  errorCode?: string | null;
  address?: {
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    zipcode?: string | null;
  };
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  livingArea?: number | null;
  lotSize?: string | number | null;
  yearBuilt?: number | null;
  description?: string | null;
}

export class ZillowLookupError extends Error {}

/**
 * Looks up a Zillow listing via the Apify property-details scraper and maps
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
        propertyUrls: [zillowUrl],
        maxItems: 1,
        includePhotos: false,
        includeHistory: false,
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
  if (item.status !== "success") {
    throw new ZillowLookupError(
      item.status === "blocked"
        ? "Zillow blocked this request — try again in a moment."
        : "Couldn't find that listing. Double-check the URL."
    );
  }

  const data: Partial<PropertyData> = {};
  if (item.address?.streetAddress) data.address = item.address.streetAddress;
  if (item.address?.city) data.city = item.address.city;
  if (item.address?.state) data.state = item.address.state;
  if (item.address?.zipcode) data.zipCode = item.address.zipcode;
  if (typeof item.price === "number") data.price = item.price;
  if (typeof item.beds === "number") data.bedrooms = item.beds;
  if (typeof item.baths === "number") data.bathrooms = item.baths;
  if (typeof item.livingArea === "number") data.squareFeet = item.livingArea;
  if (item.lotSize !== null && item.lotSize !== undefined) data.lotSize = String(item.lotSize);
  if (typeof item.yearBuilt === "number") data.yearBuilt = item.yearBuilt;
  if (item.description) data.description = item.description;

  return data;
}

import type { MLSSearchResult, PropertyData } from "@/types";

const BASE_URL =
  process.env.SIMPLYRETS_BASE_URL || "https://api.simplyrets.com";
const API_KEY = process.env.SIMPLYRETS_API_KEY || "simplyrets";
const SECRET = process.env.SIMPLYRETS_SECRET || "simplyrets";

const authHeader =
  "Basic " + Buffer.from(`${API_KEY}:${SECRET}`).toString("base64");

export async function searchMLSListings(
  query: string,
  limit = 10
): Promise<MLSSearchResult[]> {
  const isMLSId = /^\d+$/.test(query.trim());

  // For numeric MLS ID queries, fetch without a text filter and match by listingId
  // (SimplyRETS doesn't support filtering by listingId in the search endpoint)
  const params = new URLSearchParams(
    isMLSId
      ? { limit: "50", status: "Active" }
      : { q: query, limit: String(limit), status: "Active" }
  );

  const res = await fetch(`${BASE_URL}/properties?${params}`, {
    headers: { Authorization: authHeader },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`MLS search failed: ${res.statusText}`);

  const data: any[] = await res.json();

  const filtered = isMLSId
    ? data.filter((l) => String(l.listingId) === query.trim())
    : data;

  return filtered.slice(0, limit).map((listing: any): MLSSearchResult => ({
    mlsId: listing.listingId || listing.mlsId,
    address: listing.address?.full || listing.address?.streetNumber + " " + listing.address?.streetName,
    city: listing.address?.city || "",
    state: listing.address?.state || "",
    zipCode: listing.address?.postalCode || "",
    price: listing.listPrice || 0,
    bedrooms: listing.property?.bedrooms || 0,
    bathrooms: listing.property?.bathsFull || 0,
    squareFeet: listing.property?.area || null,
    photos: listing.photos || [],
    status: listing.mls?.status || "Active",
  }));
}

export async function getMLSListing(mlsId: string): Promise<PropertyData | null> {
  const res = await fetch(`${BASE_URL}/properties/${mlsId}`, {
    headers: { Authorization: authHeader },
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;

  const l = await res.json();

  return {
    address:
      l.address?.full ||
      `${l.address?.streetNumber} ${l.address?.streetName}`,
    city: l.address?.city || "",
    state: l.address?.state || "",
    zipCode: l.address?.postalCode || "",
    price: l.listPrice || 0,
    bedrooms: l.property?.bedrooms || 0,
    bathrooms: l.property?.bathsFull || 0,
    squareFeet: l.property?.area || null,
    lotSize: l.property?.lotSize ? `${l.property.lotSize} sqft` : null,
    yearBuilt: l.property?.yearBuilt || null,
    garage: l.property?.garageSpaces
      ? `${l.property.garageSpaces} Car`
      : null,
    description: l.remarks || null,
    photos: l.photos || [],
    mlsNumber: l.listingId || mlsId,
    openHouseDate: null,
    openHouseStartTime: null,
    openHouseEndTime: null,
  };
}

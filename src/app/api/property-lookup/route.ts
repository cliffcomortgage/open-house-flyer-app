import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { lookupZillowProperty, ZillowLookupError } from "@/lib/apify";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url || typeof url !== "string" || !/^https:\/\/(www\.)?zillow\.com\//.test(url)) {
    return NextResponse.json({ error: "Enter a valid Zillow listing URL" }, { status: 400 });
  }

  try {
    const propertyData = await lookupZillowProperty(url);
    return NextResponse.json({ propertyData });
  } catch (err) {
    const message = err instanceof ZillowLookupError ? err.message : "Property lookup failed";
    console.error("Property lookup error:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

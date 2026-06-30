import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMLSListing } from "@/lib/mls";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ mlsId: string }> }
) {
  const { mlsId } = await context.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const listing = await getMLSListing(mlsId);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return NextResponse.json(listing);
  } catch (err) {
    console.error("MLS lookup error:", err);
    return NextResponse.json({ error: "MLS lookup failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchMLSListings } from "@/lib/mls";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  try {
    const results = await searchMLSListings(q.trim());
    return NextResponse.json(results);
  } catch (err) {
    console.error("MLS search error:", err);
    return NextResponse.json({ error: "MLS search failed" }, { status: 500 });
  }
}

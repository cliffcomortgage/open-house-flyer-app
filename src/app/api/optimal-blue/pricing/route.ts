import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPricingOptions, type PricingRequest } from "@/lib/optimal-blue";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as PricingRequest;

  if (!body.purchasePrice || !body.creditScore || !body.state) {
    return NextResponse.json(
      { error: "purchasePrice, creditScore, and state are required" },
      { status: 400 }
    );
  }

  try {
    const products = await getPricingOptions(body);
    return NextResponse.json(products);
  } catch (err: any) {
    console.error("Optimal Blue pricing error:", err);
    return NextResponse.json(
      { error: err.message || "Pricing request failed" },
      { status: 500 }
    );
  }
}

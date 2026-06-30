import type { OptimalBlueProduct } from "@/types";

const BASE_URL =
  process.env.OPTIMAL_BLUE_BASE_URL || "https://api.optimalblue.com";

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.OPTIMAL_BLUE_CLIENT_ID || "",
      client_secret: process.env.OPTIMAL_BLUE_CLIENT_SECRET || "",
      scope: "pricing",
    }),
  });

  if (!res.ok) throw new Error("Failed to authenticate with Optimal Blue");

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return tokenCache.token;
}

export interface PricingRequest {
  purchasePrice: number;
  downPaymentPercent: number;
  creditScore: number;
  state: string;
  zipCode: string;
  propertyType?: string;
  loanPurpose?: "purchase" | "refinance";
  loanTypes?: string[];
}

export async function getPricingOptions(
  request: PricingRequest
): Promise<OptimalBlueProduct[]> {
  const token = await getAccessToken();
  const loanAmount =
    request.purchasePrice * (1 - request.downPaymentPercent / 100);

  const body = {
    businessChannelId: process.env.OPTIMAL_BLUE_BUSINESS_CHANNEL_ID,
    loanInformation: {
      loanPurpose: request.loanPurpose || "purchase",
      propertyValue: request.purchasePrice,
      loanAmount,
      ltv: request.downPaymentPercent
        ? 100 - request.downPaymentPercent
        : undefined,
    },
    propertyInformation: {
      state: request.state,
      zipCode: request.zipCode,
      propertyType: request.propertyType || "SingleFamily",
    },
    borrowerInformation: {
      creditScore: request.creditScore,
    },
    loanProductCriteria: {
      loanTypes: request.loanTypes || ["Conventional", "FHA", "VA"],
    },
  };

  const res = await fetch(`${BASE_URL}/v1/pricing`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Optimal Blue pricing failed: ${err}`);
  }

  const data = await res.json();

  return (data.products || [])
    .slice(0, 20)
    .map((p: any): OptimalBlueProduct => ({
      productName: p.productName || p.name,
      loanType: p.loanType || "Conventional",
      term: p.term || 30,
      rate: p.rate || p.interestRate,
      apr: p.apr,
      points: p.points || 0,
      price: p.price || 0,
      monthlyPayment: p.monthlyPayment || p.piPayment,
    }));
}

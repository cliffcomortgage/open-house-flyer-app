import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LoanScenario } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function formatRate(rate: number): string {
  return `${rate.toFixed(3)}%`;
}

export function formatCurrencyCents(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Reg Z-style illustrative payment example, required alongside any advertised
 * rate. One sentence per scenario shown on a flyer, each using that
 * scenario's own numbers. Returns null if the scenario is missing a field
 * needed to fill in the sentence accurately.
 */
export function buildRateDisclaimerSentence(scenario: LoanScenario): string | null {
  const { loanAmount, term, interestRate, apr, piPayment, downPaymentPercent } = scenario;
  if (
    !loanAmount ||
    !term ||
    interestRate === undefined ||
    interestRate === null ||
    apr === undefined ||
    apr === null ||
    !piPayment ||
    downPaymentPercent === undefined ||
    downPaymentPercent === null
  ) {
    return null;
  }
  const ltv = 100 - downPaymentPercent;
  const ltvStr = Number.isInteger(ltv) ? `${ltv}` : ltv.toFixed(1);

  return `This example is for illustrative purposes only. The payment for a ${formatCurrency(loanAmount)}, ${term}-year fixed rate loan at ${interestRate.toFixed(2)}% and ${ltvStr}% LTV is ${formatCurrencyCents(piPayment)}. APR is ${apr.toFixed(3)}%. Taxes and insurance not included; adding them will increase the actual payment. Certain state and county loan amount limits may apply. Interest rates shown are subject to change without notice.`;
}

export const LOAN_TYPES = ["Conventional", "FHA", "VA", "USDA", "Jumbo"] as const;

/**
 * Fields required before a loan scenario can be used on a flyer, including
 * loan-type-conditional requirements (conventional/jumbo MI under 20% down,
 * FHA MIP, VA funding fee, USDA guarantee/annual fee). Returns the list of
 * missing field labels — empty means the scenario is complete.
 */
export function getMissingScenarioFields(s: Partial<LoanScenario>): string[] {
  const missing: string[] = [];
  if (!s.label?.trim()) missing.push("Label");
  if (!s.loanType) missing.push("Loan type");
  if (!s.term) missing.push("Term");
  if (!s.purchasePrice) missing.push("Purchase price");
  if (s.downPaymentPercent === undefined || s.downPaymentPercent === null) missing.push("Down payment %");
  if (!s.loanAmount) missing.push("Loan amount");
  if (s.taxesInsurance === undefined || s.taxesInsurance === null) missing.push("Taxes & Insurance");
  if (!s.interestRate) missing.push("Interest rate");
  if (!s.apr) missing.push("APR");

  if (
    (s.loanType === "Conventional" || s.loanType === "Jumbo") &&
    (s.downPaymentPercent ?? 0) < 20 &&
    !s.miPayment
  ) {
    missing.push("MI (required under 20% down)");
  }
  if (s.loanType === "FHA") {
    if (!s.upfrontMip) missing.push("Upfront MIP");
    if (!s.monthlyMip) missing.push("Monthly MIP");
  }
  if (s.loanType === "VA" && !s.vaFundingFee) {
    missing.push("VA Funding Fee");
  }
  if (s.loanType === "USDA") {
    if (!s.usdaGuaranteeFee) missing.push("Upfront Guarantee Fee");
    if (!s.usdaAnnualFee) missing.push("Annual Fee");
  }

  return missing;
}

export function isScenarioComplete(s: Partial<LoanScenario>): boolean {
  return getMissingScenarioFields(s).length === 0;
}

/** Standard fixed-rate fully-amortizing monthly principal & interest payment. */
export function calculateMonthlyPI(
  loanAmount: number,
  annualRatePercent: number,
  termYears: number
): number {
  if (!loanAmount || !termYears) return 0;
  const n = termYears * 12;
  if (!annualRatePercent) return loanAmount / n;
  const r = annualRatePercent / 100 / 12;
  return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function generateShareToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, Loader2, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, calculateMonthlyPI, LOAN_TYPES, getMissingScenarioFields } from "@/lib/utils";
import type { LoanScenario } from "@/types";

const APPROVAL_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  PENDING: { label: "Pending review", className: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock },
  APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: ShieldCheck },
  REJECTED: { label: "Changes requested", className: "bg-red-50 text-red-700 border-red-100", icon: ShieldAlert },
};

export default function ComplianceReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [flyer, setFlyer] = useState<any>(null);
  const [scenarios, setScenarios] = useState<Partial<LoanScenario>[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/compliance/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFlyer(data);
        setScenarios(data.loanScenarios || []);
        setNotes(data.reviewNotes || "");
      })
      .catch(() => toast.error("Failed to load flyer"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const updateScenario = (idx: number, patch: Partial<LoanScenario>) => {
    setScenarios((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...patch };
      const s = updated[idx];

      if (patch.purchasePrice !== undefined || patch.downPaymentPercent !== undefined) {
        const price = s.purchasePrice as number;
        const pct = s.downPaymentPercent as number;
        if (price && pct !== undefined) {
          s.downPaymentAmount = Math.round((price * pct) / 100);
          s.loanAmount = Math.round(price - s.downPaymentAmount!);
        }
      }

      if (
        patch.purchasePrice !== undefined ||
        patch.downPaymentPercent !== undefined ||
        patch.loanAmount !== undefined ||
        patch.interestRate !== undefined ||
        patch.term !== undefined ||
        patch.taxesInsurance !== undefined ||
        patch.miPayment !== undefined ||
        patch.hoaFee !== undefined ||
        patch.monthlyMip !== undefined ||
        patch.usdaAnnualFee !== undefined
      ) {
        if (s.loanAmount && s.interestRate !== undefined && s.term) {
          s.piPayment = Math.round(calculateMonthlyPI(s.loanAmount, s.interestRate, s.term));
          s.monthlyPayment = Math.round(
            s.piPayment +
              (s.taxesInsurance || 0) +
              (s.miPayment || 0) +
              (s.hoaFee || 0) +
              (s.monthlyMip || 0) +
              (s.usdaAnnualFee || 0)
          );
        }
      }

      if (patch.loanType !== undefined) {
        if (patch.loanType !== "FHA") {
          s.upfrontMip = undefined;
          s.monthlyMip = undefined;
        }
        if (patch.loanType !== "VA") {
          s.vaFundingFee = undefined;
        }
        if (patch.loanType !== "USDA") {
          s.usdaGuaranteeFee = undefined;
          s.usdaAnnualFee = undefined;
        }
      }

      return updated;
    });
  };

  const scenarioField = (
    idx: number,
    key: keyof LoanScenario,
    label: string,
    type = "text",
    required = false
  ) => (
    <div>
      <Label className="text-xs font-medium text-slate-600 mb-1 block">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        type={type}
        className="h-8 text-sm"
        value={(scenarios[idx][key] as string | number) ?? ""}
        onChange={(e) =>
          updateScenario(idx, {
            [key]: type === "number" ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value,
          } as Partial<LoanScenario>)
        }
      />
    </div>
  );

  const handleDecision = async (decision: "APPROVED" | "REJECTED") => {
    if (decision === "REJECTED" && !notes.trim()) {
      toast.error("Add a note explaining what needs to change before requesting changes");
      return;
    }
    if (decision === "APPROVED" && scenarios.some((s) => getMissingScenarioFields(s).length > 0)) {
      toast.error("One or more scenarios are missing required fields — fill them in before approving");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/compliance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewNotes: notes || null, loanScenarios: scenarios }),
      });
      if (!res.ok) throw new Error();
      toast.success(decision === "APPROVED" ? "Flyer approved" : "Changes requested — LO will be notified");
      router.push("/admin/compliance");
    } catch {
      toast.error("Failed to save review decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!flyer) return null;

  const pd = flyer.propertyData || {};
  const badge = APPROVAL_BADGE[flyer.approvalStatus];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm" className="text-slate-500">
          <Link href="/admin/compliance">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Compliance Records
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {pd.address ? `${pd.address}, ${pd.city}` : flyer.title || "Untitled flyer"}
            </h1>
            {badge && (
              <Badge variant="secondary" className={`gap-1 ${badge.className}`}>
                <badge.icon className="w-3 h-3" />
                {badge.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {flyer.loanOfficer.firstName} {flyer.loanOfficer.lastName} · NMLS# {flyer.loanOfficer.nmlsNumber}
            {flyer.realtor && ` · with ${flyer.realtor.firstName} ${flyer.realtor.lastName}, ${flyer.realtor.companyName}`}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/print/flyers/${id}`} target="_blank">
            View flyer
          </Link>
        </Button>
      </div>

      {/* Property summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-slate-400 text-xs">List price</span>
          <p className="font-medium text-slate-900">{pd.price ? formatCurrency(pd.price) : "—"}</p>
        </div>
        <div>
          <span className="text-slate-400 text-xs">Distribution state</span>
          <p className="font-medium text-slate-900">{flyer.distributionState || "—"}</p>
        </div>
        <div>
          <span className="text-slate-400 text-xs">Submitted</span>
          <p className="font-medium text-slate-900">
            {flyer.submittedForReviewAt
              ? new Date(flyer.submittedForReviewAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "—"}
          </p>
        </div>
        <div>
          <span className="text-slate-400 text-xs">Template</span>
          <p className="font-medium text-slate-900">{flyer.templateId}</p>
        </div>
      </div>

      {/* Loan scenarios — editable */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Loan scenarios</h2>
        <div className="space-y-4">
          {scenarios.map((s, idx) => (
            <div key={idx} className="bg-slate-50 rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-700 mb-3">Scenario {idx + 1}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {scenarioField(idx, "label", "Label", "text", true)}
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1 block">
                    Loan type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={(s.loanType as string) || undefined}
                    onValueChange={(v) => v && updateScenario(idx, { loanType: v })}
                  >
                    <SelectTrigger className="h-8 text-sm w-full">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOAN_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {scenarioField(idx, "term", "Term (yrs)", "number", true)}
                {scenarioField(idx, "purchasePrice", "Purchase price", "number", true)}
                {scenarioField(idx, "downPaymentPercent", "Down %", "number", true)}
                {scenarioField(idx, "loanAmount", "Loan amount", "number", true)}
                {scenarioField(idx, "interestRate", "Rate", "number", true)}
                {scenarioField(idx, "apr", "APR", "number", true)}
                {scenarioField(idx, "piPayment", "P&I/mo", "number")}
                {scenarioField(idx, "taxesInsurance", "Tax+Ins/mo", "number", true)}
                {scenarioField(
                  idx,
                  "miPayment",
                  "MI/mo",
                  "number",
                  (s.loanType === "Conventional" || s.loanType === "Jumbo") && (s.downPaymentPercent ?? 0) < 20
                )}
                {scenarioField(idx, "hoaFee", "HOA/mo", "number")}
                {s.loanType === "FHA" && (
                  <>
                    {scenarioField(idx, "upfrontMip", "Upfront MIP", "number", true)}
                    {scenarioField(idx, "monthlyMip", "Monthly MIP", "number", true)}
                  </>
                )}
                {s.loanType === "VA" && scenarioField(idx, "vaFundingFee", "VA Funding Fee", "number", true)}
                {s.loanType === "USDA" && (
                  <>
                    {scenarioField(idx, "usdaGuaranteeFee", "Upfront Guarantee Fee", "number", true)}
                    {scenarioField(idx, "usdaAnnualFee", "Annual Fee/mo", "number", true)}
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-3">
                P&I and total monthly payment recalculate automatically from purchase price, down payment, rate, and term — edit them directly to override.
              </p>
              {(() => {
                const missing = getMissingScenarioFields(s);
                return missing.length > 0 ? (
                  <p className="text-xs text-amber-600 mt-2">Still needed: {missing.join(", ")}</p>
                ) : null;
              })()}
            </div>
          ))}
        </div>
      </div>

      {/* Decision */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Compliance notes</h2>
        <Textarea
          className="min-h-[90px] resize-none mb-4"
          placeholder="Notes for the loan officer (required if requesting changes)…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => handleDecision("REJECTED")}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Request Changes
          </Button>
          <Button
            type="button"
            style={{ backgroundColor: "#059669" }}
            className="text-white flex-1"
            onClick={() => handleDecision("APPROVED")}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}

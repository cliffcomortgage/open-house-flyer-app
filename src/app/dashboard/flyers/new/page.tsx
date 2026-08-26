"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Loader2,
  Plus,
  Minus,
  Check,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency, calculateMonthlyPI, LOAN_TYPES, getMissingScenarioFields } from "@/lib/utils";
import { FLYER_TEMPLATES } from "@/types";
import { US_STATES } from "@/lib/us-states";
import type {
  Realtor,
  PropertyData,
  LoanScenario,
} from "@/types";

function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, idx) => (
        <div key={idx} className="flex items-center">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              idx < currentStep
                ? "bg-emerald-100 text-emerald-700"
                : idx === currentStep
                ? "bg-blue-900 text-white"
                : "bg-slate-100 text-slate-400"
            )}
          >
            <span
              className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold",
                idx < currentStep
                  ? "bg-emerald-500 text-white"
                  : idx === currentStep
                  ? "bg-white text-blue-900"
                  : "bg-slate-200 text-slate-500"
              )}
            >
              {idx < currentStep ? <Check className="w-2.5 h-2.5" /> : idx + 1}
            </span>
            {label}
          </div>
          {idx < steps.length - 1 && (
            <div className={cn("w-6 h-px mx-1", idx < currentStep ? "bg-emerald-300" : "bg-slate-200")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------- Step 1: Template ----------
function TemplateStep({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const layoutIcons: Record<string, React.ReactNode> = {
    single: (
      <div className="w-full h-20 bg-slate-300 rounded-md" />
    ),
    grid: (
      <div className="grid grid-cols-2 gap-1 w-full">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-9 bg-slate-300 rounded" />)}
      </div>
    ),
    "hero-strip": (
      <div className="space-y-1 w-full">
        <div className="w-full h-12 bg-slate-300 rounded" />
        <div className="grid grid-cols-3 gap-1">
          {[0, 1, 2].map((i) => <div key={i} className="h-6 bg-slate-200 rounded" />)}
        </div>
      </div>
    ),
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Choose a template</h2>
      <p className="text-sm text-slate-500 mb-6">Select the layout that best fits your property presentation.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FLYER_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={cn(
              "text-left rounded-xl border-2 p-4 transition-all hover:shadow-sm",
              selected === template.id
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            <div className="mb-3">{layoutIcons[template.photoLayout]}</div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">{template.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
              </div>
              {template.hasLoanScenarios && (
                <Badge variant="secondary" className="text-xs shrink-0 bg-amber-50 text-amber-700 border-amber-100">
                  Rates
                </Badge>
              )}
            </div>
            {selected === template.id && (
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium">
                <Check className="w-3 h-3" /> Selected
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Step 2: Property ----------
function PropertyStep({
  data,
  onChange,
}: {
  data: Partial<PropertyData>;
  onChange: (d: Partial<PropertyData>) => void;
}) {
  const [photoUploading, setPhotoUploading] = useState(false);

  const onPhotoDrop = useCallback(
    async (files: File[]) => {
      setPhotoUploading(true);
      const uploaded: string[] = [];
      let failed = 0;
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "property-photos");
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (res.ok) {
            const { publicUrl } = await res.json();
            uploaded.push(publicUrl);
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }
      if (failed) {
        toast.error(`${failed} photo${failed > 1 ? "s" : ""} failed to upload`);
      }
      if (uploaded.length) {
        onChange({ photos: [...(data.photos || []), ...uploaded] });
        toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} uploaded`);
      }
      setPhotoUploading(false);
    },
    [data.photos, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onPhotoDrop,
    accept: { "image/*": [] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  const removePhoto = (idx: number) => {
    const photos = [...(data.photos || [])];
    photos.splice(idx, 1);
    onChange({ photos });
  };

  const field = (
    key: keyof PropertyData,
    label: string,
    type = "text",
    placeholder = ""
  ) => (
    <div>
      <Label className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</Label>
      <Input
        type={type}
        className="h-9"
        placeholder={placeholder}
        value={(data[key] as string | number) ?? ""}
        onChange={(e) =>
          onChange({
            [key]: type === "number" ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value,
          })
        }
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Property information</h2>
        <p className="text-sm text-slate-500">Enter the property details and upload photos.</p>
      </div>

      {/* Manual fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          {field("address", "Street address", "text", "123 Main St")}
        </div>
        {field("city", "City")}
        <div className="grid grid-cols-2 gap-4">
          {field("state", "State", "text", "NY")}
          {field("zipCode", "Zip code")}
        </div>
        {field("price", "List price", "number", "500000")}
        {field("bedrooms", "Bedrooms", "number")}
        {field("bathrooms", "Bathrooms", "number")}
        {field("squareFeet", "Square feet", "number")}
        {field("yearBuilt", "Year built", "number")}
        {field("garage", "Garage", "text", "2 Car Attached")}
        {field("lotSize", "Lot size")}
        {field("propertyType", "Property type (optional)", "text", "Single Family")}
        {field("propertyUse", "Property use (optional)", "text", "Primary Residence")}
        {field("stories", "# of stories (optional)", "number")}
        {field("units", "# of units (optional)", "number")}
        {field("mlsNumber", "MLS # (optional)", "text", "e.g. 36749718")}
      </div>

      {/* Open house */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {field("openHouseDate", "Open house date", "date")}
        {field("openHouseStartTime", "Start time", "time")}
        {field("openHouseEndTime", "End time", "time")}
      </div>

      {/* Description */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</Label>
        <Textarea
          className="min-h-[80px] resize-none"
          placeholder="Briefly describe this property…"
          value={data.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      {/* Photos */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">Property photos</Label>
        {(data.photos || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {(data.photos || []).map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
            isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"
          )}
        >
          <input {...getInputProps()} />
          {photoUploading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-sm text-slate-500">Uploading…</span>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">
                {isDragActive ? "Drop photos here" : "Drag & drop photos, or click to browse"}
              </p>
              <p className="text-xs text-slate-400 mt-1">Multiple files supported · JPG, PNG, WebP · Max 10MB each</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Step 3: Realtor ----------
function RealtorStep({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/realtors")
      .then((r) => r.json())
      .then((data) => { setRealtors(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center gap-2 py-12 justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Choose a realtor</h2>
      <p className="text-sm text-slate-500 mb-6">Select a partner realtor to co-brand this flyer, or skip.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Skip option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "text-left rounded-xl border-2 p-4 transition-all",
            selectedId === null
              ? "border-blue-600 bg-blue-50"
              : "border-slate-200 hover:border-slate-300"
          )}
        >
          <p className="font-semibold text-slate-700 text-sm">No realtor</p>
          <p className="text-xs text-slate-400 mt-0.5">Lender-only branding on this flyer</p>
          {selectedId === null && <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium"><Check className="w-3 h-3" /> Selected</div>}
        </button>

        {realtors.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.id)}
            className={cn(
              "text-left rounded-xl border-2 p-4 transition-all",
              selectedId === r.id
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className="flex items-center gap-3">
              {r.headshotUrl ? (
                <img src={r.headshotUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: r.brandPrimary || "#6633cc" }}
                >
                  {r.firstName[0]}{r.lastName[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{r.firstName} {r.lastName}</p>
                <p className="text-xs text-slate-500 truncate">{r.title} · {r.companyName}</p>
              </div>
            </div>
            {selectedId === r.id && <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium"><Check className="w-3 h-3" /> Selected</div>}
          </button>
        ))}
      </div>

      {realtors.length === 0 && (
        <p className="text-sm text-slate-500 text-center mt-4">
          No realtors yet.{" "}
          <a href="/dashboard/realtors/new" className="text-blue-600 hover:underline">
            Add a realtor
          </a>{" "}
          to co-brand flyers.
        </p>
      )}
    </div>
  );
}

// ---------- Step 4: Financing ----------
const emptyScenario = (): Partial<LoanScenario> => ({
  label: "",
  purchasePrice: undefined,
  downPaymentPercent: 20,
  downPaymentAmount: undefined,
  loanAmount: undefined,
  interestRate: undefined,
  apr: undefined,
  term: 30,
  loanType: "Conventional",
  monthlyPayment: undefined,
  piPayment: undefined,
  taxesInsurance: undefined,
  hoaFee: undefined,
  miPayment: undefined,
  upfrontMip: undefined,
  monthlyMip: undefined,
  vaFundingFee: undefined,
  usdaGuaranteeFee: undefined,
  usdaAnnualFee: undefined,
});

function FinancingStep({
  scenarios,
  onChange,
  maxScenarios,
  propertyData,
}: {
  scenarios: Partial<LoanScenario>[];
  onChange: (s: Partial<LoanScenario>[]) => void;
  maxScenarios: number;
  propertyData: Partial<PropertyData>;
}) {
  const update = (idx: number, patch: Partial<LoanScenario>) => {
    const updated = [...scenarios];
    updated[idx] = { ...updated[idx], ...patch };
    const s = updated[idx];

    // Auto-calc loan amount from purchase price + down payment %
    if (patch.purchasePrice !== undefined || patch.downPaymentPercent !== undefined) {
      const price = s.purchasePrice as number;
      const pct = s.downPaymentPercent as number;
      if (price && pct !== undefined) {
        s.downPaymentAmount = Math.round((price * pct) / 100);
        s.loanAmount = Math.round(price - s.downPaymentAmount!);
      }
    }

    // Auto-calc P&I and total monthly payment whenever a driving field changes
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

    // Clear loan-type-specific fields that no longer apply when the type changes
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

    onChange(updated);
  };

  const addScenario = () => {
    if (scenarios.length < maxScenarios) onChange([...scenarios, emptyScenario()]);
  };

  const removeScenario = (idx: number) => {
    onChange(scenarios.filter((_, i) => i !== idx));
  };

  const scenarioField = (
    idx: number,
    key: keyof LoanScenario,
    label: string,
    type = "text",
    placeholder = "",
    required = false
  ) => (
    <div>
      <Label className="text-xs font-medium text-slate-600 mb-1 block">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        type={type}
        className="h-8 text-sm"
        placeholder={placeholder}
        value={(scenarios[idx][key] as string | number) ?? ""}
        onChange={(e) =>
          update(idx, {
            [key]: type === "number" ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value,
          })
        }
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Loan scenarios</h2>
          <p className="text-sm text-slate-500">Add up to {maxScenarios} loan scenario{maxScenarios > 1 ? "s" : ""} to show buyers their financing options.</p>
        </div>
        {scenarios.length < maxScenarios && (
          <Button type="button" variant="outline" size="sm" onClick={addScenario} className="shrink-0">
            <Plus className="w-4 h-4 mr-1" /> Add scenario
          </Button>
        )}
      </div>

      {scenarios.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-sm text-slate-500 mb-3">No scenarios yet</p>
          <Button type="button" variant="outline" size="sm" onClick={addScenario}>
            <Plus className="w-4 h-4 mr-1" /> Add your first scenario
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {scenarios.map((s, idx) => (
          <div key={idx} className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-700">
                Scenario {idx + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-red-50"
                onClick={() => removeScenario(idx)}
              >
                <Minus className="w-3.5 h-3.5 text-red-500" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {scenarioField(idx, "label", "Label", "text", "30yr Conventional", true)}
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1 block">
                  Loan type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={(s.loanType as string) || undefined}
                  onValueChange={(v) => v && update(idx, { loanType: v })}
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
              {scenarioField(idx, "term", "Term (years)", "number", "30", true)}
              {scenarioField(idx, "purchasePrice", "Purchase price", "number", "", true)}
              {scenarioField(idx, "downPaymentPercent", "Down payment %", "number", "20", true)}
              {scenarioField(idx, "loanAmount", "Loan amount", "number", "", true)}
              {scenarioField(idx, "interestRate", "Interest rate", "number", "6.875", true)}
              {scenarioField(idx, "apr", "APR", "number", "7.12", true)}
              {scenarioField(idx, "piPayment", "P&I payment", "number")}
              {scenarioField(idx, "taxesInsurance", "Taxes & ins./mo", "number", "", true)}
              {scenarioField(
                idx,
                "miPayment",
                "MI/mo",
                "number",
                "",
                (s.loanType === "Conventional" || s.loanType === "Jumbo") && (s.downPaymentPercent ?? 0) < 20
              )}
              {scenarioField(idx, "hoaFee", "HOA/mo", "number")}
              {s.loanType === "FHA" && (
                <>
                  {scenarioField(idx, "upfrontMip", "Upfront MIP", "number", "", true)}
                  {scenarioField(idx, "monthlyMip", "Monthly MIP", "number", "", true)}
                </>
              )}
              {s.loanType === "VA" && scenarioField(idx, "vaFundingFee", "VA Funding Fee", "number", "", true)}
              {s.loanType === "USDA" && (
                <>
                  {scenarioField(idx, "usdaGuaranteeFee", "Upfront Guarantee Fee", "number", "", true)}
                  {scenarioField(idx, "usdaAnnualFee", "Annual Fee/mo", "number", "", true)}
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              P&I and total monthly payment are calculated automatically from purchase price, down payment, rate, and term — edit them directly to override.
            </p>
            {(() => {
              const missing = getMissingScenarioFields(s);
              return missing.length > 0 ? (
                <p className="text-xs text-amber-600 mt-2">
                  Still needed: {missing.join(", ")}
                </p>
              ) : null;
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Step 5: Preview ----------
function PreviewStep({
  templateId,
  propertyData,
  qrUrl,
  setQrUrl,
  distributionState,
  setDistributionState,
  onSave,
  isSaving,
}: {
  templateId: string;
  propertyData: Partial<PropertyData>;
  qrUrl: string;
  setQrUrl: (v: string) => void;
  distributionState: string;
  setDistributionState: (v: string) => void;
  onSave: (status: "DRAFT" | "SAVED") => void;
  isSaving: boolean;
}) {
  const templateLabels: Record<string, string> = {
    "modern-minimal": "Modern Minimal",
    "gallery-grid": "Gallery Grid",
    "showcase-one-rate": "Showcase + Rate",
    "market-leader": "Market Leader",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Additional Details</h2>
        <p className="text-sm text-slate-500">Add a QR code and review your flyer details before saving.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500 text-xs">Template</span>
            <p className="font-medium text-slate-900">{templateLabels[templateId]}</p>
          </div>
          <div>
            <span className="text-slate-500 text-xs">Property</span>
            <p className="font-medium text-slate-900 truncate">
              {propertyData.address ? `${propertyData.address}, ${propertyData.city}` : "Not entered"}
            </p>
          </div>
          <div>
            <span className="text-slate-500 text-xs">Price</span>
            <p className="font-medium text-slate-900">
              {propertyData.price ? formatCurrency(propertyData.price) : "—"}
            </p>
          </div>
          <div>
            <span className="text-slate-500 text-xs">Photos</span>
            <p className="font-medium text-slate-900">{(propertyData.photos || []).length} photo{(propertyData.photos || []).length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Distribution state — required */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-700">
            State of Distribution <span className="text-red-500">*</span>
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Select the state where this flyer will be distributed. Required for compliance records.
        </p>
        <Select value={distributionState} onValueChange={(v) => setDistributionState(v ?? "")}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select a state…" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {US_STATES.map((s) => (
              <SelectItem key={s.abbr} value={s.abbr}>
                {s.name} ({s.abbr})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* QR code */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <QrCode className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">QR Code (optional)</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Paste a URL (virtual tour, listing page, etc.) to embed a QR code on the flyer.
        </p>
        <Input
          className="h-9"
          placeholder="https://yourlisting.com/123-main-st"
          value={qrUrl}
          onChange={(e) => setQrUrl(e.target.value)}
        />
      </div>

      {/* Save actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSave("DRAFT")}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save as Draft
        </Button>
        <Button
          type="button"
          style={{ backgroundColor: "#6633cc" }}
          className="text-white flex-1"
          onClick={() => onSave("SAVED")}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Flyer
        </Button>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function NewFlyerPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState("modern-minimal");
  const [propertyData, setPropertyData] = useState<Partial<PropertyData>>({ photos: [] });
  const [realtorId, setRealtorId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Partial<LoanScenario>[]>([]);
  const [qrUrl, setQrUrl] = useState("");
  const [distributionState, setDistributionState] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedTemplate = FLYER_TEMPLATES.find((t) => t.id === templateId)!;
  const hasFinancing = selectedTemplate?.hasLoanScenarios;

  const steps = hasFinancing
    ? ["Template", "Property", "Realtor", "Financing", "Additional Details"]
    : ["Template", "Property", "Realtor", "Additional Details"];

  // Steps depend on whether template needs financing
  const visibleSteps = hasFinancing ? [0, 1, 2, 3, 4] : [0, 1, 2, 4];
  const currentVisibleStep = visibleSteps.indexOf(step);

  const canAdvance = () => {
    if (step === 0) return !!templateId;
    if (step === 1) return !!(propertyData.address && propertyData.city);
    if (step === 3 && hasFinancing) {
      return scenarios.every((s) => getMissingScenarioFields(s).length === 0);
    }
    // Additional Details step: require distributionState before saving
    return true;
  };

  const canSave = () => !!distributionState;

  const advance = () => {
    const nextIdx = currentVisibleStep + 1;
    if (nextIdx < visibleSteps.length) setStep(visibleSteps[nextIdx]);
  };

  const back = () => {
    const prevIdx = currentVisibleStep - 1;
    if (prevIdx >= 0) setStep(visibleSteps[prevIdx]);
  };

  const handleSave = async (status: "DRAFT" | "SAVED") => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/flyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          propertyData,
          realtorId,
          loanScenarios: hasFinancing ? scenarios : [],
          qrCodeData: qrUrl || null,
          status,
          distributionState: distributionState || null,
          title: propertyData.address
            ? `${propertyData.address}, ${propertyData.city}`
            : null,
        }),
      });
      if (!res.ok) throw new Error();
      const flyer = await res.json();
      toast.success(status === "SAVED" ? "Flyer saved!" : "Draft saved");
      if (status === "SAVED") {
        router.push(`/dashboard/flyers/${flyer.id}/preview`);
      } else {
        router.push(`/dashboard/flyers/${flyer.id}/edit`);
      }
    } catch {
      toast.error("Failed to save flyer");
    } finally {
      setIsSaving(false);
    }
  };

  const stepComponents = [
    <TemplateStep key="template" selected={templateId} onSelect={setTemplateId} />,
    <PropertyStep
      key="property"
      data={propertyData}
      onChange={(patch) => setPropertyData((prev) => ({ ...prev, ...patch }))}
    />,
    <RealtorStep key="realtor" selectedId={realtorId} onSelect={setRealtorId} />,
    ...(hasFinancing
      ? [
          <FinancingStep
            key="financing"
            scenarios={scenarios}
            onChange={setScenarios}
            maxScenarios={selectedTemplate.maxScenarios}
            propertyData={propertyData}
          />,
        ]
      : []),
    <PreviewStep
      key="preview"
      templateId={templateId}
      propertyData={propertyData}
      qrUrl={qrUrl}
      setQrUrl={setQrUrl}
      distributionState={distributionState}
      setDistributionState={setDistributionState}
      onSave={(status) => {
        if (!distributionState) {
          toast.error("Please select a state of distribution");
          return;
        }
        handleSave(status);
      }}
      isSaving={isSaving}
    />,
  ];

  // Map visible step to component
  const stepComponentMap: Record<number, React.ReactNode> = {
    0: stepComponents[0],
    1: stepComponents[1],
    2: stepComponents[2],
    3: hasFinancing ? stepComponents[3] : stepComponents[3],
    4: stepComponents[hasFinancing ? 4 : 3],
  };

  const currentComponent = stepComponentMap[step] ?? stepComponents[0];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create New Flyer</h1>
        <p className="text-sm text-slate-500 mt-1">Follow the steps to build your open house flyer.</p>
      </div>

      <StepIndicator currentStep={currentVisibleStep} steps={steps} />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        {currentComponent}
      </div>

      {/* Nav buttons */}
      {step !== visibleSteps[visibleSteps.length - 1] && (
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={back}
            disabled={currentVisibleStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button
            type="button"
            style={{ backgroundColor: "#6633cc" }}
            className="text-white"
            onClick={advance}
            disabled={!canAdvance()}
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
      {step === visibleSteps[visibleSteps.length - 1] && currentVisibleStep > 0 && (
        <Button type="button" variant="outline" onClick={back} className="mr-auto">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      )}
    </div>
  );
}

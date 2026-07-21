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
  Search,
  Plus,
  Minus,
  Check,
  RefreshCw,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { FLYER_TEMPLATES } from "@/types";
import { US_STATES } from "@/lib/us-states";
import type {
  Realtor,
  PropertyData,
  LoanScenario,
  MLSSearchResult,
  OptimalBlueProduct,
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
  const [mlsQuery, setMlsQuery] = useState("");
  const [mlsResults, setMlsResults] = useState<MLSSearchResult[]>([]);
  const [mlsLoading, setMlsLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const searchMLS = async () => {
    if (!mlsQuery.trim()) return;
    setMlsLoading(true);
    try {
      const res = await fetch(`/api/mls/search?q=${encodeURIComponent(mlsQuery)}`);
      if (!res.ok) throw new Error();
      setMlsResults(await res.json());
    } catch {
      toast.error("MLS search failed");
    } finally {
      setMlsLoading(false);
    }
  };

  const selectMLSResult = async (result: MLSSearchResult) => {
    try {
      const res = await fetch(`/api/mls/${result.mlsId}`);
      if (!res.ok) throw new Error();
      const propertyData: PropertyData = await res.json();
      onChange(propertyData);
      setMlsResults([]);
      setMlsQuery("");
      toast.success("Property data imported from MLS");
    } catch {
      // Fallback to basic data from search result
      onChange({
        address: result.address,
        city: result.city,
        state: result.state,
        zipCode: result.zipCode,
        price: result.price,
        bedrooms: result.bedrooms,
        bathrooms: result.bathrooms,
        squareFeet: result.squareFeet,
        photos: result.photos,
        mlsNumber: result.mlsId,
      });
      setMlsResults([]);
      setMlsQuery("");
      toast.success("Property data imported from MLS");
    }
  };

  const onPhotoDrop = useCallback(
    async (files: File[]) => {
      setPhotoUploading(true);
      const uploaded: string[] = [];
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "property-photos");
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (res.ok) {
            const { publicUrl } = await res.json();
            uploaded.push(publicUrl);
          }
        } catch {
          // skip failed
        }
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
        <p className="text-sm text-slate-500">Search MLS or enter details manually.</p>
      </div>

      {/* MLS Search */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">MLS Lookup</p>
        <div className="flex gap-2">
          <Input
            className="h-9"
            placeholder="Search by address, MLS#, or city…"
            value={mlsQuery}
            onChange={(e) => setMlsQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchMLS()}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0"
            onClick={searchMLS}
            disabled={mlsLoading}
          >
            {mlsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        {mlsResults.length > 0 && (
          <div className="mt-2 border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
            {mlsResults.slice(0, 6).map((r) => (
              <button
                key={r.mlsId}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
                onClick={() => selectMLSResult(r)}
              >
                <p className="text-sm font-medium text-slate-900">{r.address}, {r.city}, {r.state}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatCurrency(r.price)} · {r.bedrooms}bd {r.bathrooms}ba · MLS# {r.mlsId}
                </p>
              </button>
            ))}
          </div>
        )}
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
});

function OBPricingDialog({
  onSelect,
  propertyState,
  propertyZip,
}: {
  onSelect: (product: OptimalBlueProduct, purchasePrice: number, downPct: number) => void;
  propertyState: string;
  propertyZip: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OptimalBlueProduct[]>([]);
  const [form, setForm] = useState({
    purchasePrice: "",
    downPaymentPercent: "20",
    creditScore: "740",
    state: propertyState,
    zipCode: propertyZip,
  });

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/optimal-blue/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchasePrice: Number(form.purchasePrice),
          downPaymentPercent: Number(form.downPaymentPercent),
          creditScore: Number(form.creditScore),
          state: form.state,
          zipCode: form.zipCode,
        }),
      });
      if (!res.ok) throw new Error();
      setResults(await res.json());
    } catch {
      toast.error("Failed to fetch pricing — check Optimal Blue credentials");
    } finally {
      setLoading(false);
    }
  };

  const f = (key: keyof typeof form, label: string, type = "text") => (
    <div>
      <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
      <Input
        type={type}
        className="h-8 text-sm"
        value={form[key]}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <RefreshCw className="w-3 h-3" /> Fetch from Optimal Blue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base">Optimal Blue Pricing</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {f("purchasePrice", "Purchase price", "number")}
          {f("downPaymentPercent", "Down payment %", "number")}
          {f("creditScore", "Credit score", "number")}
          {f("state", "State")}
          {f("zipCode", "Zip code")}
        </div>
        <Button
          type="button"
          className="w-full mb-4 text-white"
          style={{ backgroundColor: "#6633cc" }}
          onClick={fetchPricing}
          disabled={loading}
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching…</> : "Get Rates"}
        </Button>
        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {results.map((product, idx) => (
              <button
                key={idx}
                type="button"
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                onClick={() => {
                  onSelect(product, Number(form.purchasePrice), Number(form.downPaymentPercent));
                  setOpen(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{product.productName}</p>
                    <p className="text-xs text-slate-500">{product.loanType} · {product.term}yr</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-900">{product.rate.toFixed(3)}%</p>
                    <p className="text-xs text-slate-500">APR {product.apr.toFixed(3)}%</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
    // Auto-calc loan amount
    if (patch.purchasePrice !== undefined || patch.downPaymentPercent !== undefined) {
      const price = (patch.purchasePrice ?? updated[idx].purchasePrice) as number;
      const pct = (patch.downPaymentPercent ?? updated[idx].downPaymentPercent) as number;
      if (price && pct !== undefined) {
        updated[idx].downPaymentAmount = Math.round((price * pct) / 100);
        updated[idx].loanAmount = Math.round(price - updated[idx].downPaymentAmount!);
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

  const applyOBProduct = (
    idx: number,
    product: OptimalBlueProduct,
    purchasePrice: number,
    downPct: number
  ) => {
    update(idx, {
      loanType: product.loanType,
      term: product.term,
      interestRate: product.rate,
      apr: product.apr,
      piPayment: product.monthlyPayment,
      monthlyPayment: product.monthlyPayment,
      purchasePrice,
      downPaymentPercent: downPct,
      label: `${product.term}yr ${product.loanType}`,
    });
  };

  const scenarioField = (
    idx: number,
    key: keyof LoanScenario,
    label: string,
    type = "text",
    placeholder = ""
  ) => (
    <div>
      <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
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
              <div className="flex gap-2">
                <OBPricingDialog
                  propertyState={propertyData.state || ""}
                  propertyZip={propertyData.zipCode || ""}
                  onSelect={(product, price, downPct) => applyOBProduct(idx, product, price, downPct)}
                />
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
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {scenarioField(idx, "label", "Label", "text", "30yr Conventional")}
              {scenarioField(idx, "loanType", "Loan type", "text", "Conventional")}
              {scenarioField(idx, "term", "Term (years)", "number", "30")}
              {scenarioField(idx, "purchasePrice", "Purchase price", "number")}
              {scenarioField(idx, "downPaymentPercent", "Down payment %", "number", "20")}
              {scenarioField(idx, "loanAmount", "Loan amount", "number")}
              {scenarioField(idx, "interestRate", "Interest rate", "number", "6.875")}
              {scenarioField(idx, "apr", "APR", "number", "7.12")}
              {scenarioField(idx, "piPayment", "P&I payment", "number")}
              {scenarioField(idx, "taxesInsurance", "Taxes & ins./mo", "number")}
              {scenarioField(idx, "miPayment", "MI/mo", "number")}
              {scenarioField(idx, "hoaFee", "HOA/mo", "number")}
            </div>
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
        <Select value={distributionState} onValueChange={setDistributionState}>
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

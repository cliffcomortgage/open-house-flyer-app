"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import {
  ChevronRight, ChevronLeft, Upload, X, Loader2,
  Search, Plus, Minus, Check, RefreshCw, QrCode, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { FLYER_TEMPLATES } from "@/types";
import type {
  Realtor, PropertyData, LoanScenario, MLSSearchResult, OptimalBlueProduct, Flyer,
} from "@/types";

const STEPS = ["Template", "Property", "Realtor", "Financing", "Preview"];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
      {STEPS.map((label, idx) => (
        <div key={idx} className="flex items-center shrink-0">
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            idx < currentStep ? "bg-emerald-100 text-emerald-700" : idx === currentStep ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-400"
          )}>
            <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold",
              idx < currentStep ? "bg-emerald-500 text-white" : idx === currentStep ? "bg-white text-blue-900" : "bg-slate-200 text-slate-500"
            )}>
              {idx < currentStep ? <Check className="w-2.5 h-2.5" /> : idx + 1}
            </span>
            {label}
          </div>
          {idx < STEPS.length - 1 && (
            <div className={cn("w-6 h-px mx-1", idx < currentStep ? "bg-emerald-300" : "bg-slate-200")} />
          )}
        </div>
      ))}
    </div>
  );
}

const emptyScenario = (): Partial<LoanScenario> => ({
  label: "", purchasePrice: undefined, downPaymentPercent: 20,
  downPaymentAmount: undefined, loanAmount: undefined, interestRate: undefined,
  apr: undefined, term: 30, loanType: "Conventional", monthlyPayment: undefined,
  piPayment: undefined, taxesInsurance: undefined, hoaFee: undefined, miPayment: undefined,
});

export default function EditFlyerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState("modern-minimal");
  const [propertyData, setPropertyData] = useState<Partial<PropertyData>>({ photos: [] });
  const [realtorId, setRealtorId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Partial<LoanScenario>[]>([]);
  const [qrUrl, setQrUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [mlsQuery, setMlsQuery] = useState("");
  const [mlsResults, setMlsResults] = useState<MLSSearchResult[]>([]);
  const [mlsLoading, setMlsLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [obDialogOpen, setObDialogOpen] = useState<number | null>(null);
  const [obResults, setObResults] = useState<OptimalBlueProduct[]>([]);
  const [obLoading, setObLoading] = useState(false);
  const [obForm, setObForm] = useState({ purchasePrice: "", downPaymentPercent: "20", creditScore: "740", state: "", zipCode: "" });

  const selectedTemplate = FLYER_TEMPLATES.find((t) => t.id === templateId)!;
  const hasFinancing = selectedTemplate?.hasLoanScenarios;
  const visibleSteps = hasFinancing ? [0, 1, 2, 3, 4] : [0, 1, 2, 4];
  const currentVisibleStep = visibleSteps.indexOf(step);

  useEffect(() => {
    const load = async () => {
      try {
        const [flyerRes, realtorsRes] = await Promise.all([
          fetch(`/api/flyers/${id}`),
          fetch("/api/realtors"),
        ]);
        if (!flyerRes.ok) throw new Error();
        const flyer: Flyer = await flyerRes.json();
        setTemplateId(flyer.templateId);
        setPropertyData((flyer.propertyData as Partial<PropertyData>) || { photos: [] });
        setRealtorId(flyer.realtorId);
        setScenarios((flyer.loanScenarios as Partial<LoanScenario>[]) || []);
        setQrUrl(flyer.qrCodeData || "");
        if (realtorsRes.ok) setRealtors(await realtorsRes.json());
      } catch {
        toast.error("Failed to load flyer");
        router.push("/dashboard/flyers");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, router]);

  // Update obForm state when propertyData changes
  useEffect(() => {
    setObForm((prev) => ({
      ...prev,
      state: prev.state || propertyData.state || "",
      zipCode: prev.zipCode || propertyData.zipCode || "",
    }));
  }, [propertyData.state, propertyData.zipCode]);

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
      const res = await fetch(`/api/flyers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId, propertyData, realtorId,
          loanScenarios: hasFinancing ? scenarios : [],
          qrCodeData: qrUrl || null, status,
          title: propertyData.address ? `${propertyData.address}, ${propertyData.city}` : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === "SAVED" ? "Flyer saved!" : "Draft saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    await handleSave("SAVED");
    try {
      const res = await fetch(`/api/flyers/${id}/pdf`, { method: "POST" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flyer-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF generation failed");
    }
  };

  const onPhotoDrop = useCallback(async (files: File[]) => {
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
      } catch {}
    }
    if (uploaded.length) {
      setPropertyData((prev) => ({ ...prev, photos: [...(prev.photos || []), ...uploaded] }));
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} uploaded`);
    }
    setPhotoUploading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onPhotoDrop,
    accept: { "image/*": [] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

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
      if (res.ok) {
        const data: PropertyData = await res.json();
        setPropertyData(data);
      } else {
        setPropertyData({ address: result.address, city: result.city, state: result.state, zipCode: result.zipCode, price: result.price, bedrooms: result.bedrooms, bathrooms: result.bathrooms, squareFeet: result.squareFeet, photos: result.photos, mlsNumber: result.mlsId });
      }
      setMlsResults([]);
      setMlsQuery("");
      toast.success("Property data imported");
    } catch {
      toast.error("Failed to import MLS data");
    }
  };

  const fetchOBPricing = async () => {
    setObLoading(true);
    try {
      const res = await fetch("/api/optimal-blue/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchasePrice: Number(obForm.purchasePrice), downPaymentPercent: Number(obForm.downPaymentPercent), creditScore: Number(obForm.creditScore), state: obForm.state, zipCode: obForm.zipCode }),
      });
      if (!res.ok) throw new Error();
      setObResults(await res.json());
    } catch {
      toast.error("Failed to fetch pricing");
    } finally {
      setObLoading(false);
    }
  };

  const updateScenario = (idx: number, patch: Partial<LoanScenario>) => {
    const updated = [...scenarios];
    updated[idx] = { ...updated[idx], ...patch };
    if (patch.purchasePrice !== undefined || patch.downPaymentPercent !== undefined) {
      const price = (patch.purchasePrice ?? updated[idx].purchasePrice) as number;
      const pct = (patch.downPaymentPercent ?? updated[idx].downPaymentPercent) as number;
      if (price && pct !== undefined) {
        updated[idx].downPaymentAmount = Math.round((price * pct) / 100);
        updated[idx].loanAmount = Math.round(price - updated[idx].downPaymentAmount!);
      }
    }
    setScenarios(updated);
  };

  const applyOBProduct = (idx: number, product: OptimalBlueProduct) => {
    updateScenario(idx, {
      loanType: product.loanType, term: product.term, interestRate: product.rate, apr: product.apr,
      piPayment: product.monthlyPayment, monthlyPayment: product.monthlyPayment,
      purchasePrice: Number(obForm.purchasePrice), downPaymentPercent: Number(obForm.downPaymentPercent),
      label: `${product.term}yr ${product.loanType}`,
    });
    setObDialogOpen(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="h-10 bg-slate-100 rounded-full animate-pulse mb-8" />
        <div className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const pField = (key: keyof PropertyData, label: string, type = "text", placeholder = "") => (
    <div>
      <Label className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</Label>
      <Input type={type} className="h-9" placeholder={placeholder}
        value={(propertyData[key] as string | number) ?? ""}
        onChange={(e) => setPropertyData((prev) => ({ ...prev, [key]: type === "number" ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value }))}
      />
    </div>
  );

  const sField = (idx: number, key: keyof LoanScenario, label: string, type = "text", placeholder = "") => (
    <div>
      <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
      <Input type={type} className="h-8 text-sm" placeholder={placeholder}
        value={(scenarios[idx][key] as string | number) ?? ""}
        onChange={(e) => updateScenario(idx, { [key]: type === "number" ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value })}
      />
    </div>
  );

  const stepContent: Record<number, React.ReactNode> = {
    0: (
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Choose a template</h2>
        <p className="text-sm text-slate-500 mb-6">Select the layout for this flyer.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FLYER_TEMPLATES.map((t) => (
            <button key={t.id} type="button" onClick={() => setTemplateId(t.id)}
              className={cn("text-left rounded-xl border-2 p-4 transition-all hover:shadow-sm",
                templateId === t.id ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
              )}>
              <h3 className="font-semibold text-slate-900 text-sm">{t.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
              {t.hasLoanScenarios && <Badge variant="secondary" className="mt-2 text-xs bg-amber-50 text-amber-700 border-amber-100">Includes rates</Badge>}
              {templateId === t.id && <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium"><Check className="w-3 h-3" /> Selected</div>}
            </button>
          ))}
        </div>
      </div>
    ),
    1: (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Property information</h2>
          <p className="text-sm text-slate-500">Update details or search MLS.</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">MLS Lookup</p>
          <div className="flex gap-2">
            <Input className="h-9" placeholder="Search by address, MLS#…" value={mlsQuery} onChange={(e) => setMlsQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchMLS()} />
            <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={searchMLS} disabled={mlsLoading}>
              {mlsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          {mlsResults.length > 0 && (
            <div className="mt-2 border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
              {mlsResults.slice(0, 6).map((r) => (
                <button key={r.mlsId} type="button" onClick={() => selectMLSResult(r)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors">
                  <p className="text-sm font-medium text-slate-900">{r.address}, {r.city}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(r.price)} · {r.bedrooms}bd {r.bathrooms}ba</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">{pField("address", "Street address")}</div>
          {pField("city", "City")}
          <div className="grid grid-cols-2 gap-4">{pField("state", "State")} {pField("zipCode", "Zip")}</div>
          {pField("price", "List price", "number")}
          {pField("bedrooms", "Bedrooms", "number")}
          {pField("bathrooms", "Bathrooms", "number")}
          {pField("squareFeet", "Sq ft", "number")}
          {pField("yearBuilt", "Year built", "number")}
          {pField("garage", "Garage")}
          {pField("lotSize", "Lot size")}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {pField("openHouseDate", "Open house date", "date")}
          {pField("openHouseStartTime", "Start time", "time")}
          {pField("openHouseEndTime", "End time", "time")}
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</Label>
          <Textarea className="min-h-[80px] resize-none" value={propertyData.description || ""}
            onChange={(e) => setPropertyData((prev) => ({ ...prev, description: e.target.value }))} />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">Photos</Label>
          {(propertyData.photos || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {(propertyData.photos || []).map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                  <button type="button" onClick={() => {
                    const photos = [...(propertyData.photos || [])];
                    photos.splice(idx, 1);
                    setPropertyData((prev) => ({ ...prev, photos }));
                  }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div {...getRootProps()} className={cn("border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors", isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300")}>
            <input {...getInputProps()} />
            {photoUploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" /> : (
              <><Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" /><p className="text-sm text-slate-500">Drag & drop or click</p></>
            )}
          </div>
        </div>
      </div>
    ),
    2: (
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Choose a realtor</h2>
        <p className="text-sm text-slate-500 mb-6">Co-brand this flyer with a partner realtor.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button type="button" onClick={() => setRealtorId(null)}
            className={cn("text-left rounded-xl border-2 p-4 transition-all", realtorId === null ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300")}>
            <p className="font-semibold text-slate-700 text-sm">No realtor</p>
            <p className="text-xs text-slate-400 mt-0.5">Lender-only branding</p>
            {realtorId === null && <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium"><Check className="w-3 h-3" /> Selected</div>}
          </button>
          {realtors.map((r) => (
            <button key={r.id} type="button" onClick={() => setRealtorId(r.id)}
              className={cn("text-left rounded-xl border-2 p-4 transition-all", realtorId === r.id ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300")}>
              <div className="flex items-center gap-3">
                {r.headshotUrl ? (
                  <img src={r.headshotUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: r.brandPrimary || "#6633cc" }}>
                    {r.firstName[0]}{r.lastName[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{r.firstName} {r.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{r.companyName}</p>
                </div>
              </div>
              {realtorId === r.id && <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium"><Check className="w-3 h-3" /> Selected</div>}
            </button>
          ))}
        </div>
      </div>
    ),
    3: hasFinancing ? (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Loan scenarios</h2>
            <p className="text-sm text-slate-500">Up to {selectedTemplate?.maxScenarios} scenario{selectedTemplate?.maxScenarios > 1 ? "s" : ""}.</p>
          </div>
          {scenarios.length < (selectedTemplate?.maxScenarios || 1) && (
            <Button type="button" variant="outline" size="sm" onClick={() => setScenarios((prev) => [...prev, emptyScenario()])}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          )}
        </div>
        <div className="space-y-4">
          {scenarios.map((s, idx) => (
            <div key={idx} className="bg-slate-50 rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-700">Scenario {idx + 1}</span>
                <div className="flex gap-2">
                  <Dialog open={obDialogOpen === idx} onOpenChange={(open) => { setObDialogOpen(open ? idx : null); setObResults([]); }}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                        <RefreshCw className="w-3 h-3" /> Fetch from OB
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader><DialogTitle className="text-base">Optimal Blue Pricing</DialogTitle></DialogHeader>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {(["purchasePrice", "downPaymentPercent", "creditScore", "state", "zipCode"] as const).map((key) => (
                          <div key={key}>
                            <Label className="text-xs font-medium text-slate-600 mb-1 block">{key}</Label>
                            <Input className="h-8 text-sm" value={obForm[key]} onChange={(e) => setObForm((prev) => ({ ...prev, [key]: e.target.value }))} />
                          </div>
                        ))}
                      </div>
                      <Button type="button" className="w-full mb-4 text-white" style={{ backgroundColor: "#6633cc" }} onClick={fetchOBPricing} disabled={obLoading}>
                        {obLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching…</> : "Get Rates"}
                      </Button>
                      {obResults.length > 0 && (
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {obResults.map((product, pidx) => (
                            <button key={pidx} type="button" onClick={() => applyOBProduct(idx, product)}
                              className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-blue-50 transition-colors">
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
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScenarios((prev) => prev.filter((_, i) => i !== idx))}>
                    <Minus className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sField(idx, "label", "Label")}
                {sField(idx, "loanType", "Loan type")}
                {sField(idx, "term", "Term (yrs)", "number")}
                {sField(idx, "purchasePrice", "Purchase price", "number")}
                {sField(idx, "downPaymentPercent", "Down %", "number")}
                {sField(idx, "loanAmount", "Loan amount", "number")}
                {sField(idx, "interestRate", "Rate", "number")}
                {sField(idx, "apr", "APR", "number")}
                {sField(idx, "piPayment", "P&I/mo", "number")}
                {sField(idx, "taxesInsurance", "Tax+Ins/mo", "number")}
                {sField(idx, "miPayment", "MI/mo", "number")}
                {sField(idx, "hoaFee", "HOA/mo", "number")}
              </div>
            </div>
          ))}
          {scenarios.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-sm text-slate-500 mb-3">No scenarios yet</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setScenarios([emptyScenario()])}>
                <Plus className="w-4 h-4 mr-1" /> Add scenario
              </Button>
            </div>
          )}
        </div>
      </div>
    ) : null,
    4: (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Preview & save</h2>
          <p className="text-sm text-slate-500">Review your flyer and save or download.</p>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400 text-xs">Template</span><p className="font-medium text-slate-900">{FLYER_TEMPLATES.find((t) => t.id === templateId)?.name}</p></div>
            <div><span className="text-slate-400 text-xs">Property</span><p className="font-medium text-slate-900 truncate">{propertyData.address || "Not entered"}</p></div>
            <div><span className="text-slate-400 text-xs">Price</span><p className="font-medium text-slate-900">{propertyData.price ? formatCurrency(propertyData.price) : "—"}</p></div>
            <div><span className="text-slate-400 text-xs">Photos</span><p className="font-medium text-slate-900">{(propertyData.photos || []).length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">QR Code URL (optional)</h3>
          </div>
          <Input className="h-9" placeholder="https://yourlisting.com/…" value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} />
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button type="button" variant="outline" onClick={() => handleSave("DRAFT")} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save as Draft
          </Button>
          <Button type="button" style={{ backgroundColor: "#6633cc" }} className="text-white" onClick={() => handleSave("SAVED")} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Flyer
          </Button>
          <Button type="button" variant="outline" onClick={handleDownloadPDF} disabled={isSaving}>
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>
    ),
  };

  const currentStepKey = step === 3 && !hasFinancing ? 4 : step;
  const content = stepContent[currentStepKey] ?? stepContent[0];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Flyer</h1>
        <p className="text-sm text-slate-500 mt-1">Update your flyer details.</p>
      </div>
      <StepIndicator currentStep={currentVisibleStep} />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">{content}</div>
      {step !== visibleSteps[visibleSteps.length - 1] && (
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={back} disabled={currentVisibleStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button type="button" style={{ backgroundColor: "#6633cc" }} className="text-white" onClick={advance}>
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
      {step === visibleSteps[visibleSteps.length - 1] && currentVisibleStep > 0 && (
        <Button type="button" variant="outline" onClick={back}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      )}
    </div>
  );
}

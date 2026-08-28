"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Loader2,
  Check,
  QrCode,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { FLYER_TEMPLATES } from "@/types";
import { US_STATES } from "@/lib/us-states";
import type { PropertyData } from "@/types";

const PROPERTY_ONLY_TEMPLATES = FLYER_TEMPLATES.filter((t) => !t.hasLoanScenarios);

// ---------- Step 1: Template ----------
function TemplateStep({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const layoutIcons: Record<string, React.ReactNode> = {
    single: (
      <div className="w-full h-16 bg-slate-100 rounded-md" />
    ),
    grid: (
      <div className="grid grid-cols-2 gap-1 w-full h-16">
        <div className="bg-slate-100 rounded-md" />
        <div className="bg-slate-100 rounded-md" />
        <div className="bg-slate-100 rounded-md" />
        <div className="bg-slate-100 rounded-md" />
      </div>
    ),
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Choose a template</h2>
      <p className="text-sm text-slate-500 mb-6">Select the layout that best fits your listing.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PROPERTY_ONLY_TEMPLATES.map((template) => (
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
            <div className="mb-3">{layoutIcons[template.photoLayout] || layoutIcons.single}</div>
            <h3 className="font-semibold text-slate-900 text-sm">{template.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
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
  const [zillowUrl, setZillowUrl] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const lookupZillow = async () => {
    if (!zillowUrl.trim()) return;
    setLookupLoading(true);
    try {
      const res = await fetch("/api/property-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: zillowUrl.trim() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Lookup failed");
      onChange(result.propertyData);
      toast.success("Property details filled in — double-check before saving");
    } catch (err: any) {
      toast.error(err.message || "Property lookup failed");
    } finally {
      setLookupLoading(false);
    }
  };

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

      {/* Zillow import */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
          Import from Zillow (optional)
        </Label>
        <div className="flex gap-2">
          <Input
            className="h-9"
            placeholder="https://www.zillow.com/homedetails/…"
            value={zillowUrl}
            onChange={(e) => setZillowUrl(e.target.value)}
            disabled={lookupLoading}
          />
          <Button
            type="button"
            variant="outline"
            className="h-9 shrink-0"
            onClick={lookupZillow}
            disabled={lookupLoading || !zillowUrl.trim()}
          >
            {lookupLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4 mr-1.5" />
                Lookup
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          Paste a Zillow listing link to auto-fill the fields below. Always double-check the
          results — photos aren&apos;t imported, so upload your own.
        </p>
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

// ---------- Step 3: Additional Details ----------
function DetailsStep({
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
  const templateLabel = FLYER_TEMPLATES.find((t) => t.id === templateId)?.name || templateId;

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
            <p className="font-medium text-slate-900">{templateLabel}</p>
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

function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, idx) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                idx < currentStep
                  ? "bg-emerald-500 text-white"
                  : idx === currentStep
                  ? "text-white"
                  : "bg-slate-100 text-slate-400"
              )}
              style={idx === currentStep ? { backgroundColor: "#6633cc" } : undefined}
            >
              {idx < currentStep ? <Check className="w-3.5 h-3.5" /> : idx + 1}
            </div>
            <span className={cn("text-sm font-medium", idx <= currentStep ? "text-slate-900" : "text-slate-400")}>
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && <div className="w-8 h-px bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}

// ---------- Main Page ----------
export default function NewRealtorFlyerPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState(PROPERTY_ONLY_TEMPLATES[0]?.id || "modern-minimal");
  const [propertyData, setPropertyData] = useState<Partial<PropertyData>>({ photos: [] });
  const [qrUrl, setQrUrl] = useState("");
  const [distributionState, setDistributionState] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const steps = ["Template", "Property", "Additional Details"];

  const canAdvance = () => {
    if (step === 0) return !!templateId;
    if (step === 1) return !!(propertyData.address && propertyData.city);
    return true;
  };

  const advance = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSave = async (status: "DRAFT" | "SAVED") => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/realtor-portal/flyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          propertyData,
          qrCodeData: qrUrl || null,
          status,
          distributionState: distributionState || null,
          title: propertyData.address
            ? `${propertyData.address}, ${propertyData.city}`
            : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save flyer");
      }
      const flyer = await res.json();
      toast.success(status === "SAVED" ? "Flyer saved!" : "Draft saved");
      if (status === "SAVED") {
        router.push(`/realtor/flyers/${flyer.id}/preview`);
      } else {
        router.push(`/realtor/flyers/${flyer.id}/edit`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save flyer");
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
    <DetailsStep
      key="details"
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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create New Flyer</h1>
        <p className="text-sm text-slate-500 mt-1">Follow the steps to build your listing flyer.</p>
      </div>

      <StepIndicator currentStep={step} steps={steps} />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        {stepComponents[step]}
      </div>

      {step !== steps.length - 1 && (
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
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
      {step === steps.length - 1 && (
        <Button type="button" variant="outline" onClick={back} className="mr-auto">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      )}
    </div>
  );
}

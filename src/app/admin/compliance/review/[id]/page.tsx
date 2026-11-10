"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import {
  ChevronLeft, Loader2, ShieldCheck, ShieldAlert, Clock, Eye, Save,
  Upload, X, QrCode, ZoomIn, ZoomOut, Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, calculateMonthlyPI, LOAN_TYPES, getMissingScenarioFields } from "@/lib/utils";
import { generateQRCodeDataURL } from "@/lib/qr-code";
import { US_STATES } from "@/lib/us-states";
import { FlyerPreview } from "@/components/flyer-templates/FlyerPreview";
import type { PhotoPosition } from "@/components/flyer-templates/PositionableImage";
import { FLYER_TEMPLATES } from "@/types";
import type { LoanScenario, PropertyData, Realtor, CompanySettings } from "@/types";

const APPROVAL_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  PENDING: { label: "Pending review", className: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock },
  APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: ShieldCheck },
  REJECTED: { label: "Changes requested", className: "bg-red-50 text-red-700 border-red-100", icon: ShieldAlert },
};

const DESCRIPTION_FONT_SIZES = [
  { label: "S", value: 10 },
  { label: "M", value: 12 },
  { label: "L", value: 14 },
  { label: "XL", value: 16 },
];

const ZOOM_STEPS = [0.40, 0.50, 0.60, 0.65, 0.75, 0.85, 1.0, 1.25, 1.5, 1.75, 2.0];
const DEFAULT_ZOOM = 0.5;

export default function ComplianceReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [flyer, setFlyer] = useState<any>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState("modern-minimal");
  const [propertyData, setPropertyData] = useState<Partial<PropertyData>>({ photos: [] });
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [realtorId, setRealtorId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [distributionState, setDistributionState] = useState("");
  const [scenarios, setScenarios] = useState<Partial<LoanScenario>[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [isEditingPhotos, setIsEditingPhotos] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const isSubmitting = isApplying || isPreviewing || isApproving || isRequestingChanges;

  const viewportRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/compliance/${id}`),
      fetch("/api/admin/company"),
    ])
      .then(async ([flyerRes, companyRes]) => {
        if (!flyerRes.ok) throw new Error();
        const data = await flyerRes.json();
        setFlyer(data);
        setTemplateId(data.templateId);
        setPropertyData(data.propertyData || { photos: [] });
        setRealtors(data.loanOfficer?.realtors || []);
        setRealtorId(data.realtorId);
        setQrUrl(data.qrCodeData || "");
        setDistributionState(data.distributionState || "");
        setScenarios(data.loanScenarios || []);
        setNotes(data.reviewNotes || "");
        if (companyRes.ok) setCompany(await companyRes.json());
        if (data.qrCodeData) setQrCodeDataUrl(await generateQRCodeDataURL(data.qrCodeData));
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

  const pField = (key: keyof PropertyData, label: string, type = "text", placeholder = "") => (
    <div>
      <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
      <Input
        type={type}
        className="h-8 text-sm"
        placeholder={placeholder}
        value={(propertyData[key] as string | number) ?? ""}
        onChange={(e) =>
          setPropertyData((prev) => ({
            ...prev,
            [key]: type === "number" ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value,
          }))
        }
      />
    </div>
  );

  const onPhotoDrop = useCallback(async (files: File[]) => {
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
    if (failed) toast.error(`${failed} photo${failed > 1 ? "s" : ""} failed to upload`);
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

  const buildPayload = (extra: Record<string, unknown> = {}) => ({
    templateId,
    propertyData,
    realtorId: realtorId || null,
    qrCodeData: qrUrl || null,
    distributionState: distributionState || null,
    reviewNotes: notes || null,
    loanScenarios: scenarios,
    ...extra,
  });

  const saveAll = async (extra: Record<string, unknown> = {}) => {
    const res = await fetch(`/api/admin/compliance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(extra)),
    });
    if (!res.ok) throw new Error();
    const updated = await res.json();
    setFlyer(updated);
    return updated;
  };

  const handlePhotoPositionChange = async (photoUrl: string, position: PhotoPosition) => {
    const nextPropertyData = {
      ...propertyData,
      photoPositions: { ...(propertyData.photoPositions || {}), [photoUrl]: position },
    };
    setPropertyData(nextPropertyData);
    try {
      const res = await fetch(`/api/admin/compliance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyData: nextPropertyData }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to save photo position");
    }
  };

  const zoomIn = () => {
    const next = ZOOM_STEPS.find((z) => z > zoom);
    if (next) setZoom(next);
  };
  const zoomOut = () => {
    const prev = [...ZOOM_STEPS].reverse().find((z) => z < zoom);
    if (prev) setZoom(prev);
  };

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = viewportRef.current;
    if (!el) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
    el.style.cursor = "grabbing";
    e.preventDefault();
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current || !viewportRef.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    viewportRef.current.scrollLeft = panStart.current.scrollLeft - dx;
    viewportRef.current.scrollTop = panStart.current.scrollTop - dy;
  }, []);
  const stopPan = useCallback(() => {
    isPanning.current = false;
    if (viewportRef.current) viewportRef.current.style.cursor = "grab";
  }, []);

  const handleApplyChanges = async () => {
    setIsApplying(true);
    try {
      await saveAll();
      toast.success("Changes applied");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsApplying(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      await saveAll();
      window.open(`/print/flyers/${id}`, "_blank");
    } catch {
      toast.error("Failed to save changes before preview");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApprove = async () => {
    if (scenarios.some((s) => getMissingScenarioFields(s).length > 0)) {
      toast.error("One or more scenarios are missing required fields — fill them in before approving");
      return;
    }
    setIsApproving(true);
    try {
      await saveAll({ decision: "APPROVED" });
      toast.success("Flyer approved");
      router.push("/admin/compliance");
    } catch {
      toast.error("Failed to approve flyer");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!notes.trim()) {
      toast.error("Add a note explaining what needs to change before sending it back to the LO");
      return;
    }
    setIsRequestingChanges(true);
    try {
      await saveAll({ decision: "REJECTED" });
      toast.success("Changes requested — LO will be notified");
      router.push("/admin/compliance");
    } catch {
      toast.error("Failed to request changes");
    } finally {
      setIsRequestingChanges(false);
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
  const previewFlyer = {
    ...flyer,
    templateId,
    propertyData,
    realtor: realtors.find((r) => r.id === realtorId) || null,
    loanScenarios: scenarios,
    distributionState: distributionState || null,
  };

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
      </div>

      {/* Submission summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-slate-400 text-xs">Submitted</span>
          <p className="font-medium text-slate-900">
            {flyer.submittedForReviewAt
              ? new Date(flyer.submittedForReviewAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "—"}
          </p>
        </div>
      </div>

      {/* Template */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Template</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FLYER_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplateId(t.id)}
              className={cn(
                "text-left rounded-lg border-2 p-3 transition-all",
                templateId === t.id ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <p className="text-xs font-semibold text-slate-900">{t.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Property information — editable */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Property information</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="col-span-2 sm:col-span-3">{pField("address", "Street address")}</div>
          {pField("city", "City")}
          {pField("state", "State")}
          {pField("zipCode", "Zip")}
          {pField("price", "List price", "number")}
          {pField("bedrooms", "Bedrooms", "number")}
          {pField("bathrooms", "Bathrooms", "number")}
          {pField("squareFeet", "Sq ft", "number")}
          {pField("yearBuilt", "Year built", "number")}
          {pField("garage", "Garage")}
          {pField("lotSize", "Lot size")}
          {pField("propertyType", "Property type")}
          {pField("propertyUse", "Property use")}
          {pField("stories", "# of stories", "number")}
          {pField("units", "# of units", "number")}
          {pField("mlsNumber", "MLS #")}
          {pField("openHouseDate", "Open house date", "date")}
          {pField("openHouseStartTime", "Start time", "time")}
          {pField("openHouseEndTime", "End time", "time")}
        </div>
        <div className="mb-4">
          <Label className="text-xs font-medium text-slate-600 mb-1 block">Description</Label>
          <Textarea
            className="min-h-[70px] resize-none text-sm"
            value={propertyData.description || ""}
            onChange={(e) => setPropertyData((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-500">Text size</span>
            <div className="flex rounded-md border border-slate-200 overflow-hidden">
              {DESCRIPTION_FONT_SIZES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPropertyData((prev) => ({ ...prev, descriptionFontSize: opt.value }))}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium border-r border-slate-200 last:border-r-0",
                    (propertyData.descriptionFontSize || 12) === opt.value
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-2 block">Photos</Label>
          {(propertyData.photos || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {(propertyData.photos || []).map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => {
                      const photos = [...(propertyData.photos || [])];
                      photos.splice(idx, 1);
                      setPropertyData((prev) => ({ ...prev, photos }));
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
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
              "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors",
              isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"
            )}
          >
            <input {...getInputProps()} />
            {photoUploading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" />
            ) : (
              <>
                <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <p className="text-xs text-slate-500">Drag & drop or click</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Realtor */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Realtor</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRealtorId(null)}
            className={cn(
              "text-left rounded-lg border-2 p-3 transition-all",
              realtorId === null ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"
            )}
          >
            <p className="font-semibold text-slate-700 text-sm">No realtor</p>
            <p className="text-xs text-slate-400 mt-0.5">Lender-only branding</p>
          </button>
          {realtors.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRealtorId(r.id)}
              className={cn(
                "text-left rounded-lg border-2 p-3 transition-all",
                realtorId === r.id ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <p className="font-semibold text-slate-900 text-sm truncate">{r.firstName} {r.lastName}</p>
              <p className="text-xs text-slate-500 truncate">{r.companyName}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Live preview + photo repositioning */}
      {company && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-slate-700">Live preview</h2>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={isEditingPhotos ? "default" : "outline"}
                className={isEditingPhotos ? "text-white" : undefined}
                style={isEditingPhotos ? { backgroundColor: "#6633cc" } : undefined}
                onClick={() => setIsEditingPhotos((v) => !v)}
              >
                <Move className="w-3.5 h-3.5 mr-1.5" />
                {isEditingPhotos ? "Done Repositioning" : "Reposition Photos"}
              </Button>
              <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={zoomOut} disabled={zoom <= ZOOM_STEPS[0]}>
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-medium text-slate-500 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={zoomIn} disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}>
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          {isEditingPhotos && (
            <p className="text-center text-xs text-slate-500 mb-3">
              Drag any photo below to reposition it within its frame. Saves automatically.
            </p>
          )}
          <div
            ref={viewportRef}
            className="overflow-auto pb-4 select-none bg-slate-50 rounded-lg"
            style={{ maxHeight: "600px", cursor: isEditingPhotos ? "default" : "grab" }}
            onMouseDown={isEditingPhotos ? undefined : onMouseDown}
            onMouseMove={isEditingPhotos ? undefined : onMouseMove}
            onMouseUp={isEditingPhotos ? undefined : stopPan}
            onMouseLeave={isEditingPhotos ? undefined : stopPan}
          >
            <div className="flex justify-center p-4" style={{ minWidth: "fit-content" }}>
              <FlyerPreview
                flyer={previewFlyer}
                company={company}
                qrCodeDataUrl={qrCodeDataUrl}
                scale={zoom}
                onPhotoPositionChange={isEditingPhotos ? handlePhotoPositionChange : undefined}
              />
            </div>
          </div>
        </div>
      )}

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

      {/* Distribution + QR code */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">State of distribution</h2>
          <Select value={distributionState} onValueChange={(v) => setDistributionState(v ?? "")}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select a state…" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {US_STATES.map((st) => (
                <SelectItem key={st.abbr} value={st.abbr}>
                  {st.name} ({st.abbr})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <QrCode className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">QR code URL</h2>
          </div>
          <Input className="h-9" placeholder="https://yourlisting.com/…" value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} />
        </div>
      </div>

      {/* Decision */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Compliance notes</h2>
        <Textarea
          className="min-h-[90px] resize-none mb-4"
          placeholder="Internal notes, or what needs to change if sending this back to the LO…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-3 mb-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleApplyChanges}
            disabled={isSubmitting}
          >
            {isApplying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Apply Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handlePreview}
            disabled={isSubmitting}
          >
            {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Preview
          </Button>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleRequestChanges}
            disabled={isSubmitting}
          >
            {isRequestingChanges ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Request Changes
          </Button>
          <Button
            type="button"
            style={{ backgroundColor: "#059669" }}
            className="text-white flex-1"
            onClick={handleApprove}
            disabled={isSubmitting}
          >
            {isApproving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}

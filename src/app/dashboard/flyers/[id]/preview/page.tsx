"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Download, ChevronLeft, ZoomIn, ZoomOut, Share2, Check, ShieldCheck, Clock, ShieldAlert, Type, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FlyerPreview } from "@/components/flyer-templates/FlyerPreview";
import { generateQRCodeDataURL } from "@/lib/qr-code";
import { cn } from "@/lib/utils";
import type { Flyer, CompanySettings } from "@/types";

const DESCRIPTION_FONT_SIZES = [
  { label: "S", value: 10 },
  { label: "M", value: 12 },
  { label: "L", value: 14 },
  { label: "XL", value: 16 },
];
const DEFAULT_DESCRIPTION_FONT_SIZE = 12;

const APPROVAL_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  PENDING: { label: "Pending compliance review", className: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock },
  APPROVED: { label: "Approved by compliance", className: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: ShieldCheck },
  REJECTED: { label: "Changes requested", className: "bg-red-50 text-red-700 border-red-100", icon: ShieldAlert },
};

const ZOOM_STEPS = [0.40, 0.50, 0.60, 0.65, 0.75, 0.85, 1.0, 1.25, 1.5, 1.75, 2.0];
const DEFAULT_ZOOM = 0.65;

export default function FlyerPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [flyer, setFlyer] = useState<Flyer | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSubmittedDialog, setShowSubmittedDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [isEditingText, setIsEditingText] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [descriptionFontSizeDraft, setDescriptionFontSizeDraft] = useState(DEFAULT_DESCRIPTION_FONT_SIZE);
  const [isSavingText, setIsSavingText] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

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

  useEffect(() => {
    const load = async () => {
      try {
        const [flyerRes, companyRes] = await Promise.all([
          fetch(`/api/flyers/${id}`),
          fetch("/api/admin/company"),
        ]);
        if (!flyerRes.ok) throw new Error();
        const flyerData: Flyer = await flyerRes.json();
        setFlyer(flyerData);
        if (companyRes.ok) setCompany(await companyRes.json());

        if (flyerData.qrCodeData) {
          const dataUrl = await generateQRCodeDataURL(flyerData.qrCodeData);
          setQrCodeDataUrl(dataUrl);
        }
      } catch {
        toast.error("Failed to load flyer");
        router.push("/dashboard/flyers");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, router]);

  useEffect(() => {
    if (searchParams.get("submitted") === "1") {
      setShowSubmittedDialog(true);
      router.replace(`/dashboard/flyers/${id}/preview`);
    }
  }, [searchParams, id, router]);

  const handleCopyShare = async () => {
    if (!flyer?.shareToken) return;
    const url = `${window.location.origin}/share/${flyer.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Share link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
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
    } finally {
      setIsDownloading(false);
    }
  };

  const openTextEditor = () => {
    if (!flyer?.propertyData) return;
    setDescriptionDraft(flyer.propertyData.description || "");
    setDescriptionFontSizeDraft(
      flyer.propertyData.descriptionFontSize || DEFAULT_DESCRIPTION_FONT_SIZE
    );
    setIsEditingText(true);
  };

  const handleSaveText = async () => {
    if (!flyer?.propertyData) return;
    setIsSavingText(true);
    try {
      const res = await fetch(`/api/flyers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyData: {
            ...flyer.propertyData,
            description: descriptionDraft || null,
            descriptionFontSize: descriptionFontSizeDraft,
          },
        }),
      });
      if (!res.ok) throw new Error();
      const updated: Flyer = await res.json();
      setFlyer(updated);
      toast.success("Description updated");
      setIsEditingText(false);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSavingText(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!flyer || !company) return null;

  const hasScenarios = (flyer.loanScenarios?.length ?? 0) > 0;
  const isLocked = hasScenarios && flyer.approvalStatus !== "APPROVED";
  const badge = hasScenarios ? APPROVAL_BADGE[flyer.approvalStatus] : null;
  const lockedTitle = "This flyer includes loan scenarios pending compliance approval";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-slate-500">
            <Link href="/dashboard/flyers">
              <ChevronLeft className="w-4 h-4 mr-1" />
              My Flyers
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Flyer Preview</h1>
              {badge && (
                <Badge variant="secondary" className={`gap-1 ${badge.className}`}>
                  <badge.icon className="w-3 h-3" />
                  {badge.label}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">{flyer.title || "Untitled flyer"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/flyers/${id}/edit`}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => (isEditingText ? setIsEditingText(false) : openTextEditor())}
            disabled={isLocked}
            title={isLocked ? lockedTitle : undefined}
          >
            <Type className="w-4 h-4 mr-2" />
            Edit Text
          </Button>
          {flyer?.shareToken && (
            <Button variant="outline" onClick={handleCopyShare} disabled={isLocked} title={isLocked ? lockedTitle : undefined}>
              {copied ? (
                <Check className="w-4 h-4 mr-2 text-emerald-500" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copied!" : "Share"}
            </Button>
          )}
          <Button
            style={{ backgroundColor: "#6633cc" }}
            className="text-white"
            onClick={handleDownloadPDF}
            disabled={isDownloading || isLocked}
            title={isLocked ? lockedTitle : undefined}
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      {flyer.approvalStatus === "REJECTED" && flyer.reviewNotes && (
        <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold mb-1">Compliance requested changes:</p>
          <p>{flyer.reviewNotes}</p>
        </div>
      )}

      {isEditingText && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-900">Edit description</p>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditingText(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Textarea
            value={descriptionDraft}
            onChange={(e) => setDescriptionDraft(e.target.value)}
            rows={6}
            placeholder="Property description shown on the flyer"
            className="text-sm"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Text size</span>
              <div className="flex rounded-md border border-slate-200 overflow-hidden">
                {DESCRIPTION_FONT_SIZES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDescriptionFontSizeDraft(opt.value)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium border-r border-slate-200 last:border-r-0",
                      descriptionFontSizeDraft === opt.value
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              style={{ backgroundColor: "#6633cc" }}
              className="text-white"
              onClick={handleSaveText}
              disabled={isSavingText}
            >
              {isSavingText ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={zoomOut}
          disabled={zoom <= ZOOM_STEPS[0]}
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs font-medium text-slate-500 w-12 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={zoomIn}
          disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      {/* Flyer preview — drag to pan when zoomed */}
      <div
        ref={viewportRef}
        className="overflow-auto pb-6 select-none"
        style={{
          maxHeight: "calc(100vh - 200px)",
          cursor: "grab",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
      >
        <div className="flex justify-center p-4" style={{ minWidth: "fit-content" }}>
          <FlyerPreview
            flyer={flyer}
            company={company}
            qrCodeDataUrl={qrCodeDataUrl}
            scale={zoom}
          />
        </div>
      </div>

      <Dialog open={showSubmittedDialog} onOpenChange={setShowSubmittedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Submitted for compliance review
            </DialogTitle>
            <DialogDescription>
              The compliance and marketing team has been notified to review your flyer. No further
              action is needed. Please allow 24 hours for approval.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSubmittedDialog(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

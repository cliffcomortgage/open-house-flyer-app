"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Download, ChevronLeft, ZoomIn, ZoomOut, Share2, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FlyerPreview } from "@/components/flyer-templates/FlyerPreview";
import { generateQRCodeDataURL } from "@/lib/qr-code";
import type { Flyer, CompanySettings } from "@/types";

const ZOOM_STEPS = [0.40, 0.50, 0.60, 0.65, 0.75, 0.85, 1.0, 1.25, 1.5, 1.75, 2.0];
const DEFAULT_ZOOM = 0.65;

export default function RealtorFlyerPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [flyer, setFlyer] = useState<Flyer | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
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
          fetch(`/api/realtor-portal/flyers/${id}`),
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
        router.push("/realtor/flyers");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, router]);

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
      const res = await fetch(`/api/realtor-portal/flyers/${id}/pdf`, { method: "POST" });
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-slate-500">
            <Link href="/realtor/flyers">
              <ChevronLeft className="w-4 h-4 mr-1" />
              My Flyers
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Flyer Preview</h1>
            <p className="text-xs text-slate-500">{flyer.title || "Untitled flyer"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/realtor/flyers/${id}/edit`}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          {flyer?.shareToken && (
            <Button variant="outline" onClick={handleCopyShare}>
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
            disabled={isDownloading}
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
    </div>
  );
}

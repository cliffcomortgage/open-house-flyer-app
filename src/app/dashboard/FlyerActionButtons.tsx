"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share2, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FlyerActionButtons({
  flyerId,
  flyerTitle,
  shareToken,
  isLocked = false,
}: {
  flyerId: string;
  flyerTitle: string | null;
  shareToken: string | null;
  isLocked?: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const lockedTitle = "Pending compliance approval";

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/flyers/${flyerId}/pdf`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "PDF generation failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${flyerTitle || "flyer"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF generation failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyShare = async () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Share link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title={isLocked ? lockedTitle : "Download PDF"}
        onClick={handleDownloadPDF}
        disabled={downloading || isLocked}
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
      </Button>
      {shareToken && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={isLocked ? lockedTitle : "Copy share link"}
          onClick={handleCopyShare}
          disabled={isLocked}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
          )}
        </Button>
      )}
    </>
  );
}

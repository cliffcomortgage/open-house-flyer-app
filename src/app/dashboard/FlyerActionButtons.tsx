"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share2, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FlyerActionButtons({
  flyerId,
  flyerTitle,
  shareToken,
}: {
  flyerId: string;
  flyerTitle: string | null;
  shareToken: string | null;
}) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/flyers/${flyerId}/pdf`, { method: "POST" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${flyerTitle || "flyer"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF generation failed");
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
        title="Download PDF"
        onClick={handleDownloadPDF}
        disabled={downloading}
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
      </Button>
      {shareToken && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Copy share link"
          onClick={handleCopyShare}
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

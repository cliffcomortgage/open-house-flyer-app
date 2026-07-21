"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Eye,
  Trash2,
  Share2,
  Download,
  FileText,
  Filter,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Flyer } from "@/types";

const templateColors: Record<string, string> = {
  "modern-minimal": "#6633cc",
  "gallery-grid": "#6633cc",
  "showcase-one-rate": "#bde8f1",
  "market-leader": "#0d0d0d",
};

const templateLabels: Record<string, string> = {
  "modern-minimal": "Modern Minimal",
  "gallery-grid": "Gallery Grid",
  "showcase-one-rate": "Showcase + Rate",
  "market-leader": "Market Leader",
};

function FlyerCard({
  flyer,
  onDelete,
}: {
  flyer: Flyer & { realtor?: { firstName: string; lastName: string } | null };
  onDelete: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const propertyData = flyer.propertyData as any;
  const accentColor = templateColors[flyer.templateId] || "#6633cc";

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/flyers/${flyer.id}/pdf`, { method: "POST" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${flyer.title || "flyer"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF generation failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyShare = async () => {
    if (!flyer.shareToken) return;
    const url = `${window.location.origin}/share/${flyer.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Share link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-sm transition-shadow group">
      {/* Thumbnail */}
      <div
        className="h-36 relative flex items-center justify-center"
        style={{ backgroundColor: accentColor }}
      >
        {propertyData?.photos?.[0] ? (
          <img
            src={propertyData.photos[0]}
            alt="Property"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white/20 flex flex-col items-center gap-2">
            <FileText className="w-8 h-8" />
            <span className="text-xs font-medium tracking-wider uppercase opacity-50">
              {templateLabels[flyer.templateId] || "Flyer"}
            </span>
          </div>
        )}
        {/* Template badge overlay */}
        <div className="absolute top-2 left-2">
          <span className="text-xs font-medium px-2 py-1 rounded-md text-white bg-black/40 backdrop-blur-sm">
            {templateLabels[flyer.templateId] || flyer.templateId}
          </span>
        </div>
        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <Badge
            className={
              flyer.status === "SAVED"
                ? "bg-emerald-500 text-white border-0"
                : "bg-amber-500 text-white border-0"
            }
          >
            {flyer.status === "SAVED" ? "Saved" : "Draft"}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-sm truncate">
          {flyer.title || propertyData?.address || "Untitled Flyer"}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {flyer.realtor
            ? `${flyer.realtor.firstName} ${flyer.realtor.lastName}`
            : "No realtor assigned"}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
          {new Date(flyer.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Edit">
            <Link href={`/dashboard/flyers/${flyer.id}/edit`}>
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Preview">
            <Link href={`/dashboard/flyers/${flyer.id}/preview`}>
              <Eye className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </Button>
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
          {flyer.shareToken && (
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 ml-auto text-red-500 hover:bg-red-50 hover:text-red-600 px-2"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete
          </Button>
        </div>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete flyer?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this flyer and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { setConfirmOpen(false); onDelete(); }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function FlyersPage() {
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  const fetchFlyers = async () => {
    try {
      const res = await fetch("/api/flyers");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFlyers(data);
    } catch {
      toast.error("Failed to load flyers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlyers();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/flyers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Flyer deleted");
      setFlyers((prev) => prev.filter((f) => f.id !== id));
    } catch {
      toast.error("Failed to delete flyer");
    }
  };

  const filtered = flyers
    .filter((f) => statusFilter === "ALL" || f.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === "date-asc") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      return 0;
    });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Flyers</h1>
          <p className="text-sm text-slate-500 mt-1">
            {flyers.length} flyer{flyers.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild style={{ backgroundColor: "#6633cc" }} className="text-white">
          <Link href="/dashboard/flyers/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Flyer
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All status</SelectItem>
            <SelectItem value="DRAFT">Drafts</SelectItem>
            <SelectItem value="SAVED">Saved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "date-desc")}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest first</SelectItem>
            <SelectItem value="date-asc">Oldest first</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-64 animate-pulse">
              <div className="h-36 bg-slate-200 rounded-t-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-700 mb-2">
            {statusFilter !== "ALL" ? "No flyers match this filter" : "No flyers yet"}
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            {statusFilter !== "ALL"
              ? "Try changing the status filter."
              : "Create your first open house flyer to get started."}
          </p>
          {statusFilter === "ALL" && (
            <Button asChild style={{ backgroundColor: "#6633cc" }} className="text-white">
              <Link href="/dashboard/flyers/new">
                <Plus className="w-4 h-4 mr-2" />
                Create your first flyer
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((flyer) => (
            <FlyerCard
              key={flyer.id}
              flyer={flyer}
              onDelete={() => handleDelete(flyer.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

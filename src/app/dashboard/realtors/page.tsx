"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Phone, Mail, Globe, Building, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { Realtor } from "@/types";
import { formatPhone } from "@/lib/utils";

function RealtorCard({ realtor, onDelete }: { realtor: Realtor; onDelete: () => void }) {
  const initials = `${realtor.firstName[0]}${realtor.lastName[0]}`.toUpperCase();
  const brandColor = realtor.brandPrimary || "#6633cc";

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-sm transition-shadow">
      {/* Color accent top bar */}
      <div className="h-1.5" style={{ backgroundColor: brandColor }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {realtor.headshotUrl ? (
              <img
                src={realtor.headshotUrl}
                alt={`${realtor.firstName} ${realtor.lastName}`}
                className="w-12 h-12 rounded-full object-cover border-2 border-slate-100"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm truncate">
                {realtor.firstName} {realtor.lastName}
              </h3>
              <p className="text-xs text-slate-500 truncate">{realtor.title}</p>
            </div>
          </div>

          <div className="flex gap-1 shrink-0">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href={`/dashboard/realtors/${realtor.id}/edit`}>
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete realtor?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {realtor.firstName} {realtor.lastName} and cannot be undone.
                    Any flyers associated with this realtor will still exist but will no longer show their info.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Company */}
        <div className="flex items-center gap-2 mb-3">
          {realtor.companyLogoUrl ? (
            <img
              src={realtor.companyLogoUrl}
              alt={realtor.companyName}
              className="h-5 object-contain max-w-[80px]"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-600 truncate">
                {realtor.companyName}
              </span>
            </div>
          )}
          {realtor.brandPrimary && (
            <div className="flex gap-1 ml-auto">
              <div
                className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: realtor.brandPrimary }}
                title="Brand primary color"
              />
              {realtor.brandSecondary && (
                <div
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: realtor.brandSecondary }}
                  title="Brand secondary color"
                />
              )}
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-1.5">
          {realtor.cellPhone && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone className="w-3 h-3 text-slate-300 shrink-0" />
              <span>{formatPhone(realtor.cellPhone)}</span>
            </div>
          )}
          {realtor.email && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Mail className="w-3 h-3 text-slate-300 shrink-0" />
              <span className="truncate">{realtor.email}</span>
            </div>
          )}
          {realtor.website && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Globe className="w-3 h-3 text-slate-300 shrink-0" />
              <a
                href={realtor.website}
                target="_blank"
                rel="noreferrer"
                className="truncate hover:text-blue-600"
              >
                {realtor.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RealtorsPage() {
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRealtors = async () => {
    try {
      const res = await fetch("/api/realtors");
      if (!res.ok) throw new Error("Failed to fetch realtors");
      const data = await res.json();
      setRealtors(data);
    } catch {
      toast.error("Failed to load realtors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtors();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/realtors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Realtor deleted");
      setRealtors((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Failed to delete realtor");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Realtors</h1>
          <p className="text-sm text-slate-500 mt-1">
            {realtors.length} realtor{realtors.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Button asChild style={{ backgroundColor: "#6633cc" }} className="text-white">
          <Link href="/dashboard/realtors/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Realtor
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-52 animate-pulse">
              <div className="h-1.5 bg-slate-200 rounded-t-xl" />
            </div>
          ))}
        </div>
      ) : realtors.length === 0 ? (
        <div className="text-center py-24">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-700 mb-2">No realtors yet</h3>
          <p className="text-sm text-slate-400 mb-6">
            Add your partner realtors to quickly include them on flyers.
          </p>
          <Button asChild style={{ backgroundColor: "#6633cc" }} className="text-white">
            <Link href="/dashboard/realtors/new">
              <Plus className="w-4 h-4 mr-2" />
              Add your first realtor
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {realtors.map((realtor) => (
            <RealtorCard
              key={realtor.id}
              realtor={realtor}
              onDelete={() => handleDelete(realtor.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

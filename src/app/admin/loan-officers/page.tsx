"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Pencil, Trash2, UserCheck, UserX, Loader2, Upload, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { LoanOfficer } from "@/types";
import { cn } from "@/lib/utils";

const newLOSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  nmlsNumber: z.string().min(1, "Required"),
  officePhone: z.string().optional(),
  cellPhone: z.string().optional(),
  website: z.string().optional().or(z.literal("")),
  branchStreet: z.string().optional(),
  branchSuite: z.string().optional(),
  branchCity: z.string().optional(),
  branchState: z.string().optional(),
  branchZip: z.string().optional(),
  branchNmls: z.string().optional(),
});

type NewLOForm = z.infer<typeof newLOSchema>;

function HeadshotDropzone({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const [uploading, setUploading] = useState(false);
  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "headshots");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { publicUrl } = await res.json();
      onChange(publicUrl);
      toast.success("Headshot uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onChange]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] }, maxFiles: 1, maxSize: 5 * 1024 * 1024,
  });
  return (
    <div>
      <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Headshot <span className="text-slate-400 font-normal">(optional)</span></Label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Headshot" className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
          <button type="button" onClick={() => onChange(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div {...getRootProps()} className={cn("border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors", isDragActive ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:border-slate-300")}>
          <input {...getInputProps()} />
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-violet-500" /> : (
            <>
              <Upload className="w-4 h-4 mx-auto text-slate-400 mb-1" />
              <p className="text-xs text-slate-500">{isDragActive ? "Drop here" : "Drag & drop or click"}</p>
              <p className="text-xs text-slate-400">JPG, PNG · Max 5MB</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminLoanOfficersPage() {
  const [loanOfficers, setLoanOfficers] = useState<LoanOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewLOForm>({
    resolver: zodResolver(newLOSchema),
    defaultValues: { title: "Loan Officer" },
  });

  const fetchLOs = async () => {
    try {
      const res = await fetch("/api/admin/loan-officers");
      if (!res.ok) throw new Error();
      setLoanOfficers(await res.json());
    } catch {
      toast.error("Failed to load loan officers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLOs();
  }, []);

  const onSubmit = async (data: NewLOForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/loan-officers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, headshotUrl }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create LO");
      }
      toast.success("Loan officer created");
      setDialogOpen(false);
      reset();
      setHeadshotUrl(null);
      fetchLOs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (lo: LoanOfficer) => {
    try {
      const res = await fetch(`/api/admin/loan-officers/${lo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !lo.user.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(lo.user.isActive ? "Account deactivated" : "Account activated");
      fetchLOs();
    } catch {
      toast.error("Failed to update account status");
    }
  };

  const deleteLO = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/loan-officers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Loan officer deleted");
      setLoanOfficers((prev) => prev.filter((lo) => lo.id !== id));
    } catch {
      toast.error("Failed to delete loan officer");
    }
  };

  const fieldEl = (id: keyof NewLOForm, label: string, type = "text", placeholder = "") => (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className={cn("h-9", errors[id] && "border-red-400")}
        {...register(id)}
      />
      {errors[id] && <p className="text-red-500 text-xs mt-1">{(errors[id] as any)?.message}</p>}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loan Officers</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loanOfficers.length} loan officer{loanOfficers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <button
            onClick={() => setDialogOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#6633cc",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "18px", lineHeight: "1", fontWeight: "300" }}>+</span>
            Add Loan Officer
          </button>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Loan Officer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <HeadshotDropzone value={headshotUrl} onChange={setHeadshotUrl} />
              <div className="grid grid-cols-2 gap-3">
                {fieldEl("email", "Email", "email")}
                {fieldEl("password", "Temporary password", "password")}
                {fieldEl("firstName", "First name")}
                {fieldEl("lastName", "Last name")}
                {fieldEl("title", "Title")}
                {fieldEl("nmlsNumber", "NMLS Number")}
                {fieldEl("officePhone", "Office phone")}
                {fieldEl("cellPhone", "Cell phone")}
              </div>
              {fieldEl("website", "Website", "text", "cliffcomortgage.com")}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Branch address</Label>
                <div className="space-y-2">
                  <Input className="h-9" placeholder="Street address" {...register("branchStreet")} />
                  <div className="grid grid-cols-3 gap-2">
                    <Input className="h-9" placeholder="Suite #" {...register("branchSuite")} />
                    <Input className="h-9 col-span-2" placeholder="City" {...register("branchCity")} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input className="h-9" placeholder="State" {...register("branchState")} />
                    <Input className="h-9 col-span-2" placeholder="ZIP" {...register("branchZip")} />
                  </div>
                </div>
              </div>
              {fieldEl("branchNmls", "Branch NMLS#")}
              <div className="flex gap-3 pt-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  style={{ backgroundColor: "#6633cc" }}
                  className="text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : "Create Account"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">NMLS#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loanOfficers.map((lo) => (
                  <tr key={lo.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-slate-900">{lo.firstName} {lo.lastName}</p>
                        <p className="text-xs text-slate-500">{lo.title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{lo.user.email}</td>
                    <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell font-mono text-xs">{lo.nmlsNumber}</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="secondary"
                        className={lo.user.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-red-50 text-red-700 border-red-100"}
                      >
                        {lo.user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                          <Link href={`/admin/loan-officers/${lo.id}/edit`}>
                            <Pencil className="w-3.5 h-3.5 text-slate-400" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={lo.user.isActive ? "Deactivate" : "Activate"}
                          onClick={() => toggleActive(lo)}
                        >
                          {lo.user.isActive
                            ? <UserX className="w-3.5 h-3.5 text-amber-500" />
                            : <UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50" title="Delete">
                              <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete loan officer?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {lo.firstName} {lo.lastName}&apos;s account, including all their realtors and flyers. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteLO(lo.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {loanOfficers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-sm text-slate-400">
                      No loan officers yet. Click "Add Loan Officer" to create the first account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

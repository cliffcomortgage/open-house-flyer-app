"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Loader2, ChevronLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { LoanOfficer } from "@/types";

const editLOSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  nmlsNumber: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  officePhone: z.string().optional(),
  cellPhone: z.string().optional(),
  website: z.string().optional().or(z.literal("")),
  branchStreet: z.string().optional(),
  branchSuite: z.string().optional(),
  branchCity: z.string().optional(),
  branchState: z.string().optional(),
  branchZip: z.string().optional(),
  branchNmls: z.string().optional(),
  disclaimer: z.string().optional(),
  isActive: z.boolean(),
});

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
      <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Headshot</Label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Headshot" className="w-24 h-24 rounded-lg object-cover border border-slate-200" />
          <button type="button" onClick={() => onChange(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div {...getRootProps()} className={cn("border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors", isDragActive ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:border-slate-300")}>
          <input {...getInputProps()} />
          {uploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-violet-500" /> : (
            <>
              <Upload className="w-5 h-5 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">{isDragActive ? "Drop here" : "Drag & drop or click to upload"}</p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

type EditLOForm = z.infer<typeof editLOSchema>;

export default function EditLoanOfficerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditLOForm>({
    resolver: zodResolver(editLOSchema),
    defaultValues: { isActive: true, title: "Loan Officer" },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/loan-officers/${id}`);
        if (!res.ok) throw new Error();
        const lo: LoanOfficer = await res.json();
        reset({
          firstName: lo.firstName,
          lastName: lo.lastName,
          title: lo.title,
          nmlsNumber: lo.nmlsNumber,
          email: lo.email,
          officePhone: lo.officePhone || "",
          cellPhone: lo.cellPhone || "",
          website: lo.website || "",
          branchStreet: lo.branchAddress || "",
          branchSuite: "",
          branchCity: "",
          branchState: "",
          branchZip: "",
          branchNmls: lo.branchNmls || "",
          disclaimer: lo.disclaimer || "",
          isActive: lo.user.isActive,
        });
        setHeadshotUrl(lo.headshotUrl || null);
      } catch {
        toast.error("Failed to load loan officer");
        router.push("/admin/loan-officers");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, reset, router]);

  const onSubmit = async (data: EditLOForm) => {
    setIsSaving(true);
    try {
      const addrParts: string[] = [];
      if (data.branchStreet?.trim()) addrParts.push(data.branchStreet.trim());
      if (data.branchSuite?.trim()) addrParts.push(`Suite ${data.branchSuite.trim()}`);
      if (data.branchCity?.trim()) addrParts.push(data.branchCity.trim());
      const stateZip = [data.branchState?.trim(), data.branchZip?.trim()].filter(Boolean).join(" ");
      if (stateZip) addrParts.push(stateZip);
      const branchAddress = addrParts.join(", ") || undefined;

      const res = await fetch(`/api/admin/loan-officers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, branchAddress, headshotUrl }),
      });
      if (!res.ok) throw new Error();
      toast.success("Loan officer updated");
      router.push("/admin/loan-officers");
    } catch {
      toast.error("Failed to update loan officer");
    } finally {
      setIsSaving(false);
    }
  };

  const isActive = watch("isActive");

  const fieldEl = (id: keyof EditLOForm, label: string, type = "text", placeholder = "") => (
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

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm" className="text-slate-500">
          <Link href="/admin/loan-officers">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Edit Loan Officer</h1>
          <p className="text-xs text-slate-500">Update loan officer information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Account Status</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", !!checked)}
              />
              <div>
                <Label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Account active
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inactive accounts cannot sign in to Cliffco Flyer Studio.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fieldEl("firstName", "First name")}
              {fieldEl("lastName", "Last name")}
            </div>
            {fieldEl("title", "Title")}
            <div className="grid grid-cols-2 gap-4">
              {fieldEl("nmlsNumber", "NMLS Number")}
              {fieldEl("email", "Email", "email")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {fieldEl("cellPhone", "Cell phone")}
              {fieldEl("officePhone", "Office phone")}
            </div>
            {fieldEl("website", "Website", "text", "cliffcomortgage.com")}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Branch Information</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {fieldEl("branchStreet", "Street address")}
            <div className="grid grid-cols-3 gap-3">
              {fieldEl("branchSuite", "Suite #")}
              <div className="col-span-2">{fieldEl("branchCity", "City")}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {fieldEl("branchState", "State")}
              <div className="col-span-2">{fieldEl("branchZip", "ZIP")}</div>
            </div>
            {fieldEl("branchNmls", "Branch NMLS#")}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Headshot</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <HeadshotDropzone value={headshotUrl} onChange={setHeadshotUrl} />
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Disclaimer Text</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <Textarea
              className="min-h-[100px] resize-none text-xs"
              {...register("disclaimer")}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button asChild variant="outline" type="button">
            <Link href="/admin/loan-officers">Cancel</Link>
          </Button>
          <Button
            type="submit"
            style={{ backgroundColor: "#6633cc" }}
            className="text-white"
            disabled={isSaving}
          >
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

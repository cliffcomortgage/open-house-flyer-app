"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Realtor } from "@/types";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().min(1, "Title is required"),
  companyName: z.string().min(1, "Company name is required"),
  officePhone: z.string().optional(),
  cellPhone: z.string().optional(),
  website: z.string().optional().or(z.literal("")),
  officeStreet: z.string().optional(),
  officeSuite: z.string().optional(),
  officeCity: z.string().optional(),
  officeState: z.string().optional(),
  officeZip: z.string().optional(),
  brandPrimary: z.string().optional().or(z.literal("")),
  brandSecondary: z.string().optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

function ImageDropzone({
  label,
  value,
  onChange,
  folder,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
}) {
  const [uploading, setUploading] = useState(false);
  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error();
        const { publicUrl } = await res.json();
        onChange(publicUrl);
        toast.success("Image uploaded");
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange, folder]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  return (
    <div>
      <Label className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</Label>
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative inline-block shrink-0">
            <img src={value} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 shrink-0">
            <User className="w-6 h-6 text-slate-300" />
          </div>
        )}
        <div
          {...getRootProps()}
          className={cn(
            "flex-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors",
            isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"
          )}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto text-blue-500" />
          ) : (
            <p className="text-xs text-slate-500">{isDragActive ? "Drop here" : "Drag & drop or click to upload"}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RealtorProfilePage() {
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/realtor-portal/me");
        if (!res.ok) throw new Error();
        const realtor: Realtor = await res.json();
        reset({
          firstName: realtor.firstName,
          lastName: realtor.lastName,
          title: realtor.title,
          companyName: realtor.companyName,
          officePhone: realtor.officePhone || "",
          cellPhone: realtor.cellPhone || "",
          website: realtor.website || "",
          officeStreet: realtor.officeStreet || "",
          officeSuite: realtor.officeSuite || "",
          officeCity: realtor.officeCity || "",
          officeState: realtor.officeState || "",
          officeZip: realtor.officeZip || "",
          brandPrimary: realtor.brandPrimary || "",
          brandSecondary: realtor.brandSecondary || "",
        });
        setHeadshotUrl(realtor.headshotUrl);
        setCompanyLogoUrl(realtor.companyLogoUrl);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [reset]);

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/realtor-portal/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, headshotUrl, companyLogoUrl }),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const fieldEl = (id: keyof ProfileForm, label: string, type = "text", placeholder = "") => (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-slate-700 mb-1.5 block">
        {label}
      </Label>
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
        <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
        {[1, 2].map((i) => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Your information appears on the listing flyers you create.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Photos</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <ImageDropzone label="Headshot" value={headshotUrl} onChange={setHeadshotUrl} folder="headshots" />
            <ImageDropzone label="Company Logo" value={companyLogoUrl} onChange={setCompanyLogoUrl} folder="logos" />
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
            <div className="grid grid-cols-2 gap-4">
              {fieldEl("title", "Title", "text", "Realtor")}
              {fieldEl("companyName", "Company name")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {fieldEl("cellPhone", "Cell phone")}
              {fieldEl("officePhone", "Office phone")}
            </div>
            {fieldEl("website", "Website", "text", "yourwebsite.com")}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Office Address</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <Input className="h-9" placeholder="Street address" {...register("officeStreet")} />
            <div className="grid grid-cols-3 gap-2">
              <Input className="h-9" placeholder="Suite #" {...register("officeSuite")} />
              <Input className="h-9 col-span-2" placeholder="City" {...register("officeCity")} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input className="h-9" placeholder="State" {...register("officeState")} />
              <Input className="h-9 col-span-2" placeholder="ZIP" {...register("officeZip")} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4">
              {fieldEl("brandPrimary", "Primary color", "text", "#6633cc")}
              {fieldEl("brandSecondary", "Secondary color", "text", "#0d0d0d")}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" style={{ backgroundColor: "#6633cc" }} className="text-white" disabled={isSaving}>
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}

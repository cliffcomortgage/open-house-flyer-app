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
import type { LoanOfficer } from "@/types";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().min(1, "Title is required"),
  nmlsNumber: z.string().min(1, "NMLS number is required"),
  officePhone: z.string().optional(),
  cellPhone: z.string().optional(),
  email: z.string().email("Invalid email"),
  website: z.string().optional().or(z.literal("")),
  branchStreet: z.string().optional(),
  branchSuite: z.string().optional(),
  branchCity: z.string().optional(),
  branchState: z.string().optional(),
  branchZip: z.string().optional(),
  branchNmls: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
        const res = await fetch("/api/loan-officers/me");
        if (!res.ok) throw new Error();
        const lo: LoanOfficer = await res.json();
        reset({
          firstName: lo.firstName,
          lastName: lo.lastName,
          title: lo.title,
          nmlsNumber: lo.nmlsNumber,
          officePhone: lo.officePhone || "",
          cellPhone: lo.cellPhone || "",
          email: lo.email,
          website: lo.website || "",
          branchStreet: lo.branchStreet || "",
          branchSuite: lo.branchSuite || "",
          branchCity: lo.branchCity || "",
          branchState: lo.branchState || "",
          branchZip: lo.branchZip || "",
          branchNmls: lo.branchNmls || "",
        });
        setHeadshotUrl(lo.headshotUrl);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [reset]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "headshots");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { publicUrl } = await res.json();
      setHeadshotUrl(publicUrl);
      toast.success("Headshot uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/loan-officers/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, headshotUrl }),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const fieldEl = (
    id: keyof ProfileForm,
    label: string,
    type = "text",
    placeholder = ""
  ) => (
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
      {errors[id] && (
        <p className="text-red-500 text-xs mt-1">{(errors[id] as any)?.message}</p>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your information appears on all flyers you create.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Headshot */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Headshot</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex items-center gap-6">
              {headshotUrl ? (
                <div className="relative inline-block shrink-0">
                  <img
                    src={headshotUrl}
                    alt="Headshot"
                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setHeadshotUrl(null)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 shrink-0">
                  <User className="w-7 h-7 text-slate-300" />
                </div>
              )}
              <div
                {...getRootProps()}
                className={cn(
                  "flex-1 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1.5" />
                    <p className="text-xs text-slate-500">
                      {isDragActive ? "Drop here" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal details */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fieldEl("firstName", "First name")}
              {fieldEl("lastName", "Last name")}
            </div>
            {fieldEl("title", "Title", "text", "Loan Officer")}
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

        {/* Branch details */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Branch Information</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
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
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            style={{ backgroundColor: "#6633cc" }}
            className="text-white"
            disabled={isSaving}
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
            ) : (
              "Save Profile"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

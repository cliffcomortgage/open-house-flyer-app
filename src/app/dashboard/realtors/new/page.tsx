"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { detectBrand } from "@/lib/real-estate-brands";
import { cn } from "@/lib/utils";

const realtorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().min(1, "Required"),
  companyName: z.string().min(1, "Company name is required"),
  officePhone: z.string().optional(),
  cellPhone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  officeStreet: z.string().optional(),
  officeSuite: z.string().optional(),
  officeCity: z.string().optional(),
  officeState: z.string().optional(),
  officeZip: z.string().optional(),
  brandPrimary: z.string().optional(),
  brandSecondary: z.string().optional(),
});

type RealtorForm = z.infer<typeof realtorSchema>;

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
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
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
    [folder, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  return (
    <div>
      <Label className="text-sm font-medium text-slate-700 mb-2 block">{label}</Label>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt={label}
            className="w-24 h-24 rounded-lg object-cover border border-slate-200"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" />
          ) : (
            <>
              <Upload className="w-5 h-5 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">
                {isDragActive ? "Drop here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewRealtorPage() {
  const router = useRouter();
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [detectedBrand, setDetectedBrand] = useState<{
    name: string;
    primaryColor: string;
    secondaryColor: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overrideBrand, setOverrideBrand] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RealtorForm>({
    resolver: zodResolver(realtorSchema),
    defaultValues: { title: "Realtor" },
  });

  const companyName = watch("companyName");

  useEffect(() => {
    if (!companyName) {
      setDetectedBrand(null);
      return;
    }
    const brand = detectBrand(companyName);
    if (brand) {
      setDetectedBrand(brand);
      if (!overrideBrand) {
        setValue("brandPrimary", brand.primaryColor);
        setValue("brandSecondary", brand.secondaryColor);
      }
    } else {
      setDetectedBrand(null);
    }
  }, [companyName, overrideBrand, setValue]);

  const onSubmit = async (data: RealtorForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/realtors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          headshotUrl,
          companyLogoUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create realtor");
      }
      toast.success("Realtor added successfully");
      router.push("/dashboard/realtors");
    } catch (err: any) {
      toast.error(err.message || "Failed to create realtor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryColor = watch("brandPrimary");
  const secondaryColor = watch("brandSecondary");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm" className="text-slate-500">
          <Link href="/dashboard/realtors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Add Realtor</h1>
          <p className="text-xs text-slate-500">Save a partner realtor for flyer co-branding</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal info */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-slate-700 mb-1.5 block">
                  First name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  className={cn("h-9", errors.firstName && "border-red-400")}
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Last name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  className={cn("h-9", errors.lastName && "border-red-400")}
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Title
              </Label>
              <Input id="title" className="h-9" placeholder="Realtor" {...register("title")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cellPhone" className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Cell phone
                </Label>
                <Input id="cellPhone" className="h-9" placeholder="(555) 000-0000" {...register("cellPhone")} />
              </div>
              <div>
                <Label htmlFor="officePhone" className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Office phone
                </Label>
                <Input id="officePhone" className="h-9" placeholder="(555) 000-0000" {...register("officePhone")} />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className={cn("h-9", errors.email && "border-red-400")}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="website" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Website
              </Label>
              <Input
                id="website"
                placeholder="realtor.com/agent/name"
                className="h-9"
                {...register("website")}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Office address</Label>
              <div className="space-y-2">
                <Input className="h-9" placeholder="Street address" {...register("officeStreet")} />
                <div className="grid grid-cols-3 gap-2">
                  <Input className="h-9" placeholder="Suite #" {...register("officeSuite")} />
                  <Input className="h-9 col-span-2" placeholder="City" {...register("officeCity")} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input className="h-9" placeholder="State" {...register("officeState")} />
                  <Input className="h-9 col-span-2" placeholder="ZIP" {...register("officeZip")} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company & Brand */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Company & Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div>
              <Label htmlFor="companyName" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Company name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="e.g. Keller Williams, RE/MAX, Compass…"
                className={cn("h-9", errors.companyName && "border-red-400")}
                {...register("companyName")}
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>
              )}
            </div>

            {/* Brand detection badge */}
            {detectedBrand && !overrideBrand && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-800">
                    Brand detected: {detectedBrand.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Colors set automatically
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <div
                    className="w-5 h-5 rounded border-2 border-white shadow"
                    style={{ backgroundColor: detectedBrand.primaryColor }}
                  />
                  <div
                    className="w-5 h-5 rounded border-2 border-white shadow"
                    style={{ backgroundColor: detectedBrand.secondaryColor }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setOverrideBrand(true)}
                  className="text-xs text-blue-500 underline underline-offset-2 hover:text-blue-700 shrink-0"
                >
                  Override
                </button>
              </div>
            )}

            {/* Manual color pickers */}
            {(!detectedBrand || overrideBrand) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brandPrimary" className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Brand primary color
                  </Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      id="brandPrimary"
                      className="h-9 w-12 rounded border border-slate-200 cursor-pointer p-0.5"
                      {...register("brandPrimary")}
                    />
                    <Input
                      className="h-9 font-mono text-sm"
                      value={primaryColor || ""}
                      onChange={(e) => setValue("brandPrimary", e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="brandSecondary" className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Brand secondary color
                  </Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      id="brandSecondary"
                      className="h-9 w-12 rounded border border-slate-200 cursor-pointer p-0.5"
                      {...register("brandSecondary")}
                    />
                    <Input
                      className="h-9 font-mono text-sm"
                      value={secondaryColor || ""}
                      onChange={(e) => setValue("brandSecondary", e.target.value)}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Color preview strip */}
            {(primaryColor || secondaryColor) && (
              <div className="flex rounded-lg overflow-hidden border border-slate-200 h-8">
                {primaryColor && (
                  <div className="flex-1" style={{ backgroundColor: primaryColor }} title="Primary" />
                )}
                {secondaryColor && (
                  <div className="flex-1" style={{ backgroundColor: secondaryColor }} title="Secondary" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Photos</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-6">
              <ImageDropzone
                label="Headshot"
                value={headshotUrl}
                onChange={setHeadshotUrl}
                folder="headshots"
              />
              <ImageDropzone
                label="Company Logo"
                value={companyLogoUrl}
                onChange={setCompanyLogoUrl}
                folder="logos"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button asChild variant="outline" type="button">
            <Link href="/dashboard/realtors">Cancel</Link>
          </Button>
          <Button
            type="submit"
            style={{ backgroundColor: "#6633cc" }}
            className="text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Realtor"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

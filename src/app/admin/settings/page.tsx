"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, isLightColor } from "@/lib/utils";
import type { CompanySettings } from "@/types";

const settingsSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().optional().or(z.literal("")),
  phone: z.string().optional(),
  primaryColor: z.string().min(4, "Required"),
  secondaryColor: z.string().min(4, "Required"),
  licenseText: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

function LogoDropzone({
  logoUrl,
  onClear,
  uploading,
  isDragActive,
  getRootProps,
  getInputProps,
  label,
  hint,
  previewBg,
}: {
  logoUrl: string | null;
  onClear: () => void;
  uploading: boolean;
  isDragActive: boolean;
  getRootProps: () => object;
  getInputProps: () => object;
  label: string;
  hint: string;
  previewBg: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-600 mb-2">{label}</p>
      {logoUrl ? (
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="h-16 rounded-lg p-2 border border-slate-200 flex items-center"
              style={{ backgroundColor: previewBg }}
            >
              <img src={logoUrl} alt={label} className="h-full object-contain max-w-[120px]" />
            </div>
            <button
              type="button"
              onClick={onClear}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-500">Click × to remove and upload a new logo.</p>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors",
            isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"
          )}
          style={{ backgroundColor: previewBg !== "#ffffff" ? previewBg + "22" : undefined }}
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
              <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUrlLight, setLogoUrlLight] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingLight, setUploadingLight] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { primaryColor: "#6633cc", secondaryColor: "#0d0d0d" },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/company");
        if (!res.ok) throw new Error();
        const data: CompanySettings = await res.json();
        reset({
          name: data.name,
          website: data.website || "",
          phone: data.phone || "",
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          licenseText: data.licenseText || "",
        });
        setLogoUrl(data.logoUrl);
        setLogoUrlLight(data.logoUrlLight);
      } catch {
        toast.error("Failed to load company settings");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [reset]);

  const uploadFile = async (file: File, setter: (url: string) => void, setLoading: (v: boolean) => void) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "logos");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { publicUrl } = await res.json();
      setter(publicUrl);
      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    await uploadFile(file, setLogoUrl, setUploading);
  }, []);

  const onDropLight = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    await uploadFile(file, setLogoUrlLight, setUploadingLight);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".svg"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const { getRootProps: getRootPropsLight, getInputProps: getInputPropsLight, isDragActive: isDragActiveLight } = useDropzone({
    onDrop: onDropLight,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".svg"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const onSubmit = async (data: SettingsForm) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, logoUrl, logoUrlLight, licenseText: data.licenseText || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const primaryColor = watch("primaryColor") || "#6633cc";
  const secondaryColor = watch("secondaryColor") || "#0d0d0d";
  const companyName = watch("name") || "Cliffco Mortgage Bank";
  const primaryIsLight = isLightColor(primaryColor);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Company Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          These settings appear across all flyers created by your loan officers.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company info */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Company name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                className={cn("h-9", errors.name && "border-red-400")}
                {...register("name")}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700 mb-1.5 block">Phone</Label>
                <Input id="phone" className="h-9" {...register("phone")} />
              </div>
              <div>
                <Label htmlFor="website" className="text-sm font-medium text-slate-700 mb-1.5 block">Website</Label>
                <Input
                  id="website"
                  className={cn("h-9", errors.website && "border-red-400")}
                  {...register("website")}
                />
                {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="licenseText" className="text-sm font-medium text-slate-700 mb-1.5 block">
                State licensing statement
              </Label>
              <Textarea
                id="licenseText"
                className="text-sm resize-none"
                rows={2}
                placeholder="e.g. Licensed Mortgage Banker NYS Dept. of Financial Services"
                {...register("licenseText")}
              />
              <p className="text-xs text-slate-400 mt-1">Appears in the footer of all flyers next to Branch NMLS#</p>
            </div>
          </CardContent>
        </Card>

        {/* Logos */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Company Logos</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <LogoDropzone
              logoUrl={logoUrl}
              onClear={() => setLogoUrl(null)}
              uploading={uploading}
              isDragActive={isDragActive}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              label="Logo (Dark) — for light backgrounds"
              hint="PNG, SVG, JPG · Max 5MB · Transparent background preferred"
              previewBg="#ffffff"
            />
            <div className="border-t border-slate-100" />
            <LogoDropzone
              logoUrl={logoUrlLight}
              onClear={() => setLogoUrlLight(null)}
              uploading={uploadingLight}
              isDragActive={isDragActiveLight}
              getRootProps={getRootPropsLight}
              getInputProps={getInputPropsLight}
              label="Logo (White/Light) — for dark backgrounds"
              hint="PNG, SVG · Max 5MB · White or light version of your logo"
              previewBg="#1e1e2e"
            />
          </CardContent>
        </Card>

        {/* Brand colors */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor" className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Primary color
                </Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="primaryColor"
                    className="h-9 w-12 rounded border border-slate-200 cursor-pointer p-0.5"
                    {...register("primaryColor")}
                  />
                  <Input
                    className="h-9 font-mono text-sm"
                    value={primaryColor}
                    onChange={(e) => setValue("primaryColor", e.target.value)}
                    placeholder="#6633cc"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryColor" className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Secondary / accent color
                </Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="secondaryColor"
                    className="h-9 w-12 rounded border border-slate-200 cursor-pointer p-0.5"
                    {...register("secondaryColor")}
                  />
                  <Input
                    className="h-9 font-mono text-sm"
                    value={secondaryColor}
                    onChange={(e) => setValue("secondaryColor", e.target.value)}
                    placeholder="#0d0d0d"
                  />
                </div>
              </div>
            </div>

            {/* Footer preview */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-500 font-medium">Footer preview</p>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <div className="h-1" style={{ backgroundColor: primaryColor }} />
                <div
                  className="px-5 py-4 flex items-center justify-between"
                  style={{ backgroundColor: primaryColor + "15" }}
                >
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
                    ) : (
                      <div
                        className="h-8 w-24 rounded flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: primaryColor, color: primaryIsLight ? "#000" : "#fff" }}
                      >
                        {companyName.slice(0, 8)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900">{companyName}</p>
                      <p className="text-xs text-slate-500">Equal Housing Lender</p>
                    </div>
                  </div>
                  <div
                    className="h-6 w-16 rounded text-xs flex items-center justify-center font-semibold text-white"
                    style={{ backgroundColor: secondaryColor, color: isLightColor(secondaryColor) ? "#000" : "#fff" }}
                  >
                    NMLS
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" style={{ backgroundColor: "#6633cc" }} className="text-white" disabled={isSaving}>
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

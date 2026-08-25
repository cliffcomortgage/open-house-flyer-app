"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const setPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SetPasswordForm = z.infer<typeof setPasswordSchema>;

function SetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordForm>({
    resolver: zodResolver(setPasswordSchema),
  });

  const onSubmit = async (data: SetPasswordForm) => {
    if (!token) {
      toast.error("This link is missing its token. Ask your administrator to resend an invite.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      toast.success("Password set! You can now sign in.");
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <Image
            src="/logo-black.png"
            alt="Cliffco Mortgage Bank"
            width={160}
            height={48}
            className="object-contain"
            priority
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {!token ? (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Invalid link</h2>
              <p className="text-slate-500 text-sm">
                This link is missing its token. Ask your administrator to resend an invite.
              </p>
            </div>
          ) : done ? (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Password set</h2>
              <p className="text-slate-500 text-sm">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Set your password</h2>
                <p className="text-slate-500 text-sm">Choose a password to finish setting up your account.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-700 text-sm font-medium">
                    New password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className={cn("pl-9 h-11 border-slate-200", errors.password && "border-red-400")}
                      {...register("password")}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-slate-700 text-sm font-medium">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className={cn("pl-9 h-11 border-slate-200", errors.confirmPassword && "border-red-400")}
                      {...register("confirmPassword")}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-white font-semibold text-sm mt-2"
                  style={{ backgroundColor: "#6633cc" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting password…
                    </>
                  ) : (
                    "Set password"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordInner />
    </Suspense>
  );
}

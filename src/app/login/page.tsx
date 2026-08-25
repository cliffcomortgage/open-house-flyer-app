"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.success("Welcome back!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ backgroundColor: "#0d0d0d" }}
      >
        {/* Decorative accents */}
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: "#6633cc", transform: "translate(30%, 30%)" }}
        />
        <div
          className="absolute top-24 right-12 w-32 h-32 rounded-full opacity-10"
          style={{ backgroundColor: "#bde8f1" }}
        />
        <div
          className="absolute top-1/2 left-0 w-48 h-48 rounded-full opacity-5"
          style={{ backgroundColor: "#6633cc", transform: "translate(-50%, -50%)" }}
        />

        <div className="relative z-10">
          <div className="mb-16">
            <Image
              src="/logo-white.png"
              alt="Cliffco Mortgage Bank"
              width={200}
              height={60}
              className="object-contain"
              priority
            />
          </div>

          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4" style={{ textWrap: "balance" } as React.CSSProperties}>
              Create stunning open house flyers in minutes
            </h1>
            <p className="text-lg opacity-70 leading-relaxed" style={{ textWrap: "balance" } as React.CSSProperties}>
              Add your property details and financing scenarios, then generate print-ready, co-branded PDFs — all from one place.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex gap-8 text-sm opacity-50">
            <span>MLS Integration</span>
            <span>Live Rates</span>
            <span>Print-Ready PDFs</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
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
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Flyer Studio</h2>
              <p className="text-slate-500 text-sm">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700 text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@cliffcomortgage.com"
                    className={cn(
                      "pl-9 h-11 border-slate-200",
                      errors.email && "border-red-400"
                    )}
                    {...register("email")}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700 text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={cn(
                      "pl-9 h-11 border-slate-200",
                      errors.password && "border-red-400"
                    )}
                    {...register("password")}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
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
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Need access? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

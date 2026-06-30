import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, FileText, UserCheck, UserCog, Settings, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/dashboard");

  const [totalLOs, activeLOs, totalFlyers] = await Promise.all([
    prisma.loanOfficer.count(),
    prisma.user.count({ where: { role: "LO", isActive: true } }),
    prisma.flyer.count(),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage loan officers, users, and company settings.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total LOs</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{totalLOs}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active LOs</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{activeLOs}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Flyers</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{totalFlyers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/loan-officers">
          <div className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <h3 className="font-semibold text-slate-900">Loan Officers</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Add, edit, activate, or deactivate loan officer accounts.
            </p>
          </div>
        </Link>

        <Link href="/admin/settings">
          <div className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-slate-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <h3 className="font-semibold text-slate-900">Company Settings</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Update company name, logo, brand colors, and contact details.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

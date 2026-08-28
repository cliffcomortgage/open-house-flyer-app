import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSessionRealtorId } from "@/lib/session-realtor";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Plus, Eye, Pencil } from "lucide-react";

export default async function RealtorDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const realtorId = await getSessionRealtorId(session);
  if (!realtorId) redirect("/login");

  const realtor = await prisma.realtor.findUnique({
    where: { id: realtorId },
    select: {
      firstName: true,
      lastName: true,
      loanOfficer: { select: { firstName: true, lastName: true, title: true, email: true, officePhone: true, cellPhone: true } },
    },
  });
  if (!realtor) redirect("/login");

  const [totalFlyers, savedFlyers, recentFlyers] = await Promise.all([
    prisma.flyer.count({ where: { realtorId } }),
    prisma.flyer.count({ where: { realtorId, status: "SAVED" } }),
    prisma.flyer.findMany({
      where: { realtorId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const templateLabels: Record<string, string> = {
    "modern-minimal": "Modern Minimal",
    "gallery-grid": "Gallery Grid",
  };

  const lo = realtor.loanOfficer;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {realtor.firstName}!</h1>
          <p className="text-slate-500 mt-1 text-sm">Here&apos;s what&apos;s happening with your listing flyers.</p>
        </div>
        <Button asChild size="sm" style={{ backgroundColor: "#6633cc" }} className="text-white">
          <Link href="/realtor/flyers/new">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Flyer
          </Link>
        </Button>
      </div>

      {lo && (
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Your Loan Officer</p>
            <p className="font-semibold text-slate-900">{lo.firstName} {lo.lastName} · {lo.title}</p>
            <p className="text-sm text-slate-500 mt-0.5">
              {[lo.email, lo.officePhone || lo.cellPhone].filter(Boolean).join(" · ")}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Flyers</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{totalFlyers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Saved Flyers</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{savedFlyers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900">Recent Flyers</CardTitle>
            <Link href="/realtor/flyers" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentFlyers.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-4">No flyers yet</p>
              <Button asChild size="sm" style={{ backgroundColor: "#6633cc" }} className="text-white">
                <Link href="/realtor/flyers/new">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create your first flyer
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Template</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFlyers.map((flyer) => (
                    <tr key={flyer.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900 max-w-[180px] truncate">
                        {flyer.title || (flyer.propertyData as any)?.address || "Untitled Flyer"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell">
                        {templateLabels[flyer.templateId] || flyer.templateId}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant="secondary"
                          className={flyer.status === "SAVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}
                        >
                          {flyer.status === "SAVED" ? "Saved" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs hidden lg:table-cell tabular-nums">
                        {new Date(flyer.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Link href={`/realtor/flyers/${flyer.id}/edit`}>
                              <Pencil className="w-3.5 h-3.5 text-slate-500" />
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Preview">
                            <Link href={`/realtor/flyers/${flyer.id}/preview`}>
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

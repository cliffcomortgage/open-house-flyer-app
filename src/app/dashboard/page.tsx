import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, TrendingUp, Plus, Eye, Pencil } from "lucide-react";
import { DeleteFlyerButton } from "./DeleteFlyerButton";
import { FlyerActionButtons } from "./FlyerActionButtons";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const lo = await prisma.loanOfficer.findUnique({
    where: { userId },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!lo) {
    if ((session.user as any).role === "ADMIN") redirect("/admin");
    redirect("/login");
  }

  const [totalFlyers, savedFlyers, totalRealtors, recentFlyers] =
    await Promise.all([
      prisma.flyer.count({ where: { loanOfficerId: lo.id } }),
      prisma.flyer.count({ where: { loanOfficerId: lo.id, status: "SAVED" } }),
      prisma.realtor.count({ where: { loanOfficerId: lo.id } }),
      prisma.flyer.findMany({
        where: { loanOfficerId: lo.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { realtor: { select: { firstName: true, lastName: true } } },
      }),
    ]);

  const templateLabels: Record<string, string> = {
    "modern-minimal": "Modern Minimal",
    "gallery-grid": "Gallery Grid",
    "showcase-one-rate": "Showcase + Rate",
    "market-leader": "Market Leader",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {lo.firstName}!
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Here&apos;s what&apos;s happening with your flyers today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/realtors/new">
              <Users className="w-4 h-4 mr-1.5" />
              Add Realtor
            </Link>
          </Button>
          <Button asChild size="sm" style={{ backgroundColor: "#6633cc" }} className="text-white">
            <Link href="/dashboard/flyers/new">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Flyer
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Total Flyers
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                  {totalFlyers}
                </p>
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
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Saved Flyers
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                  {savedFlyers}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Realtors
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                  {totalRealtors}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Flyers */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900">
              Recent Flyers
            </CardTitle>
            <Link
              href="/dashboard/flyers"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
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
                <Link href="/dashboard/flyers/new">
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
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Title
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Realtor
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                      Template
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                      Date
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentFlyers.map((flyer) => (
                    <tr
                      key={flyer.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900 max-w-[180px] truncate">
                        {flyer.title ||
                          (flyer.propertyData as any)?.address ||
                          "Untitled Flyer"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {flyer.realtor
                          ? `${flyer.realtor.firstName} ${flyer.realtor.lastName}`
                          : <span className="text-slate-400 italic text-xs">None</span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell">
                        {templateLabels[flyer.templateId] || flyer.templateId}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant="secondary"
                          className={
                            flyer.status === "SAVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }
                        >
                          {flyer.status === "SAVED" ? "Saved" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs hidden lg:table-cell tabular-nums">
                        {new Date(flyer.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Link href={`/dashboard/flyers/${flyer.id}/edit`}>
                              <Pencil className="w-3.5 h-3.5 text-slate-500" />
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Preview">
                            <Link href={`/dashboard/flyers/${flyer.id}/preview`}>
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            </Link>
                          </Button>
                          <FlyerActionButtons
                            flyerId={flyer.id}
                            flyerTitle={flyer.title}
                            shareToken={flyer.shareToken}
                          />
                          <DeleteFlyerButton flyerId={flyer.id} />
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild style={{ backgroundColor: "#6633cc" }} className="text-white">
            <Link href="/dashboard/flyers/new">
              <Plus className="w-4 h-4 mr-2" />
              Create New Flyer
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/realtors/new">
              <Users className="w-4 h-4 mr-2" />
              Add Realtor
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

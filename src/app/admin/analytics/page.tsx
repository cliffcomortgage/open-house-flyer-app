import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Users,
  UserCheck,
  FileText,
  Contact,
  LogIn,
  Clock,
  ShieldCheck,
  LayoutTemplate,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminAnalytics } from "@/lib/analytics";
import { WeeklyLoginChart } from "@/components/admin/weekly-login-chart";

const TEMPLATE_LABELS: Record<string, string> = {
  "modern-minimal": "Modern Minimal",
  "gallery-grid": "Gallery Grid",
  "showcase-one-rate": "Showcase One Rate",
  "market-leader": "Market Leader",
};

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as { role?: string }).role !== "ADMIN") redirect("/dashboard");

  const { summary, loginTrend, loanOfficers } = await getAdminAnalytics();

  const realtorAdoptionPct =
    summary.totalRealtors > 0
      ? Math.round((summary.realtorsWithPasswordSet / summary.totalRealtors) * 100)
      : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Usage and engagement across your loan officers and realtors.
        </p>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total LOs" value={summary.totalLoanOfficers} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard
          label="Active last 30 days"
          value={summary.activeLast30Days}
          icon={UserCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard label="Total flyers" value={summary.totalFlyers} icon={FileText} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatCard label="Total realtors" value={summary.totalRealtors} icon={Contact} iconBg="bg-sky-50" iconColor="text-sky-600" />
      </div>

      {/* Login volume by period */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <LogIn className="w-4 h-4 text-slate-400" />
            Login volume
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">All time</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{summary.totalLogins}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">This week</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{summary.loginsThisWeek}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">This month</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{summary.loginsThisMonth}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">This quarter</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{summary.loginsThisQuarter}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">This year</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{summary.loginsThisYear}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">Logins per week, last 12 weeks</p>
          <WeeklyLoginChart data={loginTrend} />
        </CardContent>
      </Card>

      {/* Flyer & realtor breakdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Flyers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Drafts</span>
              <span className="font-semibold tabular-nums">{summary.flyersByStatus.DRAFT}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Saved</span>
              <span className="font-semibold tabular-nums">{summary.flyersByStatus.SAVED}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500">Pending compliance</span>
              <span className="font-semibold tabular-nums">{summary.flyersByApproval.PENDING}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Approved</span>
              <span className="font-semibold tabular-nums">{summary.flyersByApproval.APPROVED}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Changes requested</span>
              <span className="font-semibold tabular-nums">{summary.flyersByApproval.REJECTED}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-slate-400" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2 text-sm">
            {Object.entries(summary.flyersByTemplate).length === 0 && (
              <p className="text-slate-400 text-sm">No flyers yet</p>
            )}
            {Object.entries(summary.flyersByTemplate)
              .sort((a, b) => b[1] - a[1])
              .map(([templateId, count]) => (
                <div key={templateId} className="flex justify-between">
                  <span className="text-slate-500">{TEMPLATE_LABELS[templateId] || templateId}</span>
                  <span className="font-semibold tabular-nums">{count}</span>
                </div>
              ))}
            {summary.avgComplianceTurnaroundHours !== null && (
              <div className="flex justify-between pt-2 mt-2 border-t border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Avg. review time
                </span>
                <span className="font-semibold tabular-nums">
                  {summary.avgComplianceTurnaroundHours < 24
                    ? `${Math.round(summary.avgComplianceTurnaroundHours)}h`
                    : `${(summary.avgComplianceTurnaroundHours / 24).toFixed(1)}d`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Realtor adoption
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Realtors added</span>
              <span className="font-semibold tabular-nums">{summary.totalRealtors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invited to self-serve</span>
              <span className="font-semibold tabular-nums">{summary.realtorsWithAccount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Set up their own login</span>
              <span className="font-semibold tabular-nums">{summary.realtorsWithPasswordSet}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500">Adoption rate</span>
              <span className="font-semibold tabular-nums">{realtorAdoptionPct}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-LO table */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-700">Loan officer activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium text-right">Flyers</th>
                  <th className="px-3 py-3 font-medium text-right">Realtors</th>
                  <th className="px-3 py-3 font-medium text-right">Logins (total)</th>
                  <th className="px-3 py-3 font-medium text-right">7d</th>
                  <th className="px-3 py-3 font-medium text-right">30d</th>
                  <th className="px-3 py-3 font-medium text-right">90d</th>
                  <th className="px-3 py-3 font-medium text-right">365d</th>
                  <th className="px-5 py-3 font-medium">Last login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loanOfficers.map((lo) => (
                  <tr key={lo.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{lo.name}</div>
                      <div className="text-xs text-slate-500">{lo.email}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          lo.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {lo.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{lo.flyersCreated}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{lo.realtorsAdded}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold">{lo.totalLogins}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500">{lo.loginsThisWeek}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500">{lo.loginsThisMonth}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500">{lo.loginsThisQuarter}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500">{lo.loginsThisYear}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(lo.lastLogin)}</td>
                  </tr>
                ))}
                {loanOfficers.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-5 py-8 text-center text-slate-400">
                      No loan officers yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

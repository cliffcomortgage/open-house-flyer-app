import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, UserCog, Settings, ChevronRight, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/dashboard");

  const pendingReviewCount = await prisma.flyer.count({ where: { approvalStatus: "PENDING" } });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin top bar */}
      <div
        className="h-12 flex items-center px-6 gap-3 border-b border-slate-200"
        style={{ backgroundColor: "#0d0d0d" }}
      >
        <div className="flex items-center gap-2 text-white/80">
          <Shield className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tracking-wider uppercase text-white/60">
            Admin Panel
          </span>
        </div>
        <ChevronRight className="w-3 h-3 text-white/30" />
        <nav className="flex items-center gap-1">
          <Link
            href="/admin"
            className="text-xs text-white/70 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/admin/loan-officers"
            className="flex items-center gap-1 text-xs text-white/70 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            <UserCog className="w-3 h-3" />
            Loan Officers
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center gap-1 text-xs text-white/70 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            <Settings className="w-3 h-3" />
            Company Settings
          </Link>
          <Link
            href="/admin/compliance"
            className="flex items-center gap-1 text-xs text-white/70 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            <ClipboardList className="w-3 h-3" />
            Compliance
            {pendingReviewCount > 0 && (
              <span className="ml-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingReviewCount}
              </span>
            )}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            ← Back to dashboard
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <main>{children}</main>
    </div>
  );
}

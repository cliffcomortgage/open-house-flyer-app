"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  User,
  LogOut,
  Menu,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNav: NavItem[] = [
  { href: "/realtor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/realtor/flyers", label: "My Listings", icon: FileText },
  { href: "/realtor/profile", label: "My Profile", icon: User },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive =
    item.href === "/realtor" ? pathname === "/realtor" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        isActive
          ? "bg-violet-50 text-violet-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-violet-600" : "text-slate-400")} />
      {item.label}
      {isActive && <ChevronRight className="w-3 h-3 ml-auto text-violet-400" />}
    </Link>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { data: session } = useSession();
  const email = session?.user?.email || "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100">
        <Image
          src="/logo-black.png"
          alt="Cliffco Mortgage Bank"
          width={160}
          height={48}
          className="object-contain"
          priority
        />
      </div>

      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs font-semibold text-white" style={{ backgroundColor: "#6633cc" }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">{email}</p>
            <p className="text-xs text-slate-400">Realtor</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} onClick={onNavClick} />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function RealtorLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-slate-200 shrink-0">
        <SidebarContent />
      </aside>

      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-black.png"
              alt="Cliffco Mortgage Bank"
              width={130}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent onNavClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

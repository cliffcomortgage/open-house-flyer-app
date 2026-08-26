import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const isAuthPage = nextUrl.pathname.startsWith("/login");
  const isAdminPage = nextUrl.pathname.startsWith("/admin");
  const isSharePage = nextUrl.pathname.startsWith("/share") || nextUrl.pathname.startsWith("/api/share");
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  const isSetPasswordPage = nextUrl.pathname.startsWith("/set-password");
  const isUploadsPath = nextUrl.pathname.startsWith("/uploads");
  const isHealthCheck = nextUrl.pathname === "/api/health";

  if (isApiAuth || isSharePage || isSetPasswordPage || isUploadsPath || isHealthCheck) return NextResponse.next();

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAdminPage && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (nextUrl.pathname === "/dashboard" && isAdmin) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { IMPERSONATION_COOKIE } from "@/lib/session-lo";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const role = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN";
  const isRealtor = role === "REALTOR";
  const isImpersonating = isAdmin && !!req.cookies.get(IMPERSONATION_COOKIE)?.value;

  const isAuthPage = nextUrl.pathname.startsWith("/login");
  const isAdminPage = nextUrl.pathname.startsWith("/admin");
  const isDashboardPage = nextUrl.pathname.startsWith("/dashboard");
  const isRealtorPage = nextUrl.pathname.startsWith("/realtor");
  const isSharePage = nextUrl.pathname.startsWith("/share") || nextUrl.pathname.startsWith("/api/share");
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  const isSetPasswordPage = nextUrl.pathname.startsWith("/set-password");
  const isUploadsPath = nextUrl.pathname.startsWith("/uploads");
  const isHealthCheck = nextUrl.pathname === "/api/health";

  if (isApiAuth || isSharePage || isSetPasswordPage || isUploadsPath || isHealthCheck) return NextResponse.next();

  const homeForSession = () =>
    isAdmin && !isImpersonating ? "/admin" : isRealtor ? "/realtor" : "/dashboard";

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(homeForSession(), nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAdminPage && !isAdmin) {
    return NextResponse.redirect(new URL(homeForSession(), nextUrl));
  }

  if (isRealtorPage && !isRealtor) {
    return NextResponse.redirect(new URL(homeForSession(), nextUrl));
  }

  if (isDashboardPage && isRealtor) {
    return NextResponse.redirect(new URL("/realtor", nextUrl));
  }

  if (nextUrl.pathname === "/dashboard" && isAdmin && !isImpersonating) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};

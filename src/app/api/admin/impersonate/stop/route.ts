import { NextResponse } from "next/server";
import { IMPERSONATION_COOKIE } from "@/lib/session-lo";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(IMPERSONATION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

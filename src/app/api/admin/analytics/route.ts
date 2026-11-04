import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminAnalytics } from "@/lib/analytics";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const analytics = await getAdminAnalytics();
  return NextResponse.json(analytics);
}

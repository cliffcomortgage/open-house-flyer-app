import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const IMPERSONATION_COOKIE = "impersonating_lo_id";

/**
 * Resolves which LoanOfficer id a request should act as: the signed-in LO
 * themselves, or — for an admin currently impersonating — the LO they're
 * viewing the dashboard as. Returns null if neither applies.
 */
export async function getSessionLoanOfficerId(session: any): Promise<string | null> {
  if (!session?.user) return null;
  const role = session.user.role;

  if (role === "ADMIN") {
    const cookieStore = await cookies();
    return cookieStore.get(IMPERSONATION_COOKIE)?.value || null;
  }

  const userId = session.user.id as string;
  const lo = await prisma.loanOfficer.findUnique({ where: { userId }, select: { id: true } });
  return lo?.id || null;
}

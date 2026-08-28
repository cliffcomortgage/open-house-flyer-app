import { prisma } from "@/lib/db";

/**
 * Resolves the Realtor record a REALTOR-role session acts as. Returns null
 * for any other role or if no session.
 */
export async function getSessionRealtorId(session: any): Promise<string | null> {
  if (!session?.user || session.user.role !== "REALTOR") return null;
  const userId = session.user.id as string;
  const realtor = await prisma.realtor.findUnique({ where: { userId }, select: { id: true } });
  return realtor?.id || null;
}

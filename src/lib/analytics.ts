import { prisma } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOWS = {
  week: 7 * DAY_MS,
  month: 30 * DAY_MS,
  quarter: 90 * DAY_MS,
  year: 365 * DAY_MS,
} as const;

export async function getAdminAnalytics() {
  const now = new Date();
  const twelveWeeksAgo = new Date(now.getTime() - 12 * WINDOWS.week);

  const [
    loanOfficers,
    realtors,
    flyers,
    totalLoginEvents,
    loginsThisWeek,
    loginsThisMonth,
    loginsThisQuarter,
    loginsThisYear,
    loginEventsForTrend,
    loanOfficerLoginCounts,
  ] = await Promise.all([
    prisma.loanOfficer.findMany({
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        user: { select: { isActive: true, createdAt: true } },
        _count: { select: { flyers: true, realtors: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.realtor.findMany({
      select: { id: true, userId: true, loanOfficerId: true, createdAt: true, user: { select: { password: true } } },
    }),
    prisma.flyer.findMany({
      select: {
        id: true,
        status: true,
        templateId: true,
        approvalStatus: true,
        submittedForReviewAt: true,
        reviewedAt: true,
        createdAt: true,
      },
    }),
    prisma.loginEvent.count(),
    prisma.loginEvent.count({ where: { createdAt: { gte: new Date(now.getTime() - WINDOWS.week) } } }),
    prisma.loginEvent.count({ where: { createdAt: { gte: new Date(now.getTime() - WINDOWS.month) } } }),
    prisma.loginEvent.count({ where: { createdAt: { gte: new Date(now.getTime() - WINDOWS.quarter) } } }),
    prisma.loginEvent.count({ where: { createdAt: { gte: new Date(now.getTime() - WINDOWS.year) } } }),
    prisma.loginEvent.findMany({
      where: { createdAt: { gte: twelveWeeksAgo } },
      select: { createdAt: true },
    }),
    prisma.loginEvent.groupBy({ by: ["userId"], _count: { _all: true }, _max: { createdAt: true } }),
  ]);

  // Per-LO rolling-window login counts (one query per window, grouped by user)
  const loUserIds = loanOfficers.map((lo) => lo.userId);
  const windowCounts: Record<keyof typeof WINDOWS, Map<string, number>> = {
    week: new Map(),
    month: new Map(),
    quarter: new Map(),
    year: new Map(),
  };
  await Promise.all(
    (Object.keys(WINDOWS) as (keyof typeof WINDOWS)[]).map(async (key) => {
      const rows = await prisma.loginEvent.groupBy({
        by: ["userId"],
        where: { userId: { in: loUserIds }, createdAt: { gte: new Date(now.getTime() - WINDOWS[key]) } },
        _count: { _all: true },
      });
      for (const row of rows) windowCounts[key].set(row.userId, row._count._all);
    })
  );

  const loginsByUser = new Map(loanOfficerLoginCounts.map((r) => [r.userId, r]));

  const loanOfficerRows = loanOfficers.map((lo) => {
    const loginRow = loginsByUser.get(lo.userId);
    return {
      id: lo.id,
      name: `${lo.firstName} ${lo.lastName}`,
      email: lo.email,
      isActive: lo.user?.isActive ?? true,
      joinedAt: (lo.user?.createdAt ?? lo.createdAt).toISOString(),
      flyersCreated: lo._count.flyers,
      realtorsAdded: lo._count.realtors,
      totalLogins: loginRow?._count._all ?? 0,
      lastLogin: loginRow?._max.createdAt?.toISOString() ?? null,
      loginsThisWeek: windowCounts.week.get(lo.userId) ?? 0,
      loginsThisMonth: windowCounts.month.get(lo.userId) ?? 0,
      loginsThisQuarter: windowCounts.quarter.get(lo.userId) ?? 0,
      loginsThisYear: windowCounts.year.get(lo.userId) ?? 0,
    };
  });

  // Weekly login trend for the last 12 weeks (bucket by week-start)
  const trendBuckets = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const bucketStart = new Date(now.getTime() - i * WINDOWS.week);
    const key = bucketStart.toISOString().slice(0, 10);
    trendBuckets.set(key, 0);
  }
  const bucketKeys = Array.from(trendBuckets.keys());
  for (const event of loginEventsForTrend) {
    const age = now.getTime() - event.createdAt.getTime();
    const bucketIdx = 11 - Math.min(11, Math.floor(age / WINDOWS.week));
    const key = bucketKeys[bucketIdx];
    if (key) trendBuckets.set(key, (trendBuckets.get(key) || 0) + 1);
  }
  const loginTrend = bucketKeys.map((week) => ({ week, count: trendBuckets.get(week) || 0 }));

  // Flyer stats
  const flyersByStatus = { DRAFT: 0, SAVED: 0 };
  const flyersByTemplate: Record<string, number> = {};
  const flyersByApproval = { NOT_SUBMITTED: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
  const turnaroundMsList: number[] = [];
  for (const f of flyers) {
    flyersByStatus[f.status as keyof typeof flyersByStatus]++;
    flyersByTemplate[f.templateId] = (flyersByTemplate[f.templateId] || 0) + 1;
    flyersByApproval[f.approvalStatus as keyof typeof flyersByApproval]++;
    if (f.submittedForReviewAt && f.reviewedAt) {
      turnaroundMsList.push(f.reviewedAt.getTime() - f.submittedForReviewAt.getTime());
    }
  }
  const avgComplianceTurnaroundHours =
    turnaroundMsList.length > 0
      ? turnaroundMsList.reduce((a, b) => a + b, 0) / turnaroundMsList.length / (60 * 60 * 1000)
      : null;

  const mostPopularTemplate =
    Object.entries(flyersByTemplate).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Realtor self-service adoption
  const realtorsWithAccount = realtors.filter((r) => r.userId).length;
  const realtorsWithPasswordSet = realtors.filter((r) => r.user?.password).length;

  return {
    summary: {
      totalLoanOfficers: loanOfficers.length,
      activeLoanOfficers: loanOfficers.filter((lo) => lo.user?.isActive).length,
      activeLast30Days: loanOfficerRows.filter((r) => r.loginsThisMonth > 0).length,
      totalRealtors: realtors.length,
      realtorsWithAccount,
      realtorsWithPasswordSet,
      totalFlyers: flyers.length,
      flyersByStatus,
      flyersByTemplate,
      flyersByApproval,
      mostPopularTemplate,
      avgComplianceTurnaroundHours,
      totalLogins: totalLoginEvents,
      loginsThisWeek,
      loginsThisMonth,
      loginsThisQuarter,
      loginsThisYear,
    },
    loginTrend,
    loanOfficers: loanOfficerRows,
  };
}

export type AdminAnalytics = Awaited<ReturnType<typeof getAdminAnalytics>>;

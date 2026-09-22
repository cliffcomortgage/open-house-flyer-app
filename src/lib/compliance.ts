import { prisma } from "@/lib/db";
import { sendComplianceReviewRequestEmail } from "@/lib/email";

/**
 * Auto-submits a saved flyer for compliance review whenever it carries loan
 * scenarios and isn't already pending/approved — replaces the old manual
 * "Submit for Approval" step so LOs never have to remember to click it.
 */
export async function autoSubmitForComplianceReview(flyerId: string, baseUrl: string) {
  const flyer = await prisma.flyer.findUnique({
    where: { id: flyerId },
    include: {
      loanOfficer: { include: { user: { select: { email: true, isActive: true } } } },
      realtor: true,
    },
  });
  if (!flyer) return null;

  const scenarios = (flyer.loanScenarios as unknown[]) || [];
  const needsReview =
    scenarios.length > 0 &&
    flyer.status === "SAVED" &&
    (flyer.approvalStatus === "NOT_SUBMITTED" || flyer.approvalStatus === "REJECTED");

  if (!needsReview) return { flyer, justSubmitted: false };

  const updated = await prisma.flyer.update({
    where: { id: flyerId },
    data: {
      approvalStatus: "PENDING",
      submittedForReviewAt: new Date(),
      reviewedAt: null,
      reviewNotes: null,
    },
    include: {
      loanOfficer: { include: { user: { select: { email: true, isActive: true } } } },
      realtor: true,
    },
  });

  const pd = (flyer.propertyData as { address?: string; city?: string } | null) || {};
  const address = pd.address
    ? `${pd.address}${pd.city ? `, ${pd.city}` : ""}`
    : flyer.title || "Untitled property";

  try {
    await sendComplianceReviewRequestEmail({
      flyerId,
      address,
      loName: `${flyer.loanOfficer.firstName} ${flyer.loanOfficer.lastName}`,
      baseUrl,
    });
  } catch (err) {
    console.error("Failed to send compliance review notification email:", err);
  }

  return { flyer: updated, justSubmitted: true };
}

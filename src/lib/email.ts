const apiKey = process.env.SMTP2GO_API_KEY;

const DEFAULT_RECIPIENTS = ["scollinge@cliffcomortgage.com", "compliance@cliffcomortgage.com"];

function getComplianceRecipients(): string[] {
  const configured = process.env.COMPLIANCE_NOTIFICATION_EMAILS;
  return configured
    ? configured.split(",").map((e) => e.trim()).filter(Boolean)
    : DEFAULT_RECIPIENTS;
}

async function sendEmail(params: {
  to: string[];
  subject: string;
  textBody: string;
  htmlBody: string;
}): Promise<void> {
  if (!apiKey) {
    console.warn(`SMTP2GO_API_KEY not set — skipping email "${params.subject}"`);
    return;
  }

  const res = await fetch("https://api.smtp2go.com/v3/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      to: params.to,
      sender: process.env.SMTP2GO_FROM_EMAIL || "noreply@cliffcomortgage.com",
      subject: params.subject,
      text_body: params.textBody,
      html_body: params.htmlBody,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SMTP2GO send failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (data?.data?.failed) {
    throw new Error(`SMTP2GO reported failed recipients: ${JSON.stringify(data.data.failures || data.data.failed)}`);
  }
}

export async function sendComplianceReviewRequestEmail(params: {
  flyerId: string;
  address: string;
  loName: string;
  baseUrl: string;
}): Promise<void> {
  const reviewUrl = `${params.baseUrl}/admin/compliance/review/${params.flyerId}`;

  await sendEmail({
    to: getComplianceRecipients(),
    subject: `Flyer pending compliance review — ${params.address}`,
    textBody: `${params.loName} submitted a flyer with loan scenarios for compliance review.\n\nProperty: ${params.address}\n\nReview it here: ${reviewUrl}`,
    htmlBody: `<p><strong>${params.loName}</strong> submitted a flyer with loan scenarios for compliance review.</p><p><strong>Property:</strong> ${params.address}</p><p><a href="${reviewUrl}">Review this flyer</a></p>`,
  });
}

export async function sendLoanOfficerWelcomeEmail(params: {
  toEmail: string;
  loName: string;
  setPasswordToken: string;
  baseUrl: string;
}): Promise<void> {
  const setPasswordUrl = `${params.baseUrl}/set-password?token=${params.setPasswordToken}`;

  await sendEmail({
    to: [params.toEmail],
    subject: "Welcome to the Cliffco Open House Flyer App",
    textBody: `Hi ${params.loName},\n\nAn account has been created for you on the Cliffco Open House Flyer App. Set your password to get started:\n\n${setPasswordUrl}\n\nThis link expires in 7 days.`,
    htmlBody: `<p>Hi ${params.loName},</p><p>An account has been created for you on the Cliffco Open House Flyer App. Set your password to get started:</p><p><a href="${setPasswordUrl}">${setPasswordUrl}</a></p><p>This link expires in 7 days.</p>`,
  });
}

export async function sendRealtorInviteEmail(params: {
  toEmail: string;
  realtorName: string;
  loName: string;
  setPasswordToken: string;
  baseUrl: string;
}): Promise<void> {
  const setPasswordUrl = `${params.baseUrl}/set-password?token=${params.setPasswordToken}`;

  await sendEmail({
    to: [params.toEmail],
    subject: `${params.loName} invited you to create listing flyers`,
    textBody: `Hi ${params.realtorName},\n\n${params.loName} has invited you to create your own open house listing flyers, co-branded with their info, on the Cliffco Open House Flyer App. Set your password to get started:\n\n${setPasswordUrl}\n\nThis link expires in 7 days.`,
    htmlBody: `<p>Hi ${params.realtorName},</p><p><strong>${params.loName}</strong> has invited you to create your own open house listing flyers, co-branded with their info, on the Cliffco Open House Flyer App. Set your password to get started:</p><p><a href="${setPasswordUrl}">${setPasswordUrl}</a></p><p>This link expires in 7 days.</p>`,
  });
}

const RESEND_ENDPOINT = "https://api.resend.com/emails"

const DEFAULT_FROM = "Archtipsbox <onboarding@resend.dev>"

const ACCENT = "#9ACD32"

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("RESEND_API_KEY not configured - skipping email:", opts.subject)
    return false
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html
      })
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      console.error("Resend delivery failed:", response.status, body.slice(0, 300))
      return false
    }
    return true
  } catch (err) {
    console.error("Email send error:", err)
    return false
  }
}

export function emailLayout(title: string, bodyHtml: string, buttonHtml?: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#111113;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
        <tr><td style="height:6px;background:${ACCENT};"></td></tr>
        <tr><td style="padding:36px 36px 8px 36px;">
          <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:2px;color:${ACCENT};">ARCHTIPSBOX</p>
          <h1 style="margin:14px 0 0 0;font-size:22px;color:#fafafa;">${title}</h1>
        </td></tr>
        <tr><td style="padding:18px 36px 8px 36px;font-size:14px;line-height:1.7;color:#a1a1aa;">
          ${bodyHtml}
        </td></tr>
        ${buttonHtml ? `<tr><td style="padding:20px 36px 30px 36px;">${buttonHtml}</td></tr>` : '<tr><td style="height:28px;"></td></tr>'}
        <tr><td style="padding:18px 36px;border-top:1px solid #27272a;">
          <p style="margin:0;font-size:11px;color:#52525b;line-height:1.6;">
            You received this email because of activity on your Archtipsbox account.<br/>
            Questions? Contact archtipsbox@gmail.com
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function button(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:${ACCENT};color:#000000;font-weight:700;font-size:14px;text-decoration:none;padding:13px 30px;border-radius:10px;">${label}</a>`
}

export function paymentReceiptEmail(opts: {
  itemName: string
  amount: number
  billNumber: string
  ctaUrl: string
  ctaLabel: string
}): string {
  return emailLayout(
    "Payment confirmed",
    `<p>Hi there,</p>
     <p>Your payment was successful and your access has been activated.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:10px;margin:14px 0;">
       <tr><td style="padding:14px 18px;font-size:13px;color:#d4d4d8;">
         <strong style="color:#fafafa;">${opts.itemName}</strong><br/>
         Amount: <strong style="color:${ACCENT};">$${opts.amount.toFixed(2)}</strong> USD<br/>
         Reference: ${opts.billNumber}<br/>
         Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
       </td></tr>
     </table>`
  , button(opts.ctaUrl, opts.ctaLabel))
}

export function certificateIssuedEmail(opts: {
  courseTitle: string
  certificateUrl: string
}): string {
  return emailLayout(
    "Certificate unlocked!",
    `<p>Congratulations!</p>
     <p>You completed <strong style="color:#fafafa;">${opts.courseTitle}</strong> with 100% lesson progress.
     Your official Archtipsbox certificate is ready - it carries a unique serial number anyone can use to verify your achievement.</p>`
  , button(opts.certificateUrl, "View my certificate"))
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export async function sendTelegramInvoiceNotification(details: {
  itemName: string
  amount: number
  billNumber: string
  paymentMethod: string
  completedAt: string
  userEmail: string
  userId: string
  transactionId: string
  promoCode: string | null
  customerName?: string
}) {
  const token = process.env.TELEGRAM_TOKEN
  const chatId = process.env.CHAT_ID

  if (!token || !chatId) {
    console.warn("Telegram bot token or Chat ID not configured in environment variables. Telegram notification skipped.")
    return
  }

  // Format completedAt date nicely if valid
  let formattedDate = details.completedAt
  try {
    const dateObj = new Date(details.completedAt)
    if (!isNaN(dateObj.getTime())) {
      formattedDate = dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    }
  } catch (_e) {
    // Fallback to raw completedAt value
  }

  const cleanBill = escapeHtml(details.billNumber)
  const cleanMethod = escapeHtml(details.paymentMethod)
  const cleanCustomer = escapeHtml(details.customerName || "Student")
  const cleanEmail = escapeHtml(details.userEmail || "N/A")
  const cleanItem = escapeHtml(details.itemName)
  const cleanPromo = details.promoCode ? escapeHtml(details.promoCode) : null

  const invoiceText = `
<b>🧾 INVOICE #${cleanBill}</b>
-----------------------------------
<b>Status:</b> ✅ Paid
<b>Date:</b> ${formattedDate}
<b>Payment Method:</b> ${cleanMethod}

<b>Billed To:</b>
${cleanCustomer}
${cleanEmail}

<b>Items:</b>
• 1x ${cleanItem} — $${Number(details.amount).toFixed(2)} USD
${cleanPromo ? `• Promo Code: <code>${cleanPromo}</code>` : ""}
-----------------------------------
<b>Total Paid: $${Number(details.amount).toFixed(2)} USD</b>
`.trim()

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: invoiceText,
        parse_mode: "HTML"
      })
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error(`Failed to send Telegram message: ${response.status} - ${errorText}`)
    } else {
      console.log(`Telegram invoice notification sent for bill ${details.billNumber}`)
    }
  } catch (error) {
    console.error("Error sending Telegram notification:", error)
  }
}

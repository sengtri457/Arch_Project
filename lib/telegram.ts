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
  } catch (e) {
    // Fallback to raw completedAt value
  }

  const invoiceText = `
<b>🧾 INVOICE #${details.billNumber}</b>
-----------------------------------
<b>Status:</b> ✅ Paid
<b>Date:</b> ${formattedDate}
<b>Payment Method:</b> ${details.paymentMethod}

<b>Billed To:</b>
${details.customerName || "Student"}
${details.userEmail || "N/A"}

<b>Items:</b>
• 1x ${details.itemName} — $${Number(details.amount).toFixed(2)} USD
${details.promoCode ? `• Promo Code: <code>${details.promoCode}</code>` : ""}
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

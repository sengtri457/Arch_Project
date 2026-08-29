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
      formattedDate = dateObj.toLocaleString("en-US", {
        timeZone: "UTC",
        dateStyle: "medium",
        timeStyle: "medium"
      }) + " UTC"
    }
  } catch (e) {
    // Fallback to raw completedAt value
  }

  const invoiceText = `
<b>🧾 NEW PAYMENT INVOICE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Item:</b> ${details.itemName}
<b>Bill Number:</b> <code>${details.billNumber}</code>
<b>Amount:</b> $${Number(details.amount).toFixed(2)} USD
<b>Promo Code:</b> ${details.promoCode ? `<code>${details.promoCode}</code>` : "None"}
<b>Payment Method:</b> ${details.paymentMethod}
<b>Completed At:</b> ${formattedDate}
━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Customer Information:</b>
<b>Email:</b> ${details.userEmail || "N/A"}
<b>User ID:</b> <code>${details.userId}</code>
<b>Transaction ID:</b> <code>${details.transactionId}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Status:</b> ✅ SUCCESSFUL / PAID
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

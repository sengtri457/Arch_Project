import { describe, it, expect } from "vitest"
import { getPayPalBaseUrl, getPayPalEnvironment } from "@/lib/paypal"

function generateOrderReference(slug?: string, userId?: string): string {
  const prefix = slug ? slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) : "PRO"
  const userSuffix = userId ? userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) : "GUEST"
  return `ATB-${prefix}-${userSuffix}`
}

function buildPayPalMeUrl(handle: string, amount: number): string {
  const safeHandle = encodeURIComponent(handle.trim())
  const safeAmount = Math.max(0, amount).toFixed(2)
  return `https://paypal.me/${safeHandle}/${safeAmount}USD`
}

function buildPayPalOrderPayload(params: {
  amount: number
  currency?: string
  billNumber: string
  description: string
}) {
  const currency = params.currency || "USD"
  const formattedAmount = Math.max(0, params.amount).toFixed(2)

  return {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: params.billNumber,
        custom_id: params.billNumber,
        invoice_id: params.billNumber,
        description: (params.description || "Archtipsbox Purchase").slice(0, 127),
        amount: {
          currency_code: currency,
          value: formattedAmount
        }
      }
    ]
  }
}

function isCaptureAmountValid(captured: string | number, expected: string | number): boolean {
  const c = parseFloat(String(captured))
  const e = parseFloat(String(expected))
  return !isNaN(c) && !isNaN(e) && Math.abs(c - e) <= 0.05
}

function validateManualEnrollmentPayload(payload: {
  email?: string
  course_id?: string
  payment_method?: string
  transaction_reference?: string
}) {
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return { valid: false, error: "Valid email is required" }
  }
  if (!payload.course_id || !/^[0-9a-f-]{36}$/i.test(payload.course_id)) {
    return { valid: false, error: "Valid course_id UUID is required" }
  }
  if (!["khqr", "telegram", "paypal"].includes(payload.payment_method || "")) {
    return { valid: false, error: "Unsupported payment method" }
  }
  if (!payload.transaction_reference || payload.transaction_reference.trim().length < 3) {
    return { valid: false, error: "Transaction reference is required" }
  }
  return { valid: true }
}

describe("PayPal Dynamic QR & Orders v2 Helper", () => {
  it("determines environment URLs accurately", () => {
    const originalEnv = process.env.PAYPAL_ENVIRONMENT
    process.env.PAYPAL_ENVIRONMENT = "sandbox"
    expect(getPayPalEnvironment()).toBe("sandbox")
    expect(getPayPalBaseUrl()).toBe("https://api-m.sandbox.paypal.com")

    process.env.PAYPAL_ENVIRONMENT = "live"
    expect(getPayPalEnvironment()).toBe("live")
    expect(getPayPalBaseUrl()).toBe("https://api-m.paypal.com")
    process.env.PAYPAL_ENVIRONMENT = originalEnv
  })

  it("builds compliant Orders v2 payload", () => {
    const payload = buildPayPalOrderPayload({
      amount: 49.994,
      currency: "USD",
      billNumber: "BILL-PP-123456",
      description: "D5 Render Mastery Course - Masterclass Edition with VIP lab exercises and project files"
    })

    expect(payload.intent).toBe("CAPTURE")
    expect(payload.purchase_units[0].reference_id).toBe("BILL-PP-123456")
    expect(payload.purchase_units[0].amount.value).toBe("49.99")
    expect(payload.purchase_units[0].amount.currency_code).toBe("USD")
    expect(payload.purchase_units[0].description.length).toBeLessThanOrEqual(127)
  })

  it("validates captured transaction amounts within tolerance", () => {
    expect(isCaptureAmountValid("49.99", 49.99)).toBe(true)
    expect(isCaptureAmountValid("50.00", 49.99)).toBe(true) // <= 0.05
    expect(isCaptureAmountValid("10.00", 49.99)).toBe(false)
  })
})

describe("PayPal Manual Enrollment Fallback Helper", () => {
  it("formats consistent order reference tags", () => {
    const ref = generateOrderReference("d5-render-mastery", "12345678-abcd-1234-abcd-1234567890ab")
    expect(ref).toBe("ATB-D5RE-123456")
  })

  it("handles empty or missing parameters gracefully", () => {
    const ref = generateOrderReference()
    expect(ref).toBe("ATB-PRO-GUEST")
  })

  it("constructs valid paypal.me deep links with USD currency", () => {
    const url = buildPayPalMeUrl("bunsambath10", 49.99)
    expect(url).toBe("https://paypal.me/bunsambath10/49.99USD")
  })

  it("validates manual enrollment submissions properly", () => {
    const valid = validateManualEnrollmentPayload({
      email: "student@example.com",
      course_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      payment_method: "paypal",
      transaction_reference: "PP-TX-982341",
    })
    expect(valid.valid).toBe(true)

    const invalidEmail = validateManualEnrollmentPayload({
      email: "bad-email",
      course_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      payment_method: "paypal",
      transaction_reference: "PP-TX-982341",
    })
    expect(invalidEmail.valid).toBe(false)

    const invalidMethod = validateManualEnrollmentPayload({
      email: "student@example.com",
      course_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      payment_method: "bitcoin",
      transaction_reference: "PP-TX-982341",
    })
    expect(invalidMethod.valid).toBe(false)
  })
})

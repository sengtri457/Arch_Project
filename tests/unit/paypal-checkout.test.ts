import { describe, it, expect } from "vitest"

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

describe("PayPal Checkout & Manual Enrollment Helper", () => {
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

import { describe, it, expect } from "vitest"
import {
  buildGumroadCheckoutUrl,
  parseGumroadPing,
  DEFAULT_GUMROAD_D5_URL,
} from "@/lib/gumroad"
import { courses } from "@/lib/courses-data"

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
  if (!["khqr", "telegram", "gumroad", "card"].includes(payload.payment_method || "")) {
    return { valid: false, error: "Unsupported payment method" }
  }
  if (!payload.transaction_reference || payload.transaction_reference.trim().length < 3) {
    return { valid: false, error: "Transaction reference is required" }
  }
  return { valid: true }
}

describe("Gumroad International Checkout URL Builder", () => {
  it("defaults to D5 Masterclass wanted URL", () => {
    const url = buildGumroadCheckoutUrl()
    expect(url).toContain("archtipsbox.gumroad.com/l/d5masterclass")
    expect(url).toContain("wanted=true")
  })

  it("appends and normalizes student email address", () => {
    const url = buildGumroadCheckoutUrl(DEFAULT_GUMROAD_D5_URL, {
      email: "  Student.Architect@Example.COM  ",
    })
    const parsed = new URL(url)
    expect(parsed.searchParams.get("email")).toBe("student.architect@example.com")
    expect(parsed.searchParams.get("wanted")).toBe("true")
  })

  it("attaches custom bill number metadata for order tracing", () => {
    const url = buildGumroadCheckoutUrl(DEFAULT_GUMROAD_D5_URL, {
      email: "test@user.com",
      customFields: {
        bill_number: "BILL-2026-9921",
      },
    })
    const parsed = new URL(url)
    expect(parsed.searchParams.get("bill_number")).toBe("BILL-2026-9921")
    expect(parsed.searchParams.get("email")).toBe("test@user.com")
  })

  it("applies discount code query parameter when promo is provided", () => {
    const url = buildGumroadCheckoutUrl(DEFAULT_GUMROAD_D5_URL, {
      email: "test@user.com",
      discountCode: "archvip50",
    })
    const parsed = new URL(url)
    expect(parsed.searchParams.get("code")).toBe("ARCHVIP50")
  })
})

describe("Gumroad Ping & Webhook Payload Parser", () => {
  it("parses valid webhook ping from Gumroad successfully", () => {
    const ping = parseGumroadPing({
      email: "international.student@gmail.com",
      product_name: "D5 Render Mastery Masterclass",
      permalink: "d5masterclass",
      price: 4900,
      currency: "usd",
      sale_id: "sale_abc123xyz",
      order_number: 1049281,
    })

    expect(ping).not.toBeNull()
    expect(ping?.email).toBe("international.student@gmail.com")
    expect(ping?.saleId).toBe("sale_abc123xyz")
    expect(ping?.currency).toBe("USD")
    expect(ping?.price).toBe(4900)
    expect(ping?.orderNumber).toBe("1049281")
  })

  it("rejects malformed payloads with missing or invalid email", () => {
    expect(parseGumroadPing({ price: 4900 })).toBeNull()
    expect(parseGumroadPing({ email: "invalid-email-string" })).toBeNull()
    expect(parseGumroadPing(null as any)).toBeNull()
  })
})

describe("Multi-Course Gumroad Catalog Mapping", () => {
  it("assigns individual Gumroad link to D5 masterclass", () => {
    const d5Course = courses.find((c) => c.id === "d5-masterclass")
    expect(d5Course).toBeDefined()
    expect(d5Course?.gumroad_url).toContain("archtipsbox.gumroad.com/l/d5masterclass")
  })

  it("assigns valid storefront links to all catalog courses", () => {
    for (const c of courses) {
      expect(c.gumroad_url).toBeDefined()
      expect(c.gumroad_url).toContain("archtipsbox.gumroad.com")
    }
  })
})

describe("Enrollment & Payment Method Validation", () => {
  it("accepts 'gumroad' as a registered international payment method", () => {
    const valid = validateManualEnrollmentPayload({
      email: "student@archtipsbox.com",
      course_id: "12345678-1234-1234-1234-123456789abc",
      payment_method: "gumroad",
      transaction_reference: "GUM-SALE-9912",
    })
    expect(valid.valid).toBe(true)
  })

  it("rejects unrecognized or legacy payment methods", () => {
    const invalid = validateManualEnrollmentPayload({
      email: "student@archtipsbox.com",
      course_id: "12345678-1234-1234-1234-123456789abc",
      payment_method: "unsupported_wire",
      transaction_reference: "REF-001",
    })
    expect(invalid.valid).toBe(false)
  })
})

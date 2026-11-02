/**
 * Card Payment & Stripe Checkout Helper
 * Supports direct Credit/Debit Card payments via Stripe Checkout and Webhooks.
 */

export function isCardPaymentConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim() !== '')
}

export interface CreateCardSessionParams {
  userId: string
  userEmail: string
  amountUsd: number
  itemName: string
  courseId?: string | null
  courseSlug?: string | null
  planId?: number | null
  billNumber: string
  successUrl: string
  cancelUrl: string
}

export async function createStripeCheckoutSession(params: CreateCardSessionParams): Promise<{
  id: string
  url: string
}> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured on this server')
  }

  const unitAmountInCents = Math.round(params.amountUsd * 100)

  // Build form-urlencoded payload for Stripe API
  const formData = new URLSearchParams()
  formData.append('mode', 'payment')
  formData.append('customer_email', params.userEmail)
  formData.append('client_reference_id', params.userId)
  formData.append('success_url', params.successUrl)
  formData.append('cancel_url', params.cancelUrl)

  // Line items
  formData.append('line_items[0][price_data][currency]', 'usd')
  formData.append('line_items[0][price_data][unit_amount]', String(unitAmountInCents))
  formData.append('line_items[0][price_data][product_data][name]', params.itemName)
  formData.append('line_items[0][price_data][product_data][description]', `ArchTipsBox Masterclass - ${params.billNumber}`)
  formData.append('line_items[0][quantity]', '1')

  // Metadata
  formData.append('metadata[user_id]', params.userId)
  formData.append('metadata[bill_number]', params.billNumber)
  if (params.courseId) formData.append('metadata[course_id]', params.courseId)
  if (params.courseSlug) formData.append('metadata[course_slug]', params.courseSlug)
  if (params.planId) formData.append('metadata[plan_id]', String(params.planId))

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.error?.message || `Stripe session creation failed with status ${res.status}`)
  }

  const session = await res.json()
  return {
    id: session.id,
    url: session.url,
  }
}

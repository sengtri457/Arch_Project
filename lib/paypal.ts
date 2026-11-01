/**
 * PayPal REST API v2 Integration Helper
 * Supports Sandbox and Live environments with in-memory OAuth token caching,
 * dynamic order creation, order query, capture, and webhook verification.
 */

interface CachedToken {
  token: string
  expiresAt: number
}

let cachedToken: CachedToken | null = null

export function getPayPalEnvironment(): 'sandbox' | 'live' {
  const env = (process.env.PAYPAL_ENVIRONMENT || 'sandbox').toLowerCase().trim()
  return env === 'live' || env === 'production' ? 'live' : 'sandbox'
}

export function getPayPalBaseUrl(): string {
  return getPayPalEnvironment() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

export function getPayPalCredentials(): { clientId: string; clientSecret: string } {
  const clientId = (
    process.env.PAYPAL_CLIENT_ID ||
    process.env.PAYPAL_LIVE_CLIENT_ID ||
    process.env.PAYPAL_SANDBOX_CLIENT_ID ||
    ''
  ).trim()

  const clientSecret = (
    process.env.PAYPAL_CLIENT_SECRET ||
    process.env.PAYPAL_LIVE_CLIENT_SECRET ||
    process.env.PAYPAL_SANDBOX_CLIENT_SECRET ||
    ''
  ).trim()

  return { clientId, clientSecret }
}

export function isPayPalConfigured(): boolean {
  const { clientId, clientSecret } = getPayPalCredentials()
  return Boolean(clientId && clientSecret)
}

/**
 * Retrieve OAuth 2.0 access token via client credentials grant.
 * Automatically caches token and refreshes when expired.
 */
export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token
  }

  const { clientId, clientSecret } = getPayPalCredentials()
  if (!clientId || !clientSecret) {
    throw new Error('PayPal API credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) are not configured')
  }

  const baseUrl = getPayPalBaseUrl()
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('PayPal OAuth token error:', res.status, errorText)
    throw new Error(`Failed to obtain PayPal access token: ${res.statusText}`)
  }

  const data = await res.json()
  const expiresInMs = (data.expires_in || 3600) * 1000

  cachedToken = {
    token: data.access_token,
    expiresAt: now + expiresInMs
  }

  return cachedToken.token
}

export interface CreateOrderParams {
  amount: number
  currency?: string
  billNumber: string
  description: string
  returnUrl?: string
  cancelUrl?: string
}

export interface CreateOrderResult {
  orderId: string
  approvalUrl: string
  status: string
}

/**
 * Create a PayPal order (Orders v2 API) with intent: CAPTURE.
 * Returns order ID and buyer approval checkout URL.
 */
export async function createPayPalOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const token = await getPayPalAccessToken()
  const baseUrl = getPayPalBaseUrl()

  const currency = params.currency || 'USD'
  const formattedAmount = Math.max(0, params.amount).toFixed(2)

  const payload: any = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: params.billNumber,
        custom_id: params.billNumber,
        invoice_id: params.billNumber,
        description: (params.description || 'Archtipsbox Purchase').slice(0, 127),
        amount: {
          currency_code: currency,
          value: formattedAmount
        }
      }
    ]
  }

  if (params.returnUrl || params.cancelUrl) {
    payload.application_context = {
      brand_name: 'Archtipsbox Academy',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      ...(params.returnUrl ? { return_url: params.returnUrl } : {}),
      ...(params.cancelUrl ? { cancel_url: params.cancelUrl } : {})
    }
  }

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': params.billNumber
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    console.error('PayPal create order error:', res.status, errorData)
    throw new Error(errorData.message || `PayPal order creation failed with status ${res.status}`)
  }

  const order = await res.json()
  const approvalLink = order.links?.find((l: any) => l.rel === 'approve' || l.rel === 'payer-action')
  const approvalUrl = approvalLink?.href || `https://www.paypal.com/checkoutnow?token=${order.id}`

  return {
    orderId: order.id,
    approvalUrl,
    status: order.status
  }
}

/**
 * Retrieve PayPal order details.
 */
export async function getPayPalOrder(orderId: string): Promise<any> {
  const token = await getPayPalAccessToken()
  const baseUrl = getPayPalBaseUrl()

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('PayPal get order error:', res.status, errorText)
    throw new Error(`Failed to query PayPal order ${orderId}: ${res.status}`)
  }

  return await res.json()
}

export interface CaptureOrderResult {
  captureId: string
  status: string
  amount: string
  currency: string
  raw: any
}

/**
 * Capture an approved PayPal order.
 */
export async function capturePayPalOrder(orderId: string): Promise<CaptureOrderResult> {
  const token = await getPayPalAccessToken()
  const baseUrl = getPayPalBaseUrl()

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error('PayPal capture error:', res.status, data)
    throw new Error(data.message || `PayPal capture failed with status ${res.status}`)
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0]
  const captureId = capture?.id || data.id || ''
  const status = capture?.status || data.status || 'COMPLETED'
  const amount = capture?.amount?.value || ''
  const currency = capture?.amount?.currency_code || 'USD'

  return {
    captureId,
    status,
    amount,
    currency,
    raw: data
  }
}

/**
 * Verify incoming PayPal Webhook Signature.
 */
export async function verifyPayPalWebhookSignature(params: {
  webhookId: string
  headers: Record<string, string | null>
  bodyText: string
}): Promise<boolean> {
  const { webhookId, headers, bodyText } = params

  if (!webhookId) return false

  const token = await getPayPalAccessToken()
  const baseUrl = getPayPalBaseUrl()

  const authAlgo = headers['paypal-auth-algo']
  const certUrl = headers['paypal-cert-url']
  const transmissionId = headers['paypal-transmission-id']
  const transmissionSig = headers['paypal-transmission-sig']
  const transmissionTime = headers['paypal-transmission-time']

  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    console.warn('Missing required PayPal webhook headers for signature verification')
    return false
  }

  let webhookEvent: any
  try {
    webhookEvent = JSON.parse(bodyText)
  } catch {
    return false
  }

  const verificationPayload = {
    auth_algo: authAlgo,
    cert_url: certUrl,
    transmission_id: transmissionId,
    transmission_sig: transmissionSig,
    transmission_time: transmissionTime,
    webhook_id: webhookId,
    webhook_event: webhookEvent
  }

  const res = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(verificationPayload)
  })

  if (!res.ok) {
    console.error('PayPal webhook signature check HTTP error:', res.status)
    return false
  }

  const result = await res.json()
  return result.verification_status === 'SUCCESS'
}

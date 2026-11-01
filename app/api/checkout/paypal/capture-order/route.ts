import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { capturePayPalOrder, isPayPalConfigured } from '@/lib/paypal'
import { fulfillPaymentTransaction } from '@/lib/payments/fulfillment'

export async function POST(request: Request) {
  try {
    const limiter = rateLimit(`paypal-capture:${getClientIp(request)}`, 10, 60_000)
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Too many capture attempts. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfter) } }
      )
    }

    const cookieStore = await cookies()

    // 1. Authenticate user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any) {
            try {
              cookiesToSet.forEach(({ name, value, options }: any) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          }
        }
      }
    )

    const {
      data: { user },
      error: authErr
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { orderId, billNumber } = body

    if (!orderId && !billNumber) {
      return NextResponse.json(
        { error: 'Provide at least orderId or billNumber' },
        { status: 400 }
      )
    }

    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { error: 'PayPal API gateway is not configured on this server.' },
        { status: 503 }
      )
    }

    // 2. Query transaction
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )

    let query = supabaseAdmin.from('payment_transactions').select('*')
    if (billNumber) {
      query = query.eq('bill_number', billNumber)
    } else {
      query = query.eq('external_tx_hash', orderId)
    }

    const { data: transaction, error: txError } = await query.single()

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 })
    }

    if (transaction.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden transaction access' }, { status: 403 })
    }

    if (transaction.payment_status === 'completed') {
      return NextResponse.json({ success: true, status: 'completed' })
    }

    const paypalOrderId = orderId || transaction.external_tx_hash
    if (!paypalOrderId) {
      return NextResponse.json({ error: 'Missing PayPal order identifier' }, { status: 400 })
    }

    // 3. Execute Capture
    const captureResult = await capturePayPalOrder(paypalOrderId)

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `Payment not completed. PayPal status: ${captureResult.status}` },
        { status: 400 }
      )
    }

    // 4. Verify transaction amount if present
    if (captureResult.amount && transaction.amount) {
      const capturedFloat = parseFloat(captureResult.amount)
      const expectedFloat = parseFloat(String(transaction.amount))
      if (Math.abs(capturedFloat - expectedFloat) > 0.05) {
        console.warn(`PayPal amount mismatch! Captured: ${capturedFloat}, Expected: ${expectedFloat}`)
      }
    }

    // 5. Fulfill Order
    const fulfillment = await fulfillPaymentTransaction(supabaseAdmin, {
      transaction,
      billNumber: transaction.bill_number,
      externalTxHash: captureResult.captureId || paypalOrderId,
      origin: new URL(request.url).origin
    })

    return NextResponse.json({
      success: true,
      status: 'completed',
      redirectUrl: fulfillment.redirectUrl,
      courseSlug: fulfillment.courseSlug
    })
  } catch (err: any) {
    console.error('PayPal capture endpoint error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

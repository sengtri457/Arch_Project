import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { getPayPalOrder, capturePayPalOrder, isPayPalConfigured } from '@/lib/paypal'
import { fulfillPaymentTransaction } from '@/lib/payments/fulfillment'

export async function GET(request: Request) {
  try {
    const limiter = rateLimit(`paypal-status:${getClientIp(request)}`, 40, 60_000)
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Too many status checks. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfter) } }
      )
    }

    const { searchParams } = new URL(request.url)
    const billNumber = searchParams.get('billNumber')

    if (!billNumber) {
      return NextResponse.json({ error: 'Missing billNumber parameter' }, { status: 400 })
    }

    // 1. Initialize Supabase Admin client
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

    // 2. Query transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('bill_number', billNumber)
      .single()

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 })
    }

    // If transaction is already completed, return success
    if (transaction.payment_status === 'completed') {
      return NextResponse.json({ success: true, status: 'completed' })
    }

    if (!isPayPalConfigured()) {
      return NextResponse.json({
        success: true,
        status: transaction.payment_status
      })
    }

    const paypalOrderId = transaction.external_tx_hash

    // 3. Query PayPal API for current order state
    if (paypalOrderId) {
      try {
        const order = await getPayPalOrder(paypalOrderId)
        const orderStatus = order.status

        // Case A: User approved on phone or in browser -> Auto-capture now!
        if (orderStatus === 'APPROVED') {
          console.log(`Auto-capturing approved PayPal order: ${paypalOrderId} (Bill: ${billNumber})`)
          const captureResult = await capturePayPalOrder(paypalOrderId)

          if (captureResult.status === 'COMPLETED') {
            const fulfillment = await fulfillPaymentTransaction(supabaseAdmin, {
              transaction,
              billNumber,
              externalTxHash: captureResult.captureId || paypalOrderId,
              origin: new URL(request.url).origin
            })

            return NextResponse.json({
              success: true,
              status: 'completed',
              redirectUrl: fulfillment.redirectUrl,
              courseSlug: fulfillment.courseSlug
            })
          }
        } else if (orderStatus === 'COMPLETED') {
          // Already captured, execute fulfillment
          const fulfillment = await fulfillPaymentTransaction(supabaseAdmin, {
            transaction,
            billNumber,
            externalTxHash: paypalOrderId,
            origin: new URL(request.url).origin
          })

          return NextResponse.json({
            success: true,
            status: 'completed',
            redirectUrl: fulfillment.redirectUrl,
            courseSlug: fulfillment.courseSlug
          })
        } else if (orderStatus === 'VOIDED') {
          await supabaseAdmin
            .from('payment_transactions')
            .update({ payment_status: 'failed' })
            .eq('bill_number', billNumber)

          return NextResponse.json({ success: false, status: 'failed' })
        }
      } catch (paypalErr) {
        console.warn('PayPal status query failed:', paypalErr)
      }
    }

    return NextResponse.json({
      success: true,
      status: transaction.payment_status
    })
  } catch (err: any) {
    console.error('PayPal status endpoint error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

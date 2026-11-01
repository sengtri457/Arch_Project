import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPayPalWebhookSignature } from '@/lib/paypal'
import { fulfillPaymentTransaction } from '@/lib/payments/fulfillment'

export async function POST(request: Request) {
  try {
    const bodyText = await request.text()
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || ''

    // Collect headers for verification
    const headers = {
      'paypal-auth-algo': request.headers.get('paypal-auth-algo'),
      'paypal-cert-url': request.headers.get('paypal-cert-url'),
      'paypal-transmission-id': request.headers.get('paypal-transmission-id'),
      'paypal-transmission-sig': request.headers.get('paypal-transmission-sig'),
      'paypal-transmission-time': request.headers.get('paypal-transmission-time')
    }

    // Verify signature if webhook ID is configured
    if (webhookId) {
      const isValid = await verifyPayPalWebhookSignature({
        webhookId,
        headers,
        bodyText
      })

      if (!isValid) {
        console.warn('Invalid PayPal webhook signature rejected')
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
      }
    } else {
      console.warn('PAYPAL_WEBHOOK_ID not configured; skipping signature verification (sandbox only)')
    }

    let event: any
    try {
      event = JSON.parse(bodyText)
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 })
    }

    const eventType = event.event_type
    console.log(`Received PayPal webhook event: ${eventType} (ID: ${event.id})`)

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = event.resource
      const captureId = resource.id
      const billNumber =
        resource.custom_id ||
        resource.invoice_id ||
        resource.supplementary_data?.related_ids?.order_id

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
      if (billNumber && billNumber.startsWith('BILL-')) {
        query = query.eq('bill_number', billNumber)
      } else if (resource.supplementary_data?.related_ids?.order_id) {
        query = query.eq('external_tx_hash', resource.supplementary_data.related_ids.order_id)
      } else {
        query = query.eq('external_tx_hash', captureId)
      }

      const { data: transaction, error: txError } = await query.maybeSingle()

      if (txError || !transaction) {
        console.warn('PayPal webhook: matching transaction record not found')
        return NextResponse.json({ message: 'Transaction not found' }, { status: 200 })
      }

      if (transaction.payment_status === 'completed') {
        return NextResponse.json({ message: 'Transaction already completed' }, { status: 200 })
      }

      await fulfillPaymentTransaction(supabaseAdmin, {
        transaction,
        billNumber: transaction.bill_number,
        externalTxHash: captureId,
        origin: new URL(request.url).origin
      })

      console.log(`Successfully fulfilled PayPal webhook for transaction ${transaction.bill_number}`)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('PayPal webhook error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

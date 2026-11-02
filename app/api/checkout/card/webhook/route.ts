import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    let event: any

    try {
      event = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    // Verify webhook event type
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object
      if (!session) {
        return NextResponse.json({ error: 'Missing session object' }, { status: 400 })
      }

      const userId = session.client_reference_id || session.metadata?.user_id
      const courseId = session.metadata?.course_id
      const planId = session.metadata?.plan_id
      const billNumber = session.metadata?.bill_number || session.id
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0

      if (!userId) {
        console.warn('Stripe Webhook: Missing userId in metadata')
        return NextResponse.json({ received: true, note: 'Missing userId' })
      }

      const supabase = getServiceClient()

      // 1. Record payment in payments table
      const { error: payErr } = await supabase.from('payments').insert({
        user_id: userId,
        amount: amountPaid,
        currency: 'USD',
        payment_method: 'card',
        payment_status: 'completed',
        transaction_id: session.payment_intent || session.id,
      })

      if (payErr) {
        console.warn('Stripe Webhook: Payment log note:', payErr.message)
      }

      // 2. Activate course enrollment or subscription
      if (courseId) {
        const { error: enrollErr } = await supabase.from('enrollments').upsert(
          {
            user_id: userId,
            course_id: courseId,
            status: 'active',
            enrolled_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,course_id' }
        )

        if (enrollErr) {
          console.error('Stripe Webhook: Enrollment activation failed:', enrollErr.message)
        } else {
          console.log(`Stripe Webhook: Successfully enrolled user ${userId} in course ${courseId}`)
        }
      } else if (planId) {
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)

        await supabase.from('user_subscriptions').upsert(
          {
            user_id: userId,
            plan_id: parseInt(String(planId)),
            status: 'active',
            starts_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          },
          { onConflict: 'user_id' }
        )
      }

      // 3. Mark pending enrollment as approved if existed
      await supabase
        .from('pending_enrollments')
        .update({ status: 'approved' })
        .eq('user_id', userId)
        .eq('transaction_reference', billNumber)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Stripe Webhook processing error:', err)
    return NextResponse.json({ error: err.message || 'Webhook handler error' }, { status: 500 })
  }
}

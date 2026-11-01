import { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail, paymentReceiptEmail } from '@/lib/email'
import { sendTelegramInvoiceNotification } from '@/lib/telegram'

export interface FulfillTransactionParams {
  transaction: {
    transaction_id: string
    user_id: string
    plan_id?: number | null
    course_id?: string | null
    bill_number: string
    amount: number | string
    payment_method?: string | null
    promo_code?: string | null
    payment_status?: string | null
  }
  billNumber: string
  externalTxHash?: string
  origin?: string
}

export interface FulfillmentResult {
  success: boolean
  courseSlug?: string
  redirectUrl: string
  itemName: string
}

/**
 * Shared fulfillment pipeline for verified payments (Bakong KHQR, PayPal, etc.).
 * Ensures 100% parity across polling endpoints and webhooks.
 */
export async function fulfillPaymentTransaction(
  supabaseAdmin: SupabaseClient,
  params: FulfillTransactionParams
): Promise<FulfillmentResult> {
  const { transaction, billNumber, externalTxHash, origin } = params

  // 1. Update transaction status to completed
  const { error: updateError } = await supabaseAdmin
    .from('payment_transactions')
    .update({
      payment_status: 'completed',
      external_tx_hash: externalTxHash || null,
      completed_at: new Date().toISOString()
    })
    .eq('bill_number', billNumber)

  if (updateError) {
    console.error('Failed to update transaction status to completed:', updateError)
    throw updateError
  }

  let courseSlug = ''

  // 2. Activate Course Enrollment
  if (transaction.course_id) {
    const { error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .upsert(
        {
          student_id: transaction.user_id,
          course_id: transaction.course_id,
          status: 'active',
          enrolled_at: new Date().toISOString()
        },
        { onConflict: 'student_id,course_id' }
      )

    if (enrollError) {
      console.error('Failed to activate course enrollment:', enrollError)
      throw enrollError
    }
  }

  // 3. Activate Plan Subscription
  if (transaction.plan_id) {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(startDate.getMonth() + 1) // 1 month default

    const { error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(
        {
          user_id: transaction.user_id,
          plan_id: transaction.plan_id,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          last_transaction_id: transaction.transaction_id
        },
        { onConflict: 'user_id' }
      )

    if (subError) {
      console.error('Failed to activate subscription plan:', subError)
      throw subError
    }
  }

  // 4. Upgrade profile role to student (preserve admin and instructor roles)
  const { data: currentProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', transaction.user_id)
    .maybeSingle()

  if (currentProfile && currentProfile.role !== 'admin' && currentProfile.role !== 'instructor') {
    await supabaseAdmin
      .from('profiles')
      .update({ role: 'student' })
      .eq('id', transaction.user_id)
  }

  // 5. Increment promo code redemptions count if used
  if (transaction.promo_code) {
    const { data: promoData } = await supabaseAdmin
      .from('promo_codes')
      .select('redemptions_count')
      .eq('code', transaction.promo_code)
      .single()

    if (promoData) {
      await supabaseAdmin
        .from('promo_codes')
        .update({ redemptions_count: (promoData.redemptions_count || 0) + 1 })
        .eq('code', transaction.promo_code)
    }
  }

  // 6. Send notifications (receipt email + Telegram alert)
  const siteOrigin =
    origin ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://archtipsbox.com'

  let itemName = 'Your purchase'
  let ctaUrl = `${siteOrigin}/dashboard`
  let ctaLabel = 'Go to my dashboard'

  if (transaction.course_id) {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('title, slug')
      .eq('course_id', transaction.course_id)
      .single()

    if (course) {
      courseSlug = course.slug || ''
      itemName = course.title || 'Course enrollment'
      ctaUrl = courseSlug ? `${siteOrigin}/courses/${courseSlug}` : ctaUrl
      ctaLabel = 'Start learning now'
    }
  } else if (transaction.plan_id) {
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('name')
      .eq('plan_id', transaction.plan_id)
      .single()

    itemName = `${plan?.name || 'Subscription'} plan`
  }

  try {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(transaction.user_id)
    const userEmail = userData?.user?.email ?? null

    if (userEmail) {
      await sendEmail({
        to: userEmail,
        subject: `Payment confirmed - ${itemName}`,
        html: paymentReceiptEmail({
          itemName,
          amount: Number(transaction.amount),
          billNumber: billNumber,
          ctaUrl,
          ctaLabel
        })
      })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', transaction.user_id)
      .single()

    const customerName = profile?.full_name || 'Student'

    await sendTelegramInvoiceNotification({
      itemName,
      amount: Number(transaction.amount),
      billNumber: transaction.bill_number,
      paymentMethod: transaction.payment_method || 'paypal',
      completedAt: new Date().toISOString(),
      userEmail: userEmail || '',
      userId: transaction.user_id,
      transactionId: transaction.transaction_id,
      promoCode: transaction.promo_code ?? null,
      customerName
    }).catch((tgErr) => {
      console.error('Telegram invoice notification failed:', tgErr)
    })
  } catch (notifyErr) {
    console.error('Fulfillment notifications failed (non-blocking):', notifyErr)
  }

  return {
    success: true,
    courseSlug,
    redirectUrl: ctaUrl,
    itemName
  }
}

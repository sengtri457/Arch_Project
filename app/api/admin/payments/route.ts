import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, paymentReceiptEmail } from '@/lib/email'

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return null
  return user
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
    }

    const transactionId = String(body.transactionId ?? '').trim()
    if (!transactionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId)) {
      return NextResponse.json({ error: 'Invalid or missing transactionId parameter' }, { status: 400 })
    }

    const supabaseAdmin = serviceClient()

    // 1. Fetch transaction
    const { data: transaction, error: fetchErr } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (fetchErr || !transaction) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 })
    }

    if (transaction.payment_status === 'completed') {
      return NextResponse.json({ error: 'Transaction is already completed' }, { status: 400 })
    }

    // 2. Update transaction status
    const { error: updateError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        payment_status: 'completed',
        external_tx_hash: 'MANUAL-ADMIN-' + admin.id.substring(0, 8),
        completed_at: new Date().toISOString()
      })
      .eq('transaction_id', transactionId)

    if (updateError) throw updateError

    // 3. Activate Course Enrollment
    if (transaction.course_id) {
      const { error: enrollError } = await supabaseAdmin
        .from('course_enrollments')
        .upsert({
          student_id: transaction.user_id,
          course_id: transaction.course_id,
          status: 'active',
          enrolled_at: new Date().toISOString()
        }, { onConflict: 'student_id,course_id' })

      if (enrollError) throw enrollError
    }

    // 4. Activate Plan Subscription
    if (transaction.plan_id) {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(startDate.getMonth() + 1)

      const { error: subError } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert({
          user_id: transaction.user_id,
          plan_id: transaction.plan_id,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          last_transaction_id: transaction.transaction_id
        }, { onConflict: 'user_id' })

      if (subError) throw subError
    }

    // 5. Upgrade profile role to student
    await supabaseAdmin
      .from('profiles')
      .update({ role: 'student' })
      .eq('id', transaction.user_id)

    // 6. Increment promo code count
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

    // 7. Send receipt + access email
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(transaction.user_id)
      const userEmail = userData?.user?.email ?? null

      const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'
      let itemName = 'Your purchase'
      let ctaUrl = `${origin}/dashboard`
      let ctaLabel = 'Go to my dashboard'

      if (transaction.course_id) {
        const { data: course } = await supabaseAdmin
          .from('courses')
          .select('title, slug')
          .eq('course_id', transaction.course_id)
          .single()
        itemName = course?.title || 'Course enrollment'
        ctaUrl = course?.slug ? `${origin}/courses/${course.slug}` : ctaUrl
        ctaLabel = 'Start learning now'
      } else if (transaction.plan_id) {
        const { data: plan } = await supabaseAdmin
          .from('subscription_plans')
          .select('name')
          .eq('plan_id', transaction.plan_id)
          .single()
        itemName = `${plan?.name || 'Subscription'} plan`
      }

      if (userEmail) {
        await sendEmail({
          to: userEmail,
          subject: `Payment confirmed - ${itemName}`,
          html: paymentReceiptEmail({
            itemName,
            amount: Number(transaction.amount),
            billNumber: transaction.bill_number,
            ctaUrl,
            ctaLabel
          })
        })
      }
    } catch (emailErr) {
      console.error('Manual confirmation receipt email failed:', emailErr)
    }

    return NextResponse.json({ success: true, message: 'Transaction manually completed and enrollment activated' })

  } catch (err: any) {
    console.error("Manual payment activation endpoint error:", err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

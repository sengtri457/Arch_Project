import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { createPayPalOrder, isPayPalConfigured } from '@/lib/paypal'

export async function POST(request: Request) {
  try {
    const limiter = rateLimit(`paypal-create:${getClientIp(request)}`, 10, 60_000)
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfter) } }
      )
    }

    const cookieStore = await cookies()

    // 1. Initialize Supabase Client & Authenticate
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
            } catch {
              // Can be ignored if called from route handler
            }
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

    // 2. Validate payload
    const body = await request.json().catch(() => ({}))
    const { courseId, planId, promoCode } = body

    if ((!courseId && !planId) || (courseId && planId)) {
      return NextResponse.json(
        { error: 'Provide exactly one of courseId or planId' },
        { status: 400 }
      )
    }

    if (
      courseId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(courseId))
    ) {
      return NextResponse.json({ error: 'Invalid course ID format' }, { status: 400 })
    }

    // 3. Compute item price
    let checkoutAmount = 49.99
    let targetPlanId: number | null = null
    let targetCourseId: string | null = null
    let itemName = 'Course Enrollment'
    let courseSlug = ''

    if (planId) {
      targetPlanId = parseInt(String(planId))
      if (!Number.isInteger(targetPlanId) || targetPlanId < 1 || targetPlanId > 100) {
        return NextResponse.json({ error: 'Invalid subscription plan ID' }, { status: 400 })
      }

      const { data: plan, error: planErr } = await supabase
        .from('subscription_plans')
        .select('name, price_usd')
        .eq('plan_id', targetPlanId)
        .single()

      if (planErr || !plan) {
        return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 })
      }
      checkoutAmount = parseFloat(plan.price_usd)
      itemName = `${plan.name} Subscription`
    } else if (courseId) {
      targetCourseId = courseId
      const { data: course, error: courseErr } = await supabase
        .from('courses')
        .select('title, slug, price')
        .eq('course_id', targetCourseId)
        .single()

      if (courseErr || !course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 400 })
      }
      courseSlug = course.slug || ''
      itemName = course.title || 'Course Enrollment'
      checkoutAmount = course.price ? parseFloat(course.price) : 49.99
    }

    // Apply promo code discount if provided
    let appliedPromoCode: string | null = null
    if (promoCode && typeof promoCode === 'string') {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase().trim())
        .single()

      if (promo) {
        const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date()
        const isLimitReached =
          promo.max_redemptions !== null && promo.redemptions_count >= promo.max_redemptions

        if (promo.is_active && !isExpired && !isLimitReached) {
          appliedPromoCode = promo.code
          if (promo.discount_type === 'percentage') {
            checkoutAmount = checkoutAmount * (1 - parseFloat(promo.discount_value) / 100)
          } else {
            checkoutAmount = Math.max(0, checkoutAmount - parseFloat(promo.discount_value))
          }
        }
      }
    }

    checkoutAmount = Math.round(checkoutAmount * 100) / 100

    if (!isPayPalConfigured()) {
      return NextResponse.json(
        {
          error: 'PayPal API gateway is not configured yet on this server. Please contact support.',
          notConfigured: true
        },
        { status: 503 }
      )
    }

    // 4. Generate internal bill number
    const billNumber = `BILL-PP-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Determine return and cancel URLs
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      new URL(request.url).origin
    const returnUrl = `${origin}/checkout?billNumber=${billNumber}&paypalSuccess=1`
    const cancelUrl = `${origin}/checkout?billNumber=${billNumber}&paypalCancel=1`

    // 5. Call PayPal Orders v2 API
    const paypalOrder = await createPayPalOrder({
      amount: checkoutAmount,
      currency: 'USD',
      billNumber,
      description: itemName,
      returnUrl,
      cancelUrl
    })

    // 6. Record pending transaction in database
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

    // Ensure profile exists for user to prevent foreign key violation on payment_transactions.user_id
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!existingProfile) {
      await supabaseAdmin.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        role: 'student',
        is_active: true
      })
    }

    const { error: txError } = await supabaseAdmin.from('payment_transactions').insert({
      user_id: user.id,
      plan_id: targetPlanId,
      course_id: targetCourseId,
      payment_method: 'paypal',
      bill_number: billNumber,
      amount: checkoutAmount,
      currency: 'USD',
      external_tx_hash: paypalOrder.orderId,
      payment_status: 'pending',
      promo_code: appliedPromoCode
    })

    if (txError) {
      console.error('Failed to record pending PayPal transaction:', txError)
      return NextResponse.json({ 
        error: `Failed to record transaction: ${txError.message || 'Unknown database error'}`,
        details: txError
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      orderId: paypalOrder.orderId,
      approvalUrl: paypalOrder.approvalUrl,
      billNumber,
      amount: checkoutAmount,
      courseSlug
    })
  } catch (err: any) {
    console.error('PayPal create-order endpoint error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

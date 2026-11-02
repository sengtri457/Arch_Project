import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { createStripeCheckoutSession, isCardPaymentConfigured } from '@/lib/card-payment'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const limiter = rateLimit(`card-create:${clientIp}`, 10, 60_000)
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfter) } }
      )
    }

    const cookieStore = await cookies()
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
    const { courseId, planId, promoCode } = body

    if ((!courseId && !planId) || (courseId && planId)) {
      return NextResponse.json(
        { error: 'Provide exactly one of courseId or planId' },
        { status: 400 }
      )
    }

    let checkoutAmount = 49.99
    let targetPlanId: number | null = null
    let targetCourseId: string | null = null
    let itemName = 'Course Enrollment'
    let courseSlug = ''

    if (planId) {
      targetPlanId = parseInt(String(planId))
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

    // Apply promo code if present
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
          if (promo.discount_type === 'percentage') {
            checkoutAmount = checkoutAmount * (1 - parseFloat(promo.discount_value) / 100)
          } else {
            checkoutAmount = Math.max(0, checkoutAmount - parseFloat(promo.discount_value))
          }
        }
      }
    }

    checkoutAmount = Math.round(checkoutAmount * 100) / 100
    const billNumber = `BILL-CARD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      request.headers.get('origin')?.replace(/\/$/, '') ||
      'http://localhost:3000'

    const successUrl = `${origin}/checkout?status=success&bill=${billNumber}&course=${courseSlug || ''}&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/checkout?status=cancelled&course=${courseSlug || ''}`

    // Check if Stripe is configured
    if (isCardPaymentConfigured()) {
      const session = await createStripeCheckoutSession({
        userId: user.id,
        userEmail: user.email || 'student@archtipsbox.com',
        amountUsd: checkoutAmount,
        itemName,
        courseId: targetCourseId,
        courseSlug,
        planId: targetPlanId,
        billNumber,
        successUrl,
        cancelUrl,
      })

      return NextResponse.json({
        success: true,
        mode: 'stripe',
        sessionId: session.id,
        checkoutUrl: session.url,
        billNumber,
        amount: checkoutAmount,
      })
    }

    // Fallback: If Stripe API keys are not yet added to production, register pending enrollment
    const serviceDb = getServiceClient()
    const { error: pendingErr } = await serviceDb
      .from('pending_enrollments')
      .insert({
        user_id: user.id,
        course_id: targetCourseId,
        payment_method: 'card',
        transaction_reference: billNumber,
        amount: checkoutAmount,
        status: 'pending'
      })

    if (pendingErr) {
      console.warn('Pending card enrollment save note:', pendingErr.message)
    }

    return NextResponse.json({
      success: true,
      mode: 'manual',
      notConfigured: true,
      billNumber,
      amount: checkoutAmount,
      message: 'Card payment gateway in onboarding mode. Payment reference generated for verification.',
    })
  } catch (err: any) {
    console.error('Card checkout error:', err)
    return NextResponse.json({ error: err.message || 'Failed to initiate card payment' }, { status: 500 })
  }
}

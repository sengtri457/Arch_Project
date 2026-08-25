import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { BakongKHQR, IndividualInfo, khqrData } from 'bakong-khqr'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const limiter = rateLimit(`checkout:${getClientIp(request)}`, 5, 60_000)
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfter) } }
      )
    }

    const cookieStore = await cookies()
    
    // 1. Initialize Supabase Server Client
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware handling writes.
            }
          },
        },
      }
    )

    // 2. Authenticate the active user session
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 })
    }

    // 3. Extract request parameters
    const { courseId, planId, promoCode } = await request.json()
    if ((!courseId && !planId) || (courseId && planId)) {
      return NextResponse.json({ error: 'Provide exactly one of courseId or planId' }, { status: 400 })
    }
    if (courseId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(courseId))) {
      return NextResponse.json({ error: 'Invalid course ID format' }, { status: 400 })
    }

    let checkoutAmount = 49.99 // Default course purchase price
    let targetPlanId: number | null = null
    let targetCourseId: string | null = null
    let courseSlug = ''

    // 4. Determine cost and type
    if (planId) {
      targetPlanId = parseInt(String(planId))
      if (!Number.isInteger(targetPlanId) || targetPlanId < 1 || targetPlanId > 100) {
        return NextResponse.json({ error: 'Invalid subscription plan ID' }, { status: 400 })
      }
      // Fetch plan pricing
      const { data: plan, error: planErr } = await supabase
        .from('subscription_plans')
        .select('price_usd')
        .eq('plan_id', targetPlanId)
        .single()

      if (planErr || !plan) {
        return NextResponse.json({ error: 'Invalid subscription plan ID' }, { status: 400 })
      }
      checkoutAmount = parseFloat(plan.price_usd)
    } else if (courseId) {
      targetCourseId = courseId
      // Ensure course exists and load configured price
      const { data: course, error: courseErr } = await supabase
        .from('courses')
        .select('title, slug, price')
        .eq('course_id', targetCourseId)
        .single()

      if (courseErr || !course) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
      }
      courseSlug = course.slug
      checkoutAmount = course.price ? parseFloat(course.price) : 49.99
    }

    // Apply Promo Code discount if provided
    let appliedPromoCode: string | null = null
    if (promoCode) {
      if (typeof promoCode !== 'string' || promoCode.trim().length > 50) {
        return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 })
      }
      const { data: promo, error: promoErr } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase().trim())
        .single()

      if (!promoErr && promo) {
        const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date()
        const isLimitReached = promo.max_redemptions !== null && promo.redemptions_count >= promo.max_redemptions
        
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

    // Clamp to whole cents so KHQR never encodes >2-decimal amounts
    checkoutAmount = Math.round(checkoutAmount * 100) / 100

    // 5. Generate unique bill number
    const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // 6. Generate Bakong KHQR Payload
    const accountID = process.env.BAKONG_ACCOUNT_ID?.trim()
    const merchantName = process.env.BAKONG_MERCHANT_NAME?.replace(/"/g, '').trim()
    const merchantCity = (process.env.BAKONG_MERCHANT_CITY || 'Phnom Penh').replace(/"/g, '').trim()

    if (!accountID || !merchantName) {
      console.error('Missing BAKONG_ACCOUNT_ID or BAKONG_MERCHANT_NAME environment variables')
      return NextResponse.json({ error: 'Payment gateway is not configured' }, { status: 500 })
    }

    const khqrHelper = new BakongKHQR()


    const merchantInfo = new IndividualInfo(
      accountID,
      merchantName,
      merchantCity,
      {
        amount: checkoutAmount,
        currency: khqrData.currency.usd, // USD: 840
        billNumber: billNumber,
        storeLabel: 'ArchViz Academy',
        terminalLabel: 'Web Checkout',
        expirationTimestamp: Date.now() + 2 * 60 * 60 * 1000 // 2 hours from now in ms
      }
    )

    const khqrResult = khqrHelper.generateIndividual(merchantInfo)
    
    if (khqrResult?.status?.code !== undefined && khqrResult?.status?.code !== 0) {
      console.error("Bakong KHQR compilation error status:", khqrResult.status)
      return NextResponse.json({ 
        error: `Failed to compile KHQR: ${khqrResult.status.message || 'Unknown Error'}` 
      }, { status: 400 })
    }

    const qrPayload = khqrResult?.data?.qr || ''

    if (!qrPayload) {
      return NextResponse.json({ error: 'Failed to compile KHQR payload string (empty response)' }, { status: 500 })
    }

    // 7. Insert pending transaction row inside Supabase (using Service Role to bypass normal student RLS constraint)
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

    const { data: transaction, error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        plan_id: targetPlanId,
        course_id: targetCourseId,
        payment_method: 'bakong_khqr',
        bill_number: billNumber,
        amount: checkoutAmount,
        currency: 'USD',
        khqr_payload: qrPayload,
        payment_status: 'pending',
        promo_code: appliedPromoCode
      })
      .select()
      .single()

    if (txError || !transaction) {
      console.error("Database transaction insertion failed:", txError)
      return NextResponse.json({ error: 'Database transaction insertion failed' }, { status: 500 })
    }

    // 8. Return payment details to client
    return NextResponse.json({
      success: true,
      transactionId: transaction.transaction_id,
      billNumber: transaction.bill_number,
      amount: transaction.amount,
      khqrPayload: transaction.khqr_payload,
      courseSlug: courseSlug
    })

  } catch (err: any) {
    console.error("Checkout session compilation error:", err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

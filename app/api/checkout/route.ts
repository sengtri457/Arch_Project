import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { BakongKHQR, IndividualInfo, khqrData } from 'bakong-khqr'

export async function POST(request: Request) {
  try {
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
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
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
    const { courseId, planId } = await request.json()
    if (!courseId && !planId) {
      return NextResponse.json({ error: 'Missing courseId or planId parameter' }, { status: 400 })
    }

    let checkoutAmount = 49.99 // Default course purchase price
    let targetPlanId: number | null = null
    let targetCourseId: string | null = null
    let courseSlug = ''

    // 4. Determine cost and type
    if (planId) {
      targetPlanId = parseInt(planId)
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

    // 5. Generate unique bill number
    const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // 6. Generate Bakong KHQR Payload
    const khqrHelper = new BakongKHQR()
    
    const accountID = (process.env.BAKONG_ACCOUNT_ID || 'bun_sengtri@bkrt').trim()
    const merchantName = (process.env.BAKONG_MERCHANT_NAME || 'SENGTREE bUN').replace(/"/g, '').trim()
    const merchantCity = (process.env.BAKONG_MERCHANT_CITY || 'Phnom Penh').replace(/"/g, '').trim()

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
        payment_status: 'pending'
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

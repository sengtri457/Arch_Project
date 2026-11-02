import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseGumroadPing } from '@/lib/gumroad'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

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
    const limiter = rateLimit(`gumroad-webhook:${clientIp}`, 30, 60_000)
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfter) } }
      )
    }

    // Parse Gumroad payload (supports both JSON and urlencoded form)
    const contentType = request.headers.get('content-type') || ''
    let payloadData: Record<string, any> = {}

    if (contentType.includes('application/json')) {
      payloadData = await request.json().catch(() => ({}))
    } else {
      const formData = await request.formData().catch(() => null)
      if (formData) {
        formData.forEach((value, key) => {
          payloadData[key] = value
        })
      } else {
        const text = await request.text().catch(() => '')
        const searchParams = new URLSearchParams(text)
        searchParams.forEach((value, key) => {
          payloadData[key] = value
        })
      }
    }

    const sale = parseGumroadPing(payloadData)
    if (!sale) {
      return NextResponse.json(
        { error: 'Invalid or missing buyer email in Gumroad ping' },
        { status: 400 }
      )
    }

    // Verify webhook secret if configured
    const configuredSecret = process.env.GUMROAD_WEBHOOK_SECRET
    if (configuredSecret && configuredSecret.trim()) {
      const incomingSecret =
        request.headers.get('x-gumroad-secret') ||
        payloadData.secret ||
        payloadData.webhook_secret
      if (incomingSecret !== configuredSecret) {
        return NextResponse.json({ error: 'Unauthorized webhook secret' }, { status: 401 })
      }
    }

    const supabase = getServiceClient()

    // 1. Identify Target Course (defaulting to D5 Masterclass if not explicitly matched)
    let courseId: string | null = null
    const { data: matchedCourse } = await supabase
      .from('courses')
      .select('course_id, slug, title')
      .or(`slug.ilike.%d5%,title.ilike.%d5%`)
      .limit(1)
      .maybeSingle()

    if (matchedCourse) {
      courseId = matchedCourse.course_id
    }

    // Fallback: If no D5 course found by filter, get the first available course
    if (!courseId) {
      const { data: defaultCourse } = await supabase
        .from('courses')
        .select('course_id')
        .limit(1)
        .maybeSingle()
      courseId = defaultCourse?.course_id || null
    }

    // 2. Find user in auth or profiles by email
    const { data: userList } = await supabase.auth.admin.listUsers()
    const matchedUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === sale.email.toLowerCase()
    )

    if (matchedUser && courseId) {
      // User already has an account -> Activate course enrollment immediately
      const { error: enrollErr } = await supabase
        .from('course_enrollments')
        .upsert(
          {
            student_id: matchedUser.id,
            course_id: courseId,
            status: 'active',
            enrolled_at: new Date().toISOString(),
          },
          { onConflict: 'student_id,course_id' }
        )

      if (enrollErr) {
        console.error('Gumroad Webhook: course_enrollments activation error:', enrollErr)
      }

      // Also upsert enrollments if table exists
      try {
        await supabase
          .from('enrollments')
          .upsert(
            {
              user_id: matchedUser.id,
              course_id: courseId,
              status: 'active',
              enrolled_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,course_id' }
          )
      } catch {
        // Non-fatal if table doesn't exist
      }

      // Mark pending enrollment as approved
      await supabase
        .from('pending_enrollments')
        .update({
          status: 'approved',
          transaction_reference: sale.saleId,
          updated_at: new Date().toISOString(),
        })
        .eq('email', sale.email.toLowerCase())
    } else {
      // User hasn't registered yet or courseId pending -> record approved pending enrollment
      await supabase.from('pending_enrollments').upsert(
        {
          email: sale.email.toLowerCase(),
          course_id: courseId,
          status: 'approved',
          payment_method: 'gumroad',
          transaction_reference: sale.saleId,
          amount: sale.price > 100 ? sale.price / 100 : sale.price,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email,course_id' }
      )
    }

    // 3. Log transaction
    try {
      await supabase
        .from('transactions')
        .insert({
          user_id: matchedUser?.id || null,
          course_id: courseId,
          amount: sale.price > 100 ? sale.price / 100 : sale.price,
          currency: sale.currency || 'USD',
          payment_method: 'gumroad',
          payment_status: 'completed',
          external_tx_hash: sale.saleId,
          bill_number: sale.orderNumber || `GUM-${sale.saleId}`,
          completed_at: new Date().toISOString(),
        })
    } catch (txErr: any) {
      console.warn('Gumroad Webhook: transaction log non-fatal note:', txErr?.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Gumroad sale processed successfully',
      email: sale.email,
      saleId: sale.saleId,
      enrolled: Boolean(matchedUser && courseId),
    })
  } catch (err: any) {
    console.error('Gumroad Webhook unexpected error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error processing Gumroad webhook' },
      { status: 500 }
    )
  }
}

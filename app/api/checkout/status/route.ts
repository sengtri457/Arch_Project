import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const billNumber = searchParams.get('billNumber')

    if (!billNumber) {
      return NextResponse.json({ error: 'Missing billNumber parameter' }, { status: 400 })
    }

    // 1. Initialize Supabase Admin client to write changes safely
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

    // 2. Query transaction status
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('bill_number', billNumber)
      .single()

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 })
    }

    // If transaction is already completed, return success immediately
    if (transaction.payment_status === 'completed') {
      return NextResponse.json({ success: true, status: 'completed' })
    }

    let isPaid = false
    let externalTxHash = ''

    // 3. Verify directly with the Bakong OpenAPI (using MD5 hash check)
    const bakongApiUrl = process.env.BAKONG_API_URL
    const accessToken = process.env.BAKONG_ACCESS_TOKEN

    if (bakongApiUrl && accessToken && transaction.khqr_payload) {
      try {
        const crypto = await import('crypto')
        const md5Hash = crypto.createHash('md5').update(transaction.khqr_payload).digest('hex')
        
        console.log(`Checking Bakong transaction for MD5 hash: ${md5Hash} (Bill: ${billNumber}) at URL: ${bakongApiUrl}/v1/check_transaction_by_md5`)
        
        const response = await fetch(`${bakongApiUrl}/v1/check_transaction_by_md5`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ md5: md5Hash })
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`Bakong API verification check response for MD5 ${md5Hash}:`, result)
          
          // Bakong returns responseCode: 0 if transaction is paid and verified
          if (result.responseCode === 0 && result.data) {
            isPaid = true
            externalTxHash = result.data.hash || result.data.transactionHash || ''
          }
        }
      } catch (apiErr) {
        console.warn("Outbound Bakong verification query failed:", apiErr)
      }
    }

    // 4. If confirmed paid, trigger the fulfillment process
    if (isPaid) {
      // A. Update transaction status
      const { error: updateError } = await supabaseAdmin
        .from('payment_transactions')
        .update({
          payment_status: 'completed',
          external_tx_hash: externalTxHash,
          completed_at: new Date().toISOString()
        })
        .eq('bill_number', billNumber)

      if (updateError) throw updateError

      // B. Activate Course Enrollment
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
        console.log(`Webhook-less: Successfully enrolled user ${transaction.user_id} in course ${transaction.course_id}`)
      }

      // C. Activate Plan Subscription
      if (transaction.plan_id) {
        const startDate = new Date()
        const endDate = new Date()
        endDate.setMonth(startDate.getMonth() + 1) // 1 month default

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
        console.log(`Webhook-less: Successfully subscribed user ${transaction.user_id} to plan ${transaction.plan_id}`)
      }

      // D. Upgrade profile role to student
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'student' })
        .eq('id', transaction.user_id)

      return NextResponse.json({ success: true, status: 'completed' })
    }

    // Default to database status (pending)
    return NextResponse.json({
      success: true,
      status: transaction.payment_status
    })

  } catch (err: any) {
    console.error("Status polling handler error:", err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

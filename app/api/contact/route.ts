import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/supabase/db'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const limiter = rateLimit(`contact:${getClientIp(request)}`, 3, 10 * 60_000)
  if (!limiter.ok) {
    return NextResponse.json(
      { error: 'Too many messages sent. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limiter.retryAfter) } }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
  }

  if (typeof body.company_website === 'string' && body.company_website.trim() !== '') {
    return NextResponse.json({ success: true })
  }

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const company = String(body.company ?? '').trim()
  const message = String(body.message ?? '').trim()
  const startedAt = Number(body.started_at ?? 0)

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 })
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 })
  }
  if (name.length > 200 || company.length > 200 || message.length > 5000) {
    return NextResponse.json({ error: 'Submitted content is too long' }, { status: 400 })
  }
  if (startedAt > 0 && Date.now() - startedAt < 2_000) {
    return NextResponse.json({ success: true })
  }

  const supabase = await createClient()
  const result = await db.submitContactMessage(supabase, {
    name,
    email,
    company: company || undefined,
    message
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

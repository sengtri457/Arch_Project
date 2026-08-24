import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getBunnyConfig, signBunnyHlsUrl, signBunnyMp4Url } from '@/lib/bunny'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const limiter = rateLimit(`lesson-video:${getClientIp(request)}`, 30, 60_000)
  if (!limiter.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limiter.retryAfter) } }
    )
  }

  const { lessonId } = await params
  if (!lessonId || !/^[0-9a-f-]{36}$/i.test(lessonId)) {
    return NextResponse.json({ error: 'Invalid lesson id' }, { status: 400 })
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

  const { data, error } = await supabase.rpc('get_lesson_video', {
    p_lesson_id: lessonId
  })

  if (error) {
    console.error('get_lesson_video rpc failed:', error.message)
    return NextResponse.json({ error: 'Failed to resolve video access' }, { status: 500 })
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row || !row.video_url) {
    return NextResponse.json({ error: 'Video not available for this lesson' }, { status: 404 })
  }

  const source = String(row.video_source ?? 'direct')

  if (source !== 'bunny') {
    return NextResponse.json({ success: true, source, url: row.video_url })
  }

  const config = getBunnyConfig()
  if (!config) {
    console.error('Bunny Stream env vars missing: BUNNY_STREAM_PULL_ZONE_HOST / BUNNY_STREAM_TOKEN_SECURITY_KEY')
    return NextResponse.json({ error: 'Video delivery is not configured' }, { status: 500 })
  }

  const clientIp = getClientIp(request)

  if (config.format === 'hls') {
    return NextResponse.json({
      success: true,
      source,
      format: 'hls',
      url: signBunnyHlsUrl(config, row.video_url, { clientIp })
    })
  }

  return NextResponse.json({
    success: true,
    source,
    format: 'direct',
    url: signBunnyMp4Url(config, row.video_url, { clientIp })
  })
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getBunnyConfig, signBunnyHlsUrl, signBunnyMp4Url, signBunnyEmbedUrl } from '@/lib/bunny'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { resolveLessonId } from '@/lib/courses-data'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const limiter = rateLimit(`lesson-video:${getClientIp(request)}`, 30, 60_000)
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfter) } }
      )
    }

  const { lessonId: rawLessonId } = await params
  const lessonId = resolveLessonId(rawLessonId)
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

  let row: any = null

  try {
    const { data, error } = await supabase.rpc('get_lesson_video', {
      p_lesson_id: lessonId
    })
    if (!error && data) {
      row = Array.isArray(data) ? data[0] : data
    } else if (error) {
      console.warn('get_lesson_video rpc notice (falling back to direct query):', error.message)
    }
  } catch (rpcErr) {
    console.warn('get_lesson_video rpc exception (falling back to direct query):', rpcErr)
  }

  if (!row || !row.video_url) {
    const { createClient } = await import('@supabase/supabase-js')
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { data: lessonRow } = await serviceClient
      .from('lessons')
      .select('lesson_id, course_id, title, video_source_type, video_external_id, is_preview')
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (lessonRow && lessonRow.video_external_id) {
      if (lessonRow.is_preview) {
        row = {
          video_source: lessonRow.video_source_type,
          video_url: lessonRow.video_external_id
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await serviceClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

          if (profile?.role === 'admin' || profile?.role === 'instructor') {
            row = {
              video_source: lessonRow.video_source_type,
              video_url: lessonRow.video_external_id
            }
          } else {
            const { data: enrollment } = await serviceClient
              .from('course_enrollments')
              .select('status')
              .eq('student_id', user.id)
              .eq('course_id', lessonRow.course_id)
              .eq('status', 'active')
              .maybeSingle()

            if (enrollment) {
              row = {
                video_source: lessonRow.video_source_type,
                video_url: lessonRow.video_external_id
              }
            } else {
              const { data: sub } = await serviceClient
                .from('user_subscriptions')
                .select('plan_id, status, current_period_end')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .maybeSingle()

              if (sub && new Date(sub.current_period_end) > new Date()) {
                row = {
                  video_source: lessonRow.video_source_type,
                  video_url: lessonRow.video_external_id
                }
              }
            }
          }
        }
      }
    }
  }

  if (!row || !row.video_url) {
    return NextResponse.json({ error: 'Video not available for this lesson' }, { status: 404 })
  }

  const source = String(row.video_source ?? 'direct')
  const rawVideoUrl = String(row.video_url || '').trim()

  // Auto-resolve LIBRARY_ID/VIDEO_ID or LIBRARY_ID:VIDEO_ID strings (e.g. "758923/984df13a-39a6-43e0-a78a-35520feab012")
  if (/^\d+[\/:][0-9a-f-]{36}$/i.test(rawVideoUrl)) {
    const formatted = rawVideoUrl.replace(':', '/')
    const [libId, vidId] = formatted.split('/')
    const tokenSecurityKey = process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY?.trim()
    const finalUrl = tokenSecurityKey 
      ? signBunnyEmbedUrl(libId, vidId, tokenSecurityKey)
      : `https://iframe.mediadelivery.net/embed/${formatted}`

    return NextResponse.json({
      success: true,
      source: 'bunny',
      format: 'direct',
      url: finalUrl
    })
  }

  if (source !== 'bunny' || (rawVideoUrl.startsWith('http://') || rawVideoUrl.startsWith('https://'))) {
    return NextResponse.json({ success: true, source: 'direct', format: 'direct', url: rawVideoUrl })
  }

  const config = getBunnyConfig()
  if (!config) {
    console.error('Bunny Stream env vars missing: BUNNY_STREAM_PULL_ZONE_HOST / BUNNY_STREAM_TOKEN_SECURITY_KEY')
    return NextResponse.json({ error: 'Video delivery is not configured' }, { status: 500 })
  }

  const clientIp = getClientIp(request)

  if (config.format === 'embed' && (config.libraryId || row.video_url?.includes('/') || row.video_url?.includes(':'))) {
    const { signBunnyEmbedUrl } = await import('@/lib/bunny')
    return NextResponse.json({
      success: true,
      source,
      format: 'direct',
      url: signBunnyEmbedUrl(config.libraryId || '', row.video_url, config.tokenSecurityKey, config.ttlSeconds)
    })
  }

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
  } catch (err: any) {
    console.error('Unhandled error in lesson video API route:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to process video stream request' },
      { status: 500 }
    )
  }
}

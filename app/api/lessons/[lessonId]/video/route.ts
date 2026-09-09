import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getBunnyConfig, signBunnyHlsUrl, signBunnyMp4Url } from '@/lib/bunny'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { resolveLessonId } from '@/lib/courses-data'

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

  const { data, error } = await supabase.rpc('get_lesson_video', {
    p_lesson_id: lessonId
  })

  if (error) {
    console.error('get_lesson_video rpc failed:', error.message)
    return NextResponse.json({ error: 'Failed to resolve video access' }, { status: 500 })
  }

  let row = Array.isArray(data) ? data[0] : data

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

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getBunnyConfig, signBunnyHlsUrl, signBunnyMp4Url, signBunnyEmbedUrl } from '@/lib/bunny'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { resolveLessonId } from '@/lib/courses-data'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const clientIp = getClientIp(request)
    const limiter = rateLimit(`lesson-video:${clientIp}`, 30, 60_000)
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

    // Retrieve authenticated user from session
    const { data: { user } } = await supabase.auth.getUser()

    let row: { video_source: string; video_url: string; is_preview?: boolean } | null = null

    // 1. Attempt PostgreSQL RPC (SECURITY DEFINER verifies enrollment/preview inside DB)
    try {
      const { data, error } = await supabase.rpc('get_lesson_video', {
        p_lesson_id: lessonId
      })
      if (!error && data) {
        const r = Array.isArray(data) ? data[0] : data
        if (r && r.video_url) {
          row = {
            video_source: r.video_source || 'direct',
            video_url: r.video_url,
            is_preview: Boolean(r.is_preview)
          }
        }
      } else if (error) {
        console.warn('get_lesson_video RPC notice (falling back to direct verification):', error.message)
      }
    } catch (rpcErr) {
      console.warn('get_lesson_video RPC exception (falling back to direct verification):', rpcErr)
    }

    const serviceClient = getServiceClient()

    // 2. Fallback: Direct database query & entitlement verification
    if (!row || !row.video_url) {
      const { data: lessonRow } = await serviceClient
        .from('lessons')
        .select('lesson_id, course_id, title, video_source_type, video_external_id, is_preview')
        .eq('lesson_id', lessonId)
        .maybeSingle()

      if (!lessonRow || !lessonRow.video_external_id) {
        return NextResponse.json({ error: 'Video not available for this lesson' }, { status: 404 })
      }

      if (lessonRow.is_preview) {
        row = {
          video_source: lessonRow.video_source_type,
          video_url: lessonRow.video_external_id,
          is_preview: true
        }
      } else {
        if (!user) {
          return NextResponse.json(
            { error: 'Authentication required for protected video playback' },
            { status: 401 }
          )
        }

        const { data: profile } = await serviceClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        const isStaff = profile?.role === 'admin' || profile?.role === 'instructor'

        if (isStaff) {
          row = {
            video_source: lessonRow.video_source_type,
            video_url: lessonRow.video_external_id,
            is_preview: false
          }
        } else {
          // Check Course Enrollment
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
              video_url: lessonRow.video_external_id,
              is_preview: false
            }
          } else {
            // Check Active Subscription
            const { data: sub } = await serviceClient
              .from('user_subscriptions')
              .select('plan_id, status, current_period_end')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .maybeSingle()

            if (sub && new Date(sub.current_period_end) > new Date()) {
              row = {
                video_source: lessonRow.video_source_type,
                video_url: lessonRow.video_external_id,
                is_preview: false
              }
            }
          }
        }
      }
    }

    if (!row || !row.video_url) {
      return NextResponse.json({ error: 'Access denied: Active course enrollment or subscription required' }, { status: 403 })
    }

    // 3. Anti-Piracy Device Limiting & Concurrency Enforcement
    if (user) {
      const rawDeviceId = request.headers.get('x-device-id')?.trim()
      const rawDeviceName = request.headers.get('x-device-name')?.trim() || 'Workstation / Browser'
      const userAgent = request.headers.get('user-agent') || ''

      const deviceId = rawDeviceId && /^[0-9a-zA-Z_-]{8,64}$/.test(rawDeviceId)
        ? rawDeviceId
        : `dev-${user.id.slice(0, 8)}`

      try {
        const { data: deviceResult, error: deviceError } = await serviceClient.rpc('enforce_device_session', {
          p_user_id: user.id,
          p_device_id: deviceId,
          p_device_name: rawDeviceName.slice(0, 100),
          p_ip_address: clientIp,
          p_user_agent: userAgent.slice(0, 255),
          p_max_devices: 2
        })

        if (deviceError) {
          console.warn('Device session enforcement warning:', deviceError.message)
        } else if (deviceResult && deviceResult.allowed === false) {
          return NextResponse.json(
            { error: 'Device limit exceeded: You have reached the maximum allowed active devices.', code: 'DEVICE_LIMIT_EXCEEDED' },
            { status: 403 }
          )
        }
      } catch (err: any) {
        console.warn('Device session verification skipped on RPC failure:', err?.message)
      }
    }

    const source = String(row.video_source ?? 'direct')
    const rawVideoUrl = String(row.video_url || '').trim()

    // 4. Auto-resolve LIBRARY_ID/VIDEO_ID or LIBRARY_ID:VIDEO_ID strings
    if (/^\d+[\/:][0-9a-f-]{36}$/i.test(rawVideoUrl)) {
      const formatted = rawVideoUrl.replace(':', '/')
      const [libId, vidId] = formatted.split('/')
      const finalUrl = signBunnyEmbedUrl(libId, vidId)

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

    if (config.format === 'embed' && (config.libraryId || row.video_url?.includes('/') || row.video_url?.includes(':'))) {
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

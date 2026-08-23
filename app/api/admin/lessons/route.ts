import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

async function requireAdmin() {
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

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return null
  return user
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')

  const supabase = serviceClient()
  let query = supabase.from('lessons').select('*').order('order_index', { ascending: true })
  if (courseId) {
    query = query.eq('course_id', courseId)
  }

  const { data, error } = await query
  if (error) {
    console.error('Admin lessons fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
  }

  return NextResponse.json({ success: true, lessons: data })
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
  }

  const title = String(body.title ?? '').trim()
  const courseId = String(body.course_id ?? '').trim()
  if (!title || !courseId) {
    return NextResponse.json({ error: 'title and course_id are required' }, { status: 400 })
  }
  if (title.length > 200) {
    return NextResponse.json({ error: 'Lesson title is too long' }, { status: 400 })
  }

  const sourceType = String(body.video_source_type ?? 'direct')
  if (!['direct', 'bunny'].includes(sourceType)) {
    return NextResponse.json({ error: 'Unsupported video source type' }, { status: 400 })
  }

  const videoExternalId = String(body.video_external_id ?? '').trim()
  if (videoExternalId.length > 500) {
    return NextResponse.json({ error: 'Video URL/ID is too long' }, { status: 400 })
  }
  if (sourceType === 'bunny' && !/^[0-9a-f-]{36}$/i.test(videoExternalId)) {
    return NextResponse.json({ error: 'Bunny source requires a valid video ID (GUID)' }, { status: 400 })
  }

  const durationMinutes = Math.min(600, Math.max(0, Math.round(Number(body.duration_minutes ?? 10))))
  const orderIndex = Math.min(500, Math.max(1, Math.round(Number(body.order_index ?? 1))))
  if (Number.isNaN(durationMinutes) || Number.isNaN(orderIndex)) {
    return NextResponse.json({ error: 'Invalid duration or order index' }, { status: 400 })
  }

  const payload = {
    lesson_id: typeof body.lesson_id === 'string' && body.lesson_id ? body.lesson_id : undefined,
    course_id: courseId,
    title,
    video_source_type: sourceType,
    video_external_id: videoExternalId,
    duration_minutes: durationMinutes,
    order_index: orderIndex,
    is_preview: Boolean(body.is_preview ?? false)
  }

  const supabase = serviceClient()

  if (payload.lesson_id) {
    const lessonId = payload.lesson_id
    delete payload.lesson_id
    const { error } = await supabase
      .from('lessons')
      .update(payload)
      .eq('lesson_id', lessonId)

    if (error) {
      console.error('Admin lesson update failed:', error)
      return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  const { error } = await supabase.from('lessons').insert(payload)
  if (error) {
    console.error('Admin lesson insert failed:', error)
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get('lessonId')
  if (!lessonId) {
    return NextResponse.json({ error: 'Missing lessonId parameter' }, { status: 400 })
  }

  const supabase = serviceClient()
  const { error } = await supabase.from('lessons').delete().eq('lesson_id', lessonId)

  if (error) {
    console.error('Admin lesson delete failed:', error)
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

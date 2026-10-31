import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { resolveCourseUuid, resolveLessonId } from '@/lib/courses-data'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

export async function POST(request: Request) {
  try {
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
            } catch {
              // Server component context
            }
          },
        },
      }
    )

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    const studentId = user?.id || body.userId

    if (!studentId || !isUUID(studentId)) {
      return NextResponse.json({ error: 'Valid authenticated student ID required' }, { status: 401 })
    }

    const rawCourseId = String(body.courseId || '').trim()
    const rawLessonId = String(body.lessonId || '').trim()
    const watchedSeconds = Math.max(0, Math.floor(Number(body.watchedSeconds) || 0))
    const isCompleted = Boolean(body.isCompleted)

    if (!rawCourseId || !rawLessonId) {
      return NextResponse.json({ error: 'courseId and lessonId are required' }, { status: 400 })
    }

    const serviceSupabase = getServiceClient()

    // 1. Resolve Course UUID
    let resolvedCourseId = rawCourseId
    if (!isUUID(rawCourseId)) {
      const { data: courseRow } = await serviceSupabase
        .from('courses')
        .select('course_id')
        .eq('slug', rawCourseId)
        .maybeSingle()

      if (courseRow?.course_id) {
        resolvedCourseId = courseRow.course_id
      } else {
        const mappedUuid = resolveCourseUuid(rawCourseId)
        if (isUUID(mappedUuid)) {
          resolvedCourseId = mappedUuid
        }
      }
    }

    // 2. Resolve Lesson UUID
    let resolvedLessonId = resolveLessonId(rawLessonId)
    if (!isUUID(resolvedLessonId)) {
      const { data: lessonRow } = await serviceSupabase
        .from('lessons')
        .select('lesson_id')
        .eq('course_id', resolvedCourseId)
        .eq('order_index', Number(rawLessonId) || 1)
        .maybeSingle()

      if (lessonRow?.lesson_id) {
        resolvedLessonId = lessonRow.lesson_id
      }
    }

    if (!isUUID(resolvedCourseId) || !isUUID(resolvedLessonId)) {
      return NextResponse.json({
        error: 'Unable to resolve course or lesson to valid UUIDs',
        details: { courseId: resolvedCourseId, lessonId: resolvedLessonId }
      }, { status: 400 })
    }

    // 3. Ensure lesson exists or associate properly
    const { data: existingLesson } = await serviceSupabase
      .from('lessons')
      .select('lesson_id, course_id')
      .eq('lesson_id', resolvedLessonId)
      .maybeSingle()

    // If lesson exists in DB, ensure course_id matches the lesson's actual course_id
    if (existingLesson?.course_id) {
      resolvedCourseId = existingLesson.course_id
    }

    // 4. Upsert progress via Service Role client (bypasses restrictive RLS)
    const upsertPayload: Record<string, any> = {
      student_id: studentId,
      course_id: resolvedCourseId,
      lesson_id: resolvedLessonId,
      watched_seconds: watchedSeconds,
      is_completed: isCompleted,
      last_watched_at: new Date().toISOString()
    }

    if (isCompleted) {
      upsertPayload.completed_at = new Date().toISOString()
    }

    const { data, error } = await serviceSupabase
      .from('lesson_progress')
      .upsert(upsertPayload, { onConflict: 'student_id,lesson_id' })
      .select()

    if (error) {
      console.error('[Classroom Progress API] Upsert failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data?.[0] || upsertPayload,
      watchedSeconds,
      isCompleted
    })
  } catch (err: any) {
    console.error('[Classroom Progress API] Exception:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

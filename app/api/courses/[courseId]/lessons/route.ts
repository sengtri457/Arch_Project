import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId: rawCourseId } = await params
    const identifier = decodeURIComponent(rawCourseId || '').trim()

    if (!identifier) {
      return NextResponse.json({ error: 'Course identifier is required' }, { status: 400 })
    }

    const supabase = serviceClient()

    let targetCourseId = identifier

    // If identifier is not a UUID, resolve it as a course slug
    if (!/^[0-9a-f-]{36}$/i.test(identifier)) {
      const { data: courseRow } = await supabase
        .from('courses')
        .select('course_id')
        .eq('slug', identifier)
        .maybeSingle()

      if (courseRow?.course_id) {
        targetCourseId = courseRow.course_id
      }
    }

    // Fetch lessons for the resolved course ID (non-sensitive columns only)
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('lesson_id, course_id, title, duration_minutes, order_index, is_preview, thumbnail_url, downloadable_asset_url, video_external_id, video_source_type')
      .eq('course_id', targetCourseId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Failed to fetch course lessons from API:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(lessons || [])
  } catch (err: any) {
    console.error('Unexpected error in course lessons API:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

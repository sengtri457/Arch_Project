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
    .maybeSingle()

  if (!profile || !['admin', 'instructor'].includes(profile.role)) return null
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
  let query = supabase.from('course_modules').select('*, lessons(*)').order('order_index', { ascending: true })
  if (courseId) {
    query = query.eq('course_id', courseId)
  }

  const { data, error } = await query
  if (error) {
    console.error('Admin modules fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 })
  }

  return NextResponse.json({ success: true, modules: data })
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

  const description = String(body.description ?? '').trim()
  const coverImageUrl = String(body.cover_image_url ?? '').trim()
  const orderIndex = Number(body.order_index ?? 1)
  const isPublished = body.is_published !== false

  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('course_modules')
    .insert({
      course_id: courseId,
      title,
      description: description || null,
      cover_image_url: coverImageUrl || null,
      order_index: orderIndex,
      is_published: isPublished
    })
    .select()
    .single()

  if (error) {
    console.error('Admin module create failed:', error)
    return NextResponse.json({ error: error.message || 'Failed to create module' }, { status: 500 })
  }

  // Handle binding lessons if selected_lesson_ids provided
  const selectedLessonIds = Array.isArray(body.selected_lesson_ids) ? body.selected_lesson_ids : []
  if (selectedLessonIds.length > 0 && data?.module_id) {
    await supabase
      .from('lessons')
      .update({ module_id: data.module_id })
      .in('lesson_id', selectedLessonIds)
  }

  return NextResponse.json({ success: true, module: data })
}

export async function PUT(request: Request) {
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

  const moduleId = String(body.module_id ?? '').trim()
  if (!moduleId) {
    return NextResponse.json({ error: 'module_id is required' }, { status: 400 })
  }

  const updatePayload: Record<string, any> = {}
  if (body.title !== undefined) updatePayload.title = String(body.title).trim()
  if (body.description !== undefined) updatePayload.description = String(body.description).trim()
  if (body.cover_image_url !== undefined) updatePayload.cover_image_url = String(body.cover_image_url).trim()
  if (body.order_index !== undefined) updatePayload.order_index = Number(body.order_index)
  if (body.is_published !== undefined) updatePayload.is_published = Boolean(body.is_published)

  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('course_modules')
    .update(updatePayload)
    .eq('module_id', moduleId)
    .select()
    .single()

  if (error) {
    console.error('Admin module update failed:', error)
    return NextResponse.json({ error: error.message || 'Failed to update module' }, { status: 500 })
  }

  if (Array.isArray(body.selected_lesson_ids)) {
    // Unassign previous lessons from this module
    await supabase
      .from('lessons')
      .update({ module_id: null })
      .eq('module_id', moduleId)

    // Assign new selected lessons to this module
    if (body.selected_lesson_ids.length > 0) {
      await supabase
        .from('lessons')
        .update({ module_id: moduleId })
        .in('lesson_id', body.selected_lesson_ids)
    }
  }

  return NextResponse.json({ success: true, module: data })
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const moduleId = searchParams.get('moduleId')
  if (!moduleId) {
    return NextResponse.json({ error: 'moduleId is required' }, { status: 400 })
  }

  const supabase = serviceClient()

  // 1. Unassign lessons from this module (set module_id = NULL)
  await supabase
    .from('lessons')
    .update({ module_id: null })
    .eq('module_id', moduleId)

  // 2. Delete module
  const { error } = await supabase
    .from('course_modules')
    .delete()
    .eq('module_id', moduleId)

  if (error) {
    console.error('Admin module delete failed:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete module' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

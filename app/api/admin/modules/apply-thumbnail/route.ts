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

async function handleApplyThumbnail(request: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const moduleId = typeof body.module_id === 'string' ? body.module_id.trim() : ''
  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : ''
  let coverImageUrl = typeof body.cover_image_url === 'string' ? body.cover_image_url.trim() : ''
  const overwrite = Boolean(body.overwrite ?? false)

  const supabase = serviceClient()

  // Helper to extract YouTube ID
  const extractYTId = (input: string) => {
    const trimmed = (input || '').trim()
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i)
    return match ? match[1] : null
  }

  // AUTO-APPLY FOR ALL MODULES IN A COURSE
  if (!moduleId && courseId) {
    const { data: modules, error: modFetchErr } = await supabase
      .from('course_modules')
      .select('module_id, title, cover_image_url')
      .eq('course_id', courseId)

    if (modFetchErr) {
      return NextResponse.json({ error: modFetchErr.message }, { status: 500 })
    }

    let appliedCount = 0
    for (const mod of modules || []) {
      let modCover = mod.cover_image_url
      if (!modCover || overwrite) {
        // Find first lesson with video/thumbnail
        const { data: firstLesson } = await supabase
          .from('lessons')
          .select('thumbnail_url, video_external_id')
          .eq('module_id', mod.module_id)
          .order('order_index', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (firstLesson) {
          const ytId = extractYTId(firstLesson.video_external_id || '')
          const derivedThumb = firstLesson.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)
          if (derivedThumb) {
            await supabase
              .from('course_modules')
              .update({ cover_image_url: derivedThumb })
              .eq('module_id', mod.module_id)
            modCover = derivedThumb
            appliedCount++
          }
        }
      }

      if (modCover) {
        // Also sync to child lessons missing thumbnail
        await supabase
          .from('lessons')
          .update({ thumbnail_url: modCover })
          .eq('module_id', mod.module_id)
          .or('thumbnail_url.is.null,thumbnail_url.eq.""')
      }
    }

    return NextResponse.json({
      success: true,
      course_id: courseId,
      message: `Automatically applied thumbnails across ${appliedCount} module(s) in course`
    })
  }

  if (!moduleId) {
    return NextResponse.json({ error: 'module_id or course_id is required' }, { status: 400 })
  }

  // SINGLE MODULE: If cover_image_url not passed, inspect course_modules or auto-derive from first lesson
  if (!coverImageUrl) {
    const { data: modData } = await supabase
      .from('course_modules')
      .select('cover_image_url')
      .eq('module_id', moduleId)
      .maybeSingle()

    if (modData?.cover_image_url) {
      coverImageUrl = modData.cover_image_url
    } else {
      // Auto-derive from first lesson assigned to this chapter/module
      const { data: firstLesson } = await supabase
        .from('lessons')
        .select('thumbnail_url, video_external_id')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (firstLesson) {
        const ytId = extractYTId(firstLesson.video_external_id || '')
        coverImageUrl = firstLesson.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '')
      }

      if (!coverImageUrl) {
        return NextResponse.json({
          error: 'No cover_image_url found for this module, and no lessons with video found to auto-derive from.'
        }, { status: 400 })
      }

      // Persist the derived thumbnail to the module/chapter itself!
      await supabase
        .from('course_modules')
        .update({ cover_image_url: coverImageUrl })
        .eq('module_id', moduleId)
    }
  } else {
    // If coverImageUrl was explicitly provided, also save it on the module itself
    await supabase
      .from('course_modules')
      .update({ cover_image_url: coverImageUrl })
      .eq('module_id', moduleId)
  }

  // Update lessons in module
  let query = supabase
    .from('lessons')
    .update({ thumbnail_url: coverImageUrl })
    .eq('module_id', moduleId)

  if (!overwrite) {
    query = query.or('thumbnail_url.is.null,thumbnail_url.eq.""')
  }

  const { data, error } = await query.select('lesson_id')

  if (error) {
    console.error('Failed to apply module thumbnail to lessons:', error)
    return NextResponse.json({ error: error.message || 'Failed to update lessons' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    module_id: moduleId,
    thumbnail_url: coverImageUrl,
    updated_count: data ? data.length : 0,
    message: `Applied chapter thumbnail (${coverImageUrl}) to chapter and ${data ? data.length : 0} lesson(s)`
  })
}

export async function PUT(request: Request) {
  return handleApplyThumbnail(request)
}

export async function POST(request: Request) {
  return handleApplyThumbnail(request)
}


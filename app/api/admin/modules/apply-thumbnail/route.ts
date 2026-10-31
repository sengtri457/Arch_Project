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
  let coverImageUrl = typeof body.cover_image_url === 'string' ? body.cover_image_url.trim() : ''
  const overwrite = Boolean(body.overwrite ?? false)

  if (!moduleId) {
    return NextResponse.json({ error: 'module_id is required' }, { status: 400 })
  }

  const supabase = serviceClient()

  // If cover_image_url not passed, lookup from course_modules
  if (!coverImageUrl) {
    const { data: modData, error: modErr } = await supabase
      .from('course_modules')
      .select('cover_image_url')
      .eq('module_id', moduleId)
      .maybeSingle()

    if (modErr || !modData?.cover_image_url) {
      return NextResponse.json({
        error: 'No cover_image_url found for this module. Please specify one.'
      }, { status: 400 })
    }

    coverImageUrl = modData.cover_image_url
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
    message: `Applied cover image to ${data ? data.length : 0} lesson(s)`
  })
}

export async function PUT(request: Request) {
  return handleApplyThumbnail(request)
}

export async function POST(request: Request) {
  return handleApplyThumbnail(request)
}


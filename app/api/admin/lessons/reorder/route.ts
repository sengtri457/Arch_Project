import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

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

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin or instructor privileges required' }, { status: 403 })
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 })
    }

    const updates = Array.isArray(body) ? body : body?.updates
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Missing or empty updates array' }, { status: 400 })
    }

    // Validate payload items
    const sanitizedUpdates: Array<{ lesson_id: string; order_index: number; module_id?: string | null }> = []
    for (const item of updates) {
      const rawLessonId = String(item.lesson_id ?? '').trim()
      const rawOrderIndex = Number(item.order_index)

      if (!rawLessonId || !isUUID(rawLessonId)) {
        return NextResponse.json({ error: `Invalid lesson_id: "${rawLessonId}" must be a valid UUID` }, { status: 400 })
      }

      if (Number.isNaN(rawOrderIndex) || rawOrderIndex < 1) {
        return NextResponse.json({ error: `Invalid order_index for lesson "${rawLessonId}"` }, { status: 400 })
      }

      const entry: { lesson_id: string; order_index: number; module_id?: string | null } = {
        lesson_id: rawLessonId,
        order_index: Math.round(rawOrderIndex)
      }

      if (item.module_id !== undefined) {
        const rawModuleId = String(item.module_id ?? '').trim()
        entry.module_id = rawModuleId && isUUID(rawModuleId) ? rawModuleId : null
      }

      sanitizedUpdates.push(entry)
    }

    const supabase = serviceClient()

    // 1. Try batch reorder RPC
    const { error: rpcErr } = await supabase.rpc('batch_reorder_lessons', {
      p_updates: sanitizedUpdates
    })

    if (rpcErr) {
      console.warn('batch_reorder_lessons RPC notice (falling back to direct updates):', rpcErr.message)
      // Fallback: execute updates sequentially via service client
      for (const update of sanitizedUpdates) {
        const updatePayload: Record<string, any> = { order_index: update.order_index }
        if (update.module_id !== undefined) {
          updatePayload.module_id = update.module_id
        }

        const { error: singleErr } = await supabase
          .from('lessons')
          .update(updatePayload)
          .eq('lesson_id', update.lesson_id)

        if (singleErr) {
          console.error(`Failed to reorder lesson ${update.lesson_id}:`, singleErr)
          return NextResponse.json({ error: `Failed to reorder lesson ${update.lesson_id}: ${singleErr.message}` }, { status: 500 })
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: sanitizedUpdates.length,
      message: `Successfully reordered ${sanitizedUpdates.length} lessons`
    })
  } catch (err: any) {
    console.error('Unhandled error in lessons reorder route:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

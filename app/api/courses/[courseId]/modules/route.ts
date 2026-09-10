import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { d5Modules } from '@/lib/courses-data'

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

    const isD5 = identifier === 'd4a1b756-12d4-4047-93bd-8b58b94cb146' ||
      identifier === 'd5c66d93-3d02-466d-a77b-6c6a46cd4cf7' ||
      identifier === 'd5-masterclass' ||
      identifier.toLowerCase().includes('d5')

    const supabase = serviceClient()

    // Try get_course_modules RPC function
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_course_modules', { p_slug: identifier })
      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        return NextResponse.json(rpcData)
      }
    } catch {}

    if (isD5) {
      return NextResponse.json(d5Modules)
    }

    return NextResponse.json([])
  } catch (err: any) {
    console.error('Unexpected error in course modules API:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

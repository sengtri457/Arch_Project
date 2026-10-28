import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const videoIdOrUrl = searchParams.get('url')?.trim() || ''
    const source = searchParams.get('source')?.trim() || 'direct'

    if (!videoIdOrUrl) {
      return NextResponse.json({ error: 'Video URL or ID required' }, { status: 400 })
    }

    // 1. Bunny Stream API
    if (source === 'bunny' || /^[0-9a-f-]{36}$/i.test(videoIdOrUrl) || /^\d+[\/:][0-9a-f-]{36}$/i.test(videoIdOrUrl)) {
      let vidId = videoIdOrUrl
      let libId = process.env.BUNNY_STREAM_LIBRARY_ID
      const apiKey = process.env.BUNNY_STREAM_API_KEY

      if (videoIdOrUrl.includes('/') || videoIdOrUrl.includes(':')) {
        const parts = videoIdOrUrl.replace(':', '/').split('/')
        libId = parts[0]
        vidId = parts[1]
      }

      if (libId && apiKey) {
        try {
          const res = await fetch(`https://video.bunnycdn.com/library/${libId}/videos/${vidId}`, {
            headers: {
              AccessKey: apiKey,
              Accept: 'application/json'
            }
          })

          if (res.ok) {
            const data = await res.json()
            const lengthSec = Number(data.length || 0)
            if (lengthSec > 0) {
              return NextResponse.json({
                success: true,
                duration_seconds: lengthSec,
                duration_minutes: Math.ceil(lengthSec / 60)
              })
            }
          }
        } catch (bunnyErr: any) {
          console.warn('Bunny API duration fetch notice:', bunnyErr.message)
        }
      }
    }

    // 2. YouTube detection
    if (videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be') || /^[a-zA-Z0-9_-]{11}$/.test(videoIdOrUrl)) {
      return NextResponse.json({
        success: true,
        source: 'youtube',
        message: 'YouTube video detected'
      })
    }

    return NextResponse.json({
      success: true,
      duration_seconds: 600,
      duration_minutes: 10,
      message: 'Default duration applied'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to detect duration' }, { status: 500 })
  }
}

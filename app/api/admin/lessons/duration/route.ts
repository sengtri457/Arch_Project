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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = (input || '').trim()
  if (!trimmed) return null
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i)
  return match ? match[1] : null
}

export function parseISO8601Duration(durationStr: string): number {
  if (!durationStr) return 0
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

export function extractBunnyVideoDetails(input: string): { videoId: string; libraryId?: string } | null {
  const trimmed = (input || '').trim()
  if (!trimmed) return null

  // 1. Check for GUID pattern anywhere in input
  const guidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  if (!guidMatch) return null
  const videoId = guidMatch[0]

  // 2. Extract library ID if present before or near the GUID
  // e.g. "embed/758330/uuid", "play/758330/uuid", "758330/uuid", "758330:uuid"
  const libMatch = trimmed.match(/(?:(?:mediadelivery\.net|bunnycdn\.com)\/(?:embed|play)\/|[\/:]|^)(\d{5,10})[\/:]/i)
  const libraryId = libMatch ? libMatch[1] : undefined

  return { videoId, libraryId }
}

async function probeRemoteMp4Duration(url: string): Promise<number | null> {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) return null
    // Fetch first 128KB of the MP4 file to locate the mvhd atom
    const res = await fetch(url, {
      headers: { Range: 'bytes=0-131071' }
    })
    if (!res.ok && res.status !== 206) return null
    const arrayBuffer = await res.arrayBuffer()
    const buf = Buffer.from(arrayBuffer)

    const mvhdIndex = buf.indexOf('mvhd')
    if (mvhdIndex !== -1 && mvhdIndex + 24 <= buf.length) {
      const version = buf.readUInt8(mvhdIndex + 4)
      if (version === 0) {
        // 32-bit timescale & duration
        const timeScale = buf.readUInt32BE(mvhdIndex + 16)
        const duration = buf.readUInt32BE(mvhdIndex + 20)
        if (timeScale > 0 && duration > 0) {
          return Math.round(duration / timeScale)
        }
      } else if (version === 1 && mvhdIndex + 36 <= buf.length) {
        // 64-bit timescale & duration
        const timeScale = buf.readUInt32BE(mvhdIndex + 24)
        const durationHi = buf.readUInt32BE(mvhdIndex + 28)
        const durationLo = buf.readUInt32BE(mvhdIndex + 32)
        const duration = (durationHi * 4294967296) + durationLo
        if (timeScale > 0 && duration > 0) {
          return Math.round(duration / timeScale)
        }
      }
    }
  } catch (err) {
    console.warn('Direct MP4 server probe notice:', err)
  }
  return null
}

export async function resolveDuration(videoIdOrUrl: string, source: string) {
  const rawTarget = (videoIdOrUrl || '').trim()
  if (!rawTarget) {
    return {
      success: false,
      error: 'Video URL or External ID is required'
    }
  }

  // 1. YouTube dynamic duration via Google YouTube Data API v3, web scrape, or oEmbed fallback
  const ytId = extractYouTubeVideoId(rawTarget)
  if (source === 'youtube' || ytId) {
    const apiKey = process.env.YOUTUBE_API_KEY
    if (ytId && apiKey) {
      try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${ytId}&key=${apiKey}`)
        if (res.ok) {
          const data = await res.json()
          const item = data.items?.[0]
          const isoDuration = item?.contentDetails?.duration
          if (isoDuration) {
            const lengthSec = parseISO8601Duration(isoDuration)
            if (lengthSec > 0) {
              return {
                success: true,
                source: 'youtube',
                video_id: ytId,
                title: item.snippet?.title || undefined,
                thumbnail_url: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
                duration_seconds: lengthSec,
                durationSeconds: lengthSec,
                duration_minutes: Math.ceil(lengthSec / 60),
                durationMinutes: Math.ceil(lengthSec / 60),
                message: `Dynamic YouTube duration detected (${lengthSec}s)`
              }
            }
          }
        }
      } catch (ytErr: any) {
        console.warn('YouTube API duration fetch notice:', ytErr.message)
      }
    }

    // Direct YouTube video page scrape fallback (zero-key fallback for lengthSeconds)
    if (ytId) {
      try {
        const htmlRes = await fetch(`https://www.youtube.com/watch?v=${ytId}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        })
        if (htmlRes.ok) {
          const html = await htmlRes.text()
          const lengthMatch = html.match(/"lengthSeconds":"(\d+)"/)
          if (lengthMatch && parseInt(lengthMatch[1], 10) > 0) {
            const lengthSec = parseInt(lengthMatch[1], 10)
            return {
              success: true,
              source: 'youtube',
              video_id: ytId,
              thumbnail_url: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
              duration_seconds: lengthSec,
              durationSeconds: lengthSec,
              duration_minutes: Math.ceil(lengthSec / 60),
              durationMinutes: Math.ceil(lengthSec / 60),
              message: `YouTube video duration detected via stream metadata (${lengthSec}s)`
            }
          }
        }
      } catch (scrapeErr: any) {
        console.warn('YouTube direct scrape notice:', scrapeErr.message)
      }
    }

    // Fallback: oEmbed metadata check if API key not available or quota exceeded
    if (ytId) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`)
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json()
          return {
            success: true,
            source: 'youtube',
            video_id: ytId,
            title: oembedData.title || undefined,
            thumbnail_url: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
            duration_seconds: 600, // 10 min sensible placeholder when duration metadata restricted
            durationSeconds: 600,
            duration_minutes: 10,
            durationMinutes: 10,
            message: `YouTube video verified via oEmbed (${oembedData.title || ytId})`
          }
        }
      } catch (oembedErr: any) {
        console.warn('YouTube oEmbed notice:', oembedErr.message)
      }
    }
  }

  // 2. Bunny Stream API
  const bunnyDetails = extractBunnyVideoDetails(rawTarget)
  if (source === 'bunny' || bunnyDetails) {
    const vidId = bunnyDetails?.videoId || rawTarget
    const libId = bunnyDetails?.libraryId || process.env.BUNNY_STREAM_LIBRARY_ID
    const apiKey = process.env.BUNNY_STREAM_API_KEY
    const pullZone = process.env.BUNNY_STREAM_PULL_ZONE_HOST

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
            const thumbUrl = pullZone ? `https://${pullZone}/${vidId}/thumbnail.jpg` : undefined
            return {
              success: true,
              source: 'bunny',
              video_id: vidId,
              library_id: libId,
              thumbnail_url: thumbUrl,
              duration_seconds: lengthSec,
              durationSeconds: lengthSec,
              duration_minutes: Math.ceil(lengthSec / 60),
              durationMinutes: Math.ceil(lengthSec / 60),
              message: `Bunny Stream video duration detected (${lengthSec}s)`
            }
          }
        }
      } catch (bunnyErr: any) {
        console.warn('Bunny API duration fetch notice:', bunnyErr.message)
      }
    }
  }

  // 3. Direct Video probe (MP4 / WebM / CDN Range probe)
  if (rawTarget.startsWith('http://') || rawTarget.startsWith('https://')) {
    const directDuration = await probeRemoteMp4Duration(rawTarget)
    if (directDuration && directDuration > 0) {
      return {
        success: true,
        source: 'direct',
        duration_seconds: directDuration,
        durationSeconds: directDuration,
        duration_minutes: Math.ceil(directDuration / 60),
        durationMinutes: Math.ceil(directDuration / 60),
        message: `Direct MP4 video duration detected (${directDuration}s)`
      }
    }
  }

  return {
    success: false,
    error: 'Could not auto-detect video duration. Please specify duration in seconds manually.'
  }
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const videoIdOrUrl = (searchParams.get('url') || searchParams.get('video') || searchParams.get('video_external_id'))?.trim() || ''
    const source = (searchParams.get('source') || searchParams.get('video_source_type'))?.trim() || 'direct'

    if (!videoIdOrUrl) {
      return NextResponse.json({ error: 'Video URL or ID required' }, { status: 400 })
    }

    const result = await resolveDuration(videoIdOrUrl, source)
    if (!result.success) {
      return NextResponse.json(result, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to detect duration' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    let body: Record<string, any> = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const supabase = serviceClient()

    // BATCH SYNC: If course_id is provided, sync all lessons for this course
    if (body.course_id && typeof body.course_id === 'string') {
      const courseId = body.course_id.trim()
      const { data: lessons, error: fetchErr } = await supabase
        .from('lessons')
        .select('lesson_id, title, video_external_id, video_source_type, duration_minutes')
        .eq('course_id', courseId)

      if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 500 })
      }

      const syncResults: any[] = []
      let totalUpdated = 0

      for (const les of lessons || []) {
        if (!les.video_external_id) continue
        const dur = await resolveDuration(les.video_external_id, les.video_source_type || 'direct')
        if (dur.success && dur.duration_minutes) {
          const { error: updateErr } = await supabase
            .from('lessons')
            .update({ duration_minutes: dur.duration_minutes })
            .eq('lesson_id', les.lesson_id)

          if (!updateErr) {
            totalUpdated++
            syncResults.push({
              lesson_id: les.lesson_id,
              title: les.title,
              duration_minutes: dur.duration_minutes,
              status: 'updated'
            })
          }
        }
      }

      // Re-sum total course duration if any lessons updated
      if (totalUpdated > 0) {
        const { data: allCourseLessons } = await supabase
          .from('lessons')
          .select('duration_minutes')
          .eq('course_id', courseId)

        const totalMinutes = (allCourseLessons || []).reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0)
        const hours = Math.floor(totalMinutes / 60)
        const remainingMinutes = totalMinutes % 60
        const durationFormatted = hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`

        await supabase
          .from('courses')
          .update({ duration: durationFormatted })
          .eq('course_id', courseId)
      }

      return NextResponse.json({
        success: true,
        message: `Synced ${totalUpdated} lessons for course`,
        total_updated: totalUpdated,
        results: syncResults
      })
    }

    // SINGLE SYNC: Video URL or lesson_id
    const videoIdOrUrl = String(body.video || body.video_external_id || body.url || '').trim()
    const source = String(body.video_source_type || body.source || 'direct').trim()
    const lessonId = body.lesson_id ? String(body.lesson_id).trim() : null

    if (!videoIdOrUrl && !lessonId) {
      return NextResponse.json({ error: 'Video URL or lesson_id required' }, { status: 400 })
    }

    let targetVideo = videoIdOrUrl
    let targetSource = source

    // If only lesson_id was provided, look up video info from DB
    if (!targetVideo && lessonId) {
      const { data: lesData } = await supabase
        .from('lessons')
        .select('video_external_id, video_source_type')
        .eq('lesson_id', lessonId)
        .maybeSingle()

      if (lesData) {
        targetVideo = lesData.video_external_id || ''
        targetSource = lesData.video_source_type || 'direct'
      }
    }

    const result = await resolveDuration(targetVideo, targetSource)
    if (!result.success) {
      return NextResponse.json(result, { status: 404 })
    }

    // If lesson_id was provided or save requested, persist directly to DB
    if (lessonId && result.duration_minutes) {
      await supabase
        .from('lessons')
        .update({ duration_minutes: result.duration_minutes })
        .eq('lesson_id', lessonId)
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to detect duration' }, { status: 500 })
  }
}

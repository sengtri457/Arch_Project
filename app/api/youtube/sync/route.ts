import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Extractor helper to parse YouTube channel ID from handle page
function parseChannelId(html: string): string | null {
  const metaMatch = html.match(/itemprop="channelId"\s+content="(UC[a-zA-Z0-9_-]{22})"/i)
  if (metaMatch) return metaMatch[1]

  const jsonMatch = html.match(/"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/i)
  if (jsonMatch) return jsonMatch[1]

  const generalMatch = html.match(/(UC[a-zA-Z0-9_-]{22})/i)
  if (generalMatch) return generalMatch[1]

  return null
}

export async function POST(request: Request) {
  // 1. Authorize Admin user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Sign in required.' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 401 })
  }

  // 2. Load settings
  const apiKey = process.env.YOUTUBE_API_KEY
  const channelHandle = process.env.YOUTUBE_CHANNEL_HANDLE || '@ArchTipsbox-x7h'

  if (!apiKey) {
    return NextResponse.json({ 
      error: 'YouTube API Key is not configured. Please define YOUTUBE_API_KEY in your server environment.' 
    }, { status: 400 })
  }

  try {
    // 3. Resolve Handle to Uploads Playlist ID using YouTube API v3 (forHandle)
    // Strip '@' if it exists since YouTube API handles handles either way, but we encode it properly
    const cleanHandle = channelHandle.startsWith('@') ? channelHandle.substring(1) : channelHandle
    const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,contentDetails&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`
    
    const channelsRes = await fetch(channelsUrl)
    if (!channelsRes.ok) {
      const errJson = await channelsRes.json().catch(() => ({}))
      return NextResponse.json({ 
        error: errJson.error?.message || `YouTube API channels.list failed with status ${channelsRes.status}` 
      }, { status: 400 })
    }

    const channelsData = await channelsRes.json()
    if (!channelsData.items || channelsData.items.length === 0) {
      return NextResponse.json({ 
        error: `Could not find YouTube Channel for handle: ${channelHandle}. Make sure the handle is spelled correctly in your .env settings.` 
      }, { status: 400 })
    }

    const channelItem = channelsData.items[0]
    const uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      return NextResponse.json({ 
        error: `Uploads playlist not found for channel handle ${channelHandle}.` 
      }, { status: 400 })
    }

    // 4. Paginate and retrieve all playlist items from YouTube API v3
    let pageToken = ''
    let fetchedVideos = []
    let hasMore = true
    let limitCounter = 0 // Safety break to prevent infinite loops

    while (hasMore && limitCounter < 20) {
      limitCounter++
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`
      const apiRes = await fetch(url)
      
      if (!apiRes.ok) {
        const errJson = await apiRes.json().catch(() => ({}))
        return NextResponse.json({ 
          error: errJson.error?.message || `YouTube API returned error code ${apiRes.status}` 
        }, { status: 400 })
      }

      const data = await apiRes.json()
      if (!data.items || data.items.length === 0) {
        break
      }

      for (const item of data.items) {
        const videoId = item.snippet?.resourceId?.videoId
        const title = item.snippet?.title || ''
        const description = item.snippet?.description || ''
        const publishedAt = item.snippet?.publishedAt || new Date().toISOString()
        
        // Skip private or deleted videos (which have no valid resource ID or display placeholder titles)
        if (!videoId || title === 'Private video' || title === 'Deleted video') {
          continue
        }

        // Smart Category Tagging
        let category = 'Other'
        const titleLower = title.toLowerCase()
        if (titleLower.includes('photoshop')) {
          category = 'Photoshop'
        } else if (titleLower.includes('d5')) {
          category = 'D5 Render'
        } else if (titleLower.includes('lumion')) {
          category = 'Lumion'
        } else if (titleLower.includes('enscape')) {
          category = 'Enscape'
        } else if (titleLower.includes('portfolio') || titleLower.includes('cv') || titleLower.includes('resume')) {
          category = 'Portfolio Tips'
        }

        fetchedVideos.push({
          video_id: videoId,
          title,
          description,
          category,
          published_at: publishedAt
        })
      }

      pageToken = data.nextPageToken
      hasMore = !!pageToken
    }

    if (fetchedVideos.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No public videos found on the channel.' })
    }

    // 5. Bulk upsert into Supabase (will update titles/descriptions and insert new videos)
    const { error: upsertError } = await supabase
      .from('youtube_videos')
      .upsert(fetchedVideos, { onConflict: 'video_id' })

    if (upsertError) {
      throw upsertError
    }

    return NextResponse.json({ 
      success: true, 
      count: fetchedVideos.length, 
      message: `Successfully synchronized ${fetchedVideos.length} videos from channel ${channelHandle}!` 
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'An error occurred during synchronization.' }, { status: 500 })
  }
}

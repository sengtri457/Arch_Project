import { NextResponse } from 'next/server'

function extractYoutubeId(urlOrId: string): string | null {
  if (!urlOrId) return null
  const clean = urlOrId.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = clean.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const urlParam = searchParams.get('url')

  if (!urlParam) {
    return NextResponse.json({ error: 'YouTube URL or Video ID is required' }, { status: 400 })
  }

  const videoId = extractYoutubeId(urlParam)
  if (!videoId) {
    return NextResponse.json({ error: 'Could not extract a valid 11-character YouTube video ID' }, { status: 400 })
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const res = await fetch(oembedUrl)
    
    if (!res.ok) {
      // Fallback if the video is private or doesn't support oEmbed
      return NextResponse.json({
        video_id: videoId,
        title: `YouTube Video (${videoId})`,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        is_fallback: true
      })
    }

    const data = await res.json()
    return NextResponse.json({
      video_id: videoId,
      title: data.title || '',
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, // Try higher res first
      author_name: data.author_name || '',
      is_fallback: false
    })
  } catch (err: any) {
    return NextResponse.json({
      video_id: videoId,
      title: `YouTube Video (${videoId})`,
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      is_fallback: true,
      error: err.message
    })
  }
}

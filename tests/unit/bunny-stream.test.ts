import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  signBunnyHlsUrl,
  signBunnyMp4Url,
  signBunnyEmbedUrl,
  getBunnyConfig,
  type BunnyPlaybackConfig
} from '@/lib/bunny'

describe('Bunny Stream Signed Playback (lib/bunny.ts)', () => {
  const mockConfig: BunnyPlaybackConfig = {
    host: 'video.archtipsbox.com',
    tokenSecurityKey: 'super-secret-token-key-12345',
    quality: '720p',
    format: 'hls',
    bindTokenIp: false,
    ttlSeconds: 3600
  }

  it('generates a valid HLS signed URL with bcdn_token and expires query parameter', () => {
    const videoId = 'd5d30129-234b-4b2a-8d19-450f612d4cf7'
    const signedUrl = signBunnyHlsUrl(mockConfig, videoId)

    expect(signedUrl).toContain(`https://${mockConfig.host}/bcdn_token=HS256-`)
    expect(signedUrl).toContain(`token_path=%2F${videoId}%2F`)
    expect(signedUrl).toContain(`expires=`)
    expect(signedUrl).toContain(`/${videoId}/playlist.m3u8`)
  })

  it('generates a valid MP4 signed URL with query parameter token and expires', () => {
    const videoId = 'd5d30129-234b-4b2a-8d19-450f612d4cf7'
    const signedUrl = signBunnyMp4Url(mockConfig, videoId)

    expect(signedUrl).toContain(`https://${mockConfig.host}/${videoId}/play_${mockConfig.quality}.mp4?token=HS256-`)
    expect(signedUrl).toContain('&expires=')
  })

  it('includes IP binding flag in token when bindTokenIp is enabled with client IP', () => {
    const ipConfig: BunnyPlaybackConfig = {
      ...mockConfig,
      bindTokenIp: true
    }
    const videoId = 'test-video-id'
    const signedWithIp = signBunnyHlsUrl(ipConfig, videoId, { clientIp: '192.168.1.100' })

    // Flag prefix '1-' indicates token bound to IP
    expect(signedWithIp).toContain('bcdn_token=HS256-1-')
  })

  it('generates Bunny embed URL with sha256 token and expiration', () => {
    const libraryId = '12345'
    const videoId = 'abcd-1234-efgh-5678'
    const embedUrl = signBunnyEmbedUrl(libraryId, videoId, 'mock-security-key', 3600)

    expect(embedUrl).toContain(`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`)
    expect(embedUrl).toContain('token=')
    expect(embedUrl).toContain('expires=')
    expect(embedUrl).toContain('autoplay=true')
  })

  it('extracts libraryId correctly if encoded as LIBRARY_ID/VIDEO_ID or LIBRARY_ID:VIDEO_ID', () => {
    const embedFromSlash = signBunnyEmbedUrl('fallback', '99999/my-video-guid', 'key', 3600)
    expect(embedFromSlash).toContain('https://iframe.mediadelivery.net/embed/99999/my-video-guid')

    const embedFromColon = signBunnyEmbedUrl('fallback', '88888:my-colon-guid', 'key', 3600)
    expect(embedFromColon).toContain('https://iframe.mediadelivery.net/embed/88888/my-colon-guid')
  })
})

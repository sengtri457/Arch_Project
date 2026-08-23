import { createHmac } from 'crypto'

const DEFAULT_TTL_SECONDS = 2 * 60 * 60

function base64Url(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function normalizeHost(host: string): string {
  return host
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/g, '')
}

function maskIpv6To64(ip: string): string {
  const groups = ip.split(':')
  if (groups.length <= 4) return ip
  return `${groups.slice(0, 4).join(':')}::`
}

export interface BunnyPlaybackConfig {
  host: string
  tokenSecurityKey: string
  quality: string
  bindTokenIp: boolean
}

export function getBunnyConfig(): BunnyPlaybackConfig | null {
  const host = process.env.BUNNY_STREAM_PULL_ZONE_HOST?.trim()
  const tokenSecurityKey = process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY?.trim()
  if (!host || !tokenSecurityKey) return null

  return {
    host: normalizeHost(host),
    tokenSecurityKey,
    quality: process.env.BUNNY_STREAM_QUALITY?.trim() || '720p',
    bindTokenIp: process.env.BUNNY_STREAM_BIND_TOKEN_IP === 'true'
  }
}

export function signBunnyPlaybackUrl(
  config: BunnyPlaybackConfig,
  videoId: string,
  options?: { clientIp?: string }
): string {
  const expires = Math.floor(Date.now() / 1000) + DEFAULT_TTL_SECONDS
  const path = `/${videoId}/play_${config.quality}.mp4`

  let clientIp = ''
  if (config.bindTokenIp && options?.clientIp) {
    const raw = options.clientIp.trim()
    clientIp = raw.includes(':') ? maskIpv6To64(raw) : raw
  }

  const signature = base64Url(
    createHmac('sha256', config.tokenSecurityKey)
      .update(`${path}${expires}${clientIp}`)
      .digest()
  )

  const token = clientIp ? `HS256-1-${signature}` : `HS256-${signature}`

  return `https://${config.host}${path}?token=${token}&expires=${expires}`
}

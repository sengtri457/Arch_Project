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

function parseIpv6ToBytes(str: string): Buffer | null {
  let rest = str
  const lastColon = rest.lastIndexOf(':')
  if (lastColon !== -1 && rest.indexOf('.') > lastColon) {
    rest = `${rest.slice(0, lastColon)}:0:0`
  }

  const halves = rest.split('::')
  if (halves.length > 2) return null

  const left = halves[0] === '' ? [] : halves[0].split(':')
  const right = halves.length === 2 && halves[1] !== '' ? halves[1].split(':') : []
  const totalGiven = left.length + right.length

  if (halves.length === 1 && totalGiven !== 8) return null
  if (halves.length === 2 && totalGiven > 7) return null

  const fillCount = halves.length === 2 ? 8 - totalGiven : 0
  const hextets = [...left, ...Array(fillCount).fill('0'), ...right]
  if (hextets.length !== 8) return null

  const buf = Buffer.alloc(16)
  for (let i = 0; i < 8; i++) {
    if (!/^[0-9A-Fa-f]{1,4}$/.test(hextets[i])) return null
    const n = parseInt(hextets[i], 16)
    buf[i * 2] = (n >>> 8) & 0xff
    buf[i * 2 + 1] = n & 0xff
  }
  buf.fill(0, 8)
  return buf
}

function userIpToBytes(userIp: string): Buffer {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(userIp)) {
    const parts = userIp.split('.').map(Number)
    if (parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
      throw new Error(`Invalid userIp: ${userIp}`)
    }
    return Buffer.from(parts)
  }
  const v6 = parseIpv6ToBytes(userIp)
  if (!v6) throw new Error(`Invalid userIp: ${userIp}`)
  return v6
}

export interface BunnyPlaybackConfig {
  host: string
  tokenSecurityKey: string
  quality: string
  format: 'hls' | 'mp4'
  bindTokenIp: boolean
  ttlSeconds: number
}

export function getBunnyConfig(): BunnyPlaybackConfig | null {
  const host = process.env.BUNNY_STREAM_PULL_ZONE_HOST?.trim()
  const tokenSecurityKey = process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY?.trim()
  if (!host || !tokenSecurityKey) return null

  const format = process.env.BUNNY_STREAM_FORMAT?.trim() === 'mp4' ? 'mp4' : 'hls'
  const ttlRaw = Number(process.env.BUNNY_STREAM_TTL_SECONDS)

  return {
    host: normalizeHost(host),
    tokenSecurityKey,
    quality: process.env.BUNNY_STREAM_QUALITY?.trim() || '720p',
    format,
    bindTokenIp: process.env.BUNNY_STREAM_BIND_TOKEN_IP === 'true',
    ttlSeconds: Number.isFinite(ttlRaw) && ttlRaw >= 60 ? Math.floor(ttlRaw) : DEFAULT_TTL_SECONDS
  }
}

interface SignOptions {
  pathname: string
  pathAllowed?: string
  clientIp?: string
  isDirectory?: boolean
}

function signBunnyUrl(config: BunnyPlaybackConfig, options: SignOptions): string {
  const expires = String(Math.floor(Date.now() / 1000) + config.ttlSeconds)

  const parameters: Record<string, string> = {}
  if (options.pathAllowed) {
    parameters['token_path'] = options.pathAllowed
  }
  const sortedEntries = Object.entries(parameters).sort(([a], [b]) => a.localeCompare(b))

  const signaturePath = options.pathAllowed || options.pathname
  const signingData = sortedEntries.map(([k, v]) => `${k}=${v}`).join('&')
  const urlData = sortedEntries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')

  let ipBytes = Buffer.alloc(0)
  let flagsPrefix = ''
  if (config.bindTokenIp && options.clientIp) {
    ipBytes = userIpToBytes(options.clientIp.trim())
    flagsPrefix = '1-'
  }

  const hmac = createHmac('sha256', config.tokenSecurityKey)
  hmac.update(signaturePath)
  hmac.update(expires)
  hmac.update(ipBytes)
  hmac.update(signingData)

  const token = `HS256-${flagsPrefix}${base64Url(hmac.digest())}`

  if (options.isDirectory) {
    const tail = urlData ? `&${urlData}` : ''
    return `https://${config.host}/bcdn_token=${token}${tail}&expires=${expires}${options.pathname}`
  }

  return `https://${config.host}${options.pathname}?token=${token}${urlData ? `&${urlData}` : ''}&expires=${expires}`
}

export function signBunnyHlsUrl(
  config: BunnyPlaybackConfig,
  videoId: string,
  options?: { clientIp?: string }
): string {
  return signBunnyUrl(config, {
    pathname: `/${videoId}/playlist.m3u8`,
    pathAllowed: `/${videoId}/`,
    isDirectory: true,
    clientIp: options?.clientIp
  })
}

export function signBunnyMp4Url(
  config: BunnyPlaybackConfig,
  videoId: string,
  options?: { clientIp?: string }
): string {
  return signBunnyUrl(config, {
    pathname: `/${videoId}/play_${config.quality}.mp4`,
    clientIp: options?.clientIp
  })
}

/**
 * Client-side Device Identifier & Fingerprinting Helper
 * Provides stable device tracking for anti-account sharing enforcement.
 */

const STORAGE_KEY = "archtipsbox_device_id"

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server-environment"

  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      id = typeof crypto !== "undefined" && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return "anonymous-device"
  }
}

export function getDeviceName(): string {
  if (typeof window === "undefined") return "Server"

  try {
    const ua = navigator.userAgent
    let browser = "Browser"
    let os = "Device"

    // Detect Browser
    if (/Edg\//i.test(ua)) browser = "Edge"
    else if (/Chrome\//i.test(ua)) browser = "Chrome"
    else if (/Firefox\//i.test(ua)) browser = "Firefox"
    else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari"
    else if (/OPR\//i.test(ua)) browser = "Opera"

    // Detect OS
    if (/Windows/i.test(ua)) os = "Windows"
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS"
    else if (/Macintosh|Mac OS/i.test(ua)) os = "macOS"
    else if (/Android/i.test(ua)) os = "Android"
    else if (/Linux/i.test(ua)) os = "Linux"

    return `${browser} on ${os}`
  } catch {
    return "Workstation / Browser"
  }
}

export function getDeviceHeaders(): Record<string, string> {
  return {
    "x-device-id": getDeviceId(),
    "x-device-name": getDeviceName(),
  }
}

export function isCurrentDevice(deviceId: string): boolean {
  if (!deviceId) return false
  return getDeviceId() === deviceId
}


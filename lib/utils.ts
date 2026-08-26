import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cloud storage base URL
const CLOUD_STORAGE_URL = 'https://public.archtipsbox.com'

// Check if we should use local files (for development when cloud storage files aren't uploaded yet)
// Set NEXT_PUBLIC_USE_LOCAL_MEDIA=true in .env.local to use local files from public folder
// Defaults to false (use cloud storage)
const USE_LOCAL_MEDIA = process.env.NEXT_PUBLIC_USE_LOCAL_MEDIA === 'true'

/**
 * Safely gets className as a string from an element
 * Handles both string and DOMTokenList cases
 */
export function getClassNameAsString(element: Element | null): string {
  if (!element) return ''
  const className = element.className as any
  if (typeof className === 'string') {
    return className
  }
  // If it's a DOMTokenList or SVGAnimatedString, convert to string
  if (className && typeof className.toString === 'function') {
    return className.toString()
  }
  return ''
}

/**
 * Transforms a media URL to use cloud storage if it's a local path.
 * - Absolute URLs (http/https) are left unchanged
 * - Local paths starting with '/' are prepended with cloud storage URL
 * - Placeholder paths are left unchanged
 */
export function getMediaUrl(url: string): string {
  if (!url) return '/placeholder.svg'
  
  // If it's already an absolute URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // If it's a placeholder, return as is (or you can handle it differently)
  if (url === '/placeholder.svg' || url.startsWith('/placeholder.svg') || url === '/placeholder.jpg' || url.startsWith('/images/placeholder.jpg')) {
    return url
  }

  // Check if it's a dummy value (e.g. no extension, doesn't look like a path or link)
  const isDummy = !url.includes('.') && !url.includes('/') && !url.startsWith('http')
  if (isDummy) {
    return '/placeholder.svg'
  }
  
  // If using local media, return the path as-is (Next.js serves public folder at root)
  if (USE_LOCAL_MEDIA) {
    return url.startsWith('/') ? url : `/${url}`
  }
  
  // For local paths starting with '/', prepend cloud storage URL
  if (url.startsWith('/')) {
    // Remove leading slash and encode path segments
    const path = url.substring(1)
    const parts = path.split('/')
    const encodedPath = parts.map(part => encodeURIComponent(part)).join('/')
    return `${CLOUD_STORAGE_URL}/${encodedPath}`
  }
  
  // For relative paths without leading slash, encode and prepend
  const parts = url.split('/')
  const encodedPath = parts.map(part => encodeURIComponent(part)).join('/')
  return `${CLOUD_STORAGE_URL}/${encodedPath}`
}

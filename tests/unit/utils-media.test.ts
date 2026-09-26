import { describe, it, expect } from 'vitest'
import { getMediaUrl, cn } from '@/lib/utils'

describe('Utils & Media Handling (lib/utils.ts)', () => {
  describe('cn (Tailwind class merger)', () => {
    it('merges class names and handles conditionals', () => {
      expect(cn('px-4 py-2', 'bg-blue-500')).toBe('px-4 py-2 bg-blue-500')
      expect(cn('px-4', false && 'hidden', true && 'block')).toBe('px-4 block')
      // Tailwind merge should resolve conflicts
      expect(cn('p-4', 'p-2')).toBe('p-2')
    })
  })

  describe('getMediaUrl', () => {
    it('returns /placeholder.svg when input is empty or null-like', () => {
      expect(getMediaUrl('')).toBe('/placeholder.svg')
      expect(getMediaUrl(null as any)).toBe('/placeholder.svg')
      expect(getMediaUrl(undefined as any)).toBe('/placeholder.svg')
    })

    it('returns absolute http/https URLs unchanged', () => {
      const url = 'https://images.unsplash.com/photo-12345?auto=format'
      expect(getMediaUrl(url)).toBe(url)

      const httpUrl = 'http://example.com/asset.jpg'
      expect(getMediaUrl(httpUrl)).toBe(httpUrl)
    })

    it('returns placeholder assets unchanged', () => {
      expect(getMediaUrl('/placeholder.svg')).toBe('/placeholder.svg')
      expect(getMediaUrl('/placeholder.jpg')).toBe('/placeholder.jpg')
    })

    it('returns local /assets/ paths unchanged', () => {
      expect(getMediaUrl('/assets/images/logo.png')).toBe('/assets/images/logo.png')
      expect(getMediaUrl('assets/images/logo.png')).toBe('/assets/images/logo.png')
    })

    it('prepends cloud storage base URL for local paths and encodes URI segments', () => {
      const localPath = '/projects/commercial building/photo 1.jpg'
      const transformed = getMediaUrl(localPath)
      expect(transformed).toContain('https://public.archtipsbox.com')
      expect(transformed).toContain('commercial%20building')
      expect(transformed).toContain('photo%201.jpg')
    })
  })
})

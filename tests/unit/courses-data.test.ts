import { describe, it, expect } from 'vitest'
import {
  courses,
  resolveCourseUuid,
  resolveLessonId,
  getLessonCoverImage,
  D5_LESSON_ALIAS_MAP
} from '@/lib/courses-data'

describe('Courses Data & Helpers (lib/courses-data.ts)', () => {
  it('contains valid course records with non-empty titles, slugs, and prices', () => {
    expect(courses.length).toBeGreaterThan(0)
    for (const course of courses) {
      expect(course.id).toBeDefined()
      expect(course.title.trim().length).toBeGreaterThan(0)
      expect(course.price).toMatch(/^\$\d+(\.\d{2})?$/)
      expect(course.lessons).toBeGreaterThan(0)
    }
  })

  it('correctly resolves course UUID from slugs or returns input UUID', () => {
    // Known slug mapping
    const d5Uuid = resolveCourseUuid('d5-masterclass')
    expect(d5Uuid).toBe('d5c66d93-3d02-466d-a77b-6c6a46cd4cf7')

    const enscapeUuid = resolveCourseUuid('enscape-masterclass')
    expect(enscapeUuid).toBe('eb919c63-4712-4fb3-81b4-25e2e8b2cc1c')

    // Direct UUID should be preserved
    const directUuid = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
    expect(resolveCourseUuid(directUuid)).toBe(directUuid)

    // Null/undefined/empty returns empty string
    expect(resolveCourseUuid(null)).toBe('')
    expect(resolveCourseUuid(undefined)).toBe('')
    expect(resolveCourseUuid('')).toBe('')
  })

  it('resolves lesson aliases to valid lesson UUIDs', () => {
    expect(resolveLessonId('d5-m01')).toBe(D5_LESSON_ALIAS_MAP['d5-m01'])
    expect(resolveLessonId('d5-m02')).toBe(D5_LESSON_ALIAS_MAP['d5-m02'])

    // Unknown alias or direct UUID returns as-is
    const rawId = 'custom-lesson-uuid'
    expect(resolveLessonId(rawId)).toBe(rawId)

    // Empty returns empty string
    expect(resolveLessonId(null)).toBe('')
  })

  it('determines the proper lesson cover image fallback', () => {
    // 1. Explicit thumbnail
    expect(getLessonCoverImage('d5-masterclass', { thumbnail_url: 'https://cdn.example.com/thumb.jpg' }))
      .toBe('https://cdn.example.com/thumb.jpg')

    // 2. D5 course normalized module image
    expect(getLessonCoverImage('d5-masterclass', { order_index: 3 }))
      .toBe('/assets/images/D5_class_img/M3.jpg')

    // 3. Fallback when placeholder is provided
    expect(getLessonCoverImage('other-course', null, 0, '/custom-cover.jpg'))
      .toBe('/custom-cover.jpg')

    // 4. Default placeholder
    expect(getLessonCoverImage('unknown', null, 0, null))
      .toBe('/placeholder.svg')
  })
})

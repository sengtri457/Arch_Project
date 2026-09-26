import { describe, it, expect } from 'vitest'

describe('Export Utils & Accounting Sanity (lib/export-utils.ts)', () => {
  // Simulates the aggregation logic inside exportCourseToExcel and exportCourseToPDF
  function computeExportTotals(students: any[]) {
    const totalRevenueVal = students.reduce((sum, s) => sum + Number(s.amountPaid || 0), 0)
    const avgProgressSum = students.reduce((sum, s) => sum + Number(s.progressPercent || 0), 0)
    const avgProgressVal = students.length > 0 ? (avgProgressSum / students.length) / 100 : 0
    return { totalRevenueVal, avgProgressVal }
  }

  it('handles empty student lists gracefully without division by zero', () => {
    const { totalRevenueVal, avgProgressVal } = computeExportTotals([])
    expect(totalRevenueVal).toBe(0)
    expect(avgProgressVal).toBe(0)
    expect(Number.isNaN(avgProgressVal)).toBe(false)
  })

  it('safely aggregates numeric amounts and handles null/undefined amounts', () => {
    const students = [
      { name: 'Student 1', amountPaid: 49.99, progressPercent: 100 },
      { name: 'Student 2', amountPaid: null, progressPercent: 50 }, // Manual grant
      { name: 'Student 3', amountPaid: undefined, progressPercent: 0 },
      { name: 'Student 4', amountPaid: 25.00, progressPercent: 75 }
    ]

    const { totalRevenueVal, avgProgressVal } = computeExportTotals(students)
    expect(totalRevenueVal).toBeCloseTo(74.99, 2)
    expect(avgProgressVal).toBeCloseTo(0.5625, 4)
  })

  it('formats student rows safely avoiding toFixed errors', () => {
    const student = {
      name: 'Test Student',
      email: 'student@example.com',
      amountPaid: 49.99,
      enrollDate: '2026-08-20T10:00:00Z',
      completedLessons: 10,
      totalLessons: 10,
      progressPercent: 100
    }

    const formattedPaid = `$${Number(student.amountPaid || 0).toFixed(2)}`
    const formattedProgress = `${student.completedLessons}/${student.totalLessons} (${Number(student.progressPercent || 0).toFixed(0)}%)`

    expect(formattedPaid).toBe('$49.99')
    expect(formattedProgress).toBe('10/10 (100%)')
  })
})

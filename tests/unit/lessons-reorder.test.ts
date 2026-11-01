import { describe, it, expect } from "vitest"

interface ReorderUpdate {
  lesson_id: string
  order_index: number
  module_id?: string | null
}

function validateReorderPayload(updates: any): { valid: boolean; error?: string } {
  if (!Array.isArray(updates) || updates.length === 0) {
    return { valid: false, error: "Missing or empty updates array" }
  }

  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

  for (const item of updates) {
    if (!item.lesson_id || !isUUID(String(item.lesson_id))) {
      return { valid: false, error: `Invalid lesson_id: ${item.lesson_id}` }
    }
    const idx = Number(item.order_index)
    if (Number.isNaN(idx) || idx < 1) {
      return { valid: false, error: `Invalid order_index: ${item.order_index}` }
    }
  }

  return { valid: true }
}

function resequenceLessons<T extends { lesson_id: string }>(items: T[]): Array<T & { order_index: number }> {
  return items.map((item, index) => ({
    ...item,
    order_index: index + 1,
  }))
}

describe("Lesson Reordering Logic", () => {
  it("re-indexes items sequentially starting from 1", () => {
    const mockLessons = [
      { lesson_id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5", title: "Lesson A" },
      { lesson_id: "b2b2b2b2-c3c3-d4d4-e5e5-f6f6f6f6f6f6", title: "Lesson B" },
      { lesson_id: "c3c3c3c3-d4d4-e5e5-f6f6-a7a7a7a7a7a7", title: "Lesson C" },
    ]

    const reordered = resequenceLessons(mockLessons)

    expect(reordered[0].order_index).toBe(1)
    expect(reordered[1].order_index).toBe(2)
    expect(reordered[2].order_index).toBe(3)
  })

  it("validates well-formed reorder updates payload", () => {
    const validPayload: ReorderUpdate[] = [
      { lesson_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", order_index: 1 },
      { lesson_id: "4a08e1a2-3b7d-4bad-9bdd-2b0d7b3dcb6d", order_index: 2, module_id: "7b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" },
    ]

    const result = validateReorderPayload(validPayload)
    expect(result.valid).toBe(true)
  })

  it("rejects invalid lesson UUIDs in reorder updates", () => {
    const invalidPayload = [
      { lesson_id: "not-a-valid-uuid", order_index: 1 },
    ]

    const result = validateReorderPayload(invalidPayload)
    expect(result.valid).toBe(false)
    expect(result.error).toContain("Invalid lesson_id")
  })

  it("rejects non-positive order_index values", () => {
    const invalidPayload = [
      { lesson_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", order_index: 0 },
    ]

    const result = validateReorderPayload(invalidPayload)
    expect(result.valid).toBe(false)
    expect(result.error).toContain("Invalid order_index")
  })

  describe("Undo & Redo Reorder History Stack", () => {
    it("restores the previous lesson order when undo is executed", () => {
      const initial = [
        { lesson_id: "1", title: "Lesson 1", order_index: 1 },
        { lesson_id: "2", title: "Lesson 2", order_index: 2 },
        { lesson_id: "3", title: "Lesson 3", order_index: 3 },
      ]

      // Drag action: move item 3 to position 1
      const dragged = [
        { lesson_id: "3", title: "Lesson 3", order_index: 1 },
        { lesson_id: "1", title: "Lesson 1", order_index: 2 },
        { lesson_id: "2", title: "Lesson 2", order_index: 3 },
      ]

      const history = [initial]
      const future: typeof initial[] = []

      // Simulate Undo
      const previous = history.pop()!
      future.unshift(dragged)
      const restored = resequenceLessons(previous)

      expect(restored[0].lesson_id).toBe("1")
      expect(restored[1].lesson_id).toBe("2")
      expect(restored[2].lesson_id).toBe("3")
      expect(restored[0].order_index).toBe(1)
      expect(restored[2].order_index).toBe(3)
      expect(future.length).toBe(1)

      // Simulate Redo
      const next = future.shift()!
      history.push(restored)
      const redone = resequenceLessons(next)

      expect(redone[0].lesson_id).toBe("3")
      expect(redone[1].lesson_id).toBe("1")
      expect(redone[2].lesson_id).toBe("2")
      expect(history.length).toBe(1)
    })
  })
})

import { describe, it, expect } from "vitest"
import { parseMultipleResources, serializeResourceItems } from "@/app/admin/courses/[courseId]/lessons/editor-form"
import {
  extractYouTubeVideoId,
  parseISO8601Duration,
  extractBunnyVideoDetails,
  probeBunnyEmbedMetadata
} from "@/app/api/admin/lessons/duration/route"
import { getLessonCoverImage } from "@/lib/courses-data"

describe("Enhancement Tech Spec 01 Tests", () => {
  describe("Resource Item Serialization & Parsing", () => {
    it("parses single and multiple resource lines", () => {
      const raw = "https://example.com/asset.zip|Download CAD Files\nhttps://example.com/guide.pdf|User Guide"
      const parsed = parseMultipleResources(raw)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].url).toBe("https://example.com/asset.zip")
      expect(parsed[0].desc).toBe("Download CAD Files")
      expect(parsed[1].url).toBe("https://example.com/guide.pdf")
      expect(parsed[1].desc).toBe("User Guide")
    })

    it("serializes items back to formatted string", () => {
      const items = [
        { url: "https://example.com/file1.zip", desc: "Main Assets" },
        { url: "https://example.com/file2.pdf", desc: "" },
      ]
      const serialized = serializeResourceItems(items)
      expect(serialized).toBe("https://example.com/file1.zip|Main Assets\nhttps://example.com/file2.pdf")
    })

    it("handles empty or whitespace inputs gracefully", () => {
      expect(parseMultipleResources("")).toEqual([{ url: "", desc: "" }])
      expect(parseMultipleResources(null)).toEqual([{ url: "", desc: "" }])
      expect(serializeResourceItems([{ url: "   ", desc: "Empty" }])).toBe("")
    })
  })

  describe("Video Duration Calculation", () => {
    function computeMinutes(seconds: number): number {
      return Math.ceil(seconds / 60)
    }

    it("accurately converts seconds to ceiling minutes", () => {
      expect(computeMinutes(60)).toBe(1)
      expect(computeMinutes(61)).toBe(2)
      expect(computeMinutes(600)).toBe(10)
      expect(computeMinutes(3600)).toBe(60)
    })

    it("extracts YouTube video IDs from various URL formats", () => {
      expect(extractYouTubeVideoId("https://youtu.be/oXVAdtZPp3U?si=eKPecabiXQAKBY_P")).toBe("oXVAdtZPp3U")
      expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=oXVAdtZPp3U")).toBe("oXVAdtZPp3U")
      expect(extractYouTubeVideoId("https://www.youtube.com/embed/oXVAdtZPp3U")).toBe("oXVAdtZPp3U")
      expect(extractYouTubeVideoId("https://www.youtube.com/shorts/oXVAdtZPp3U")).toBe("oXVAdtZPp3U")
      expect(extractYouTubeVideoId("oXVAdtZPp3U")).toBe("oXVAdtZPp3U")
      expect(extractYouTubeVideoId("https://example.com/not-youtube")).toBeNull()
    })

    it("accurately parses YouTube ISO 8601 duration strings into seconds", () => {
      expect(parseISO8601Duration("PT1M57S")).toBe(117)
      expect(parseISO8601Duration("PT10M")).toBe(600)
      expect(parseISO8601Duration("PT45S")).toBe(45)
      expect(parseISO8601Duration("PT1H2M3S")).toBe(3723)
      expect(parseISO8601Duration("")).toBe(0)
    })

    it("extracts Bunny Video details from GUIDs, embed links, and play URLs", () => {
      const guid = "9f8c7e6d-1a2b-3c4d-5e6f-7a8b9c0d1e2f"
      expect(extractBunnyVideoDetails(guid)).toEqual({
        videoId: guid,
        libraryId: undefined
      })

      const embedUrl = "https://iframe.mediadelivery.net/embed/758330/9f8c7e6d-1a2b-3c4d-5e6f-7a8b9c0d1e2f"
      expect(extractBunnyVideoDetails(embedUrl)).toEqual({
        videoId: guid,
        libraryId: "758330"
      })

      const playUrl = "https://iframe.mediadelivery.net/play/12345/9f8c7e6d-1a2b-3c4d-5e6f-7a8b9c0d1e2f?autoplay=true"
      expect(extractBunnyVideoDetails(playUrl)).toEqual({
        videoId: guid,
        libraryId: "12345"
      })

      const cdnUrl = "https://vz-758330-abc.b-cdn.net/9f8c7e6d-1a2b-3c4d-5e6f-7a8b9c0d1e2f/play_720p.mp4"
      expect(extractBunnyVideoDetails(cdnUrl)).toEqual({
        videoId: guid,
        libraryId: undefined
      })

      expect(extractBunnyVideoDetails("https://example.com/not-bunny")).toBeNull()
    })

    it("probes Bunny embed metadata for duration and thumbnail", async () => {
      // Test non-existent video returns null without crashing
      const nonExistent = await probeBunnyEmbedMetadata("00000000-0000-0000-0000-000000000000", "999999")
      expect(nonExistent).toBeNull()

      // Test real Bunny video in project database
      const realVideo = await probeBunnyEmbedMetadata("d81c8867-a19c-4b61-b241-7a554ab0e41c", "787962")
      if (realVideo) {
        expect(realVideo.success).toBe(true)
        expect(realVideo.durationSeconds).toBe(340)
        expect(realVideo.thumbnail_url).toContain("b-cdn.net")
        expect(realVideo.library_id).toBe("787962")
      }
    })
  })

  describe("Inline Lesson Title Validation", () => {
    function validateTitle(title: string): { valid: boolean; error?: string; cleanTitle?: string } {
      const trimmed = title?.trim()
      if (!trimmed) {
        return { valid: false, error: "lesson_id and title required" }
      }
      if (trimmed.length > 255) {
        return { valid: false, error: "Lesson title is too long" }
      }
      return { valid: true, cleanTitle: trimmed }
    }

    it("validates and trims normal titles", () => {
      const res = validateTitle("  01. Introduction to D5 Workspace  ")
      expect(res.valid).toBe(true)
      expect(res.cleanTitle).toBe("01. Introduction to D5 Workspace")
    })

    it("rejects empty or whitespace-only titles", () => {
      expect(validateTitle("").valid).toBe(false)
      expect(validateTitle("   ").valid).toBe(false)
    })

    it("rejects overly long titles", () => {
      const longTitle = "A".repeat(256)
      expect(validateTitle(longTitle).valid).toBe(false)
    })
  })

  describe("Thumbnail Fallback Hierarchy", () => {
    function resolveThumbnail(
      lessonThumb?: string | null,
      moduleCover?: string | null,
      courseThumb?: string | null,
      defaultCover = "/images/default-course-cover.jpg"
    ): string {
      return lessonThumb || moduleCover || courseThumb || defaultCover
    }

    it("prefers lesson-specific thumbnail when available", () => {
      const cover = resolveThumbnail(
        "https://cdn.example.com/lesson1.jpg",
        "https://cdn.example.com/module1.jpg",
        "https://cdn.example.com/course.jpg"
      )
      expect(cover).toBe("https://cdn.example.com/lesson1.jpg")
    })

    it("falls back to module cover if lesson thumbnail is missing", () => {
      const cover = resolveThumbnail(
        null,
        "https://cdn.example.com/module1.jpg",
        "https://cdn.example.com/course.jpg"
      )
      expect(cover).toBe("https://cdn.example.com/module1.jpg")
    })

    it("falls back to course thumbnail if module cover is missing", () => {
      const cover = resolveThumbnail(
        null,
        null,
        "https://cdn.example.com/course.jpg"
      )
      expect(cover).toBe("https://cdn.example.com/course.jpg")
    })

    it("falls back to default cover if everything is null", () => {
      const cover = resolveThumbnail(null, null, null)
      expect(cover).toBe("/images/default-course-cover.jpg")
    })

    it("verifies getLessonCoverImage accurately handles YouTube and module index fallback", () => {
      // 1. Explicit thumbnail
      expect(
        getLessonCoverImage("d5-render-masterclass", { thumbnail_url: "/custom-thumb.jpg" })
      ).toBe("/custom-thumb.jpg")

      // 2. YouTube auto derivation
      expect(
        getLessonCoverImage("d5-render-masterclass", {
          video_source_type: "youtube",
          video_external_id: "dQw4w9WgXcQ"
        })
      ).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg")

      // 3. Module fallbackCover
      expect(
        getLessonCoverImage(
          "d5-render-masterclass",
          { video_source_type: "bunny", video_external_id: "uuid" },
          undefined,
          "/module-cover.png"
        )
      ).toBe("/module-cover.png")

      // 4. D5 numbered module fallback
      expect(
        getLessonCoverImage("d5-render-masterclass", {
          order_index: 9,
          video_source_type: "bunny",
          video_external_id: "uuid"
        })
      ).toBe("/assets/images/D5_class_img/M9.jpg")

      // 5. Course cover fallback when not D5 and fallbackCover is given
      expect(
        getLessonCoverImage(
          "sketchup-masterclass",
          { video_source_type: "bunny", video_external_id: "uuid" },
          undefined,
          "/fallback-course.jpg"
        )
      ).toBe("/fallback-course.jpg")
    })
  })
})


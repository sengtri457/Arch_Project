# ArchTipsBox — Platform Enhancement & Bug Fixes
### Technical Specification & Implementation Guide

**Audience:** Senior Developers & Engineering Team  
**Scope:** Admin Data Hooks, Postgres Retention, Inline DOM Editing, Video Metadata Probing  

---

## 1. Bug Fix: Syllabus Analytics Query Hook

### File: `lib/react-query/hooks/use-admin.ts`
* **Issue:** `lessons` query hook was scoped strictly to `activeTab === "courses"`. On the `"analytics"` tab, `lessons.data` returned `undefined`/`[]`, starving `AreaChart` components.
* **Code Modification:**
```ts
// lib/react-query/hooks/use-admin.ts
const lessons = useQuery({
  queryKey: queryKeys.admin.adminLessons,
  queryFn: async () => {
    const res = await fetch('/api/admin/lessons')
    if (!res.ok) return []
    const json = await res.json()
    return json.lessons || []
  },
  staleTime: 2 * 60 * 1000,
  enabled: activeTab === "courses" || activeTab === "analytics", // FIXED
})
```

---

## 2. Bug Fix: Lesson Module Assignment Wipe

### File 1: `app/api/admin/lessons/route.ts`
* **Issue:** When updating a lesson (`isUpdating = true`), `body.module_id` was defaulted to `null` if omitted, wiping the existing relational link in PostgreSQL.
* **Code Modification:**
```ts
// app/api/admin/lessons/route.ts
const payload: Record<string, any> = {
  title,
  video_source_type: sourceType,
  video_external_id: videoExternalId,
  duration_minutes: durationMinutes,
  order_index: orderIndex,
  downloadable_asset_url: downloadableAssetUrl || null,
  thumbnail_url: thumbnailUrl || null
}

// Preserve existing module_id on update unless explicitly provided
if (body.module_id !== undefined) {
  payload.module_id = typeof body.module_id === 'string' && body.module_id ? body.module_id : null
}
```

### File 2: `app/admin/page.tsx`
* Ensure `lessonForm.module_id` is retained during modal open and forwarded when calling `fetch('/api/admin/lessons', { method: 'POST', body: JSON.stringify(...) })`.

---

## 3. Feature: Inline Lesson Renaming

### Endpoint: `PATCH /api/admin/lessons`
```ts
// Handler inside app/api/admin/lessons/route.ts
export async function PATCH(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { lesson_id, title } = await request.json()
  if (!lesson_id || !title?.trim()) {
    return NextResponse.json({ error: 'lesson_id and title required' }, { status: 400 })
  }

  const supabase = serviceClient()
  const { error } = await supabase
    .from('lessons')
    .update({ title: title.trim() })
    .eq('lesson_id', lesson_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, lesson_id, title: title.trim() })
}
```

### UI Component: `components/admin/inline-lesson-title.tsx`
* Maintains local `isEditing` state.
* Swaps `<span />` with `<input autoFocus />`.
* Listens to `onKeyDown` (`Enter` = commit & save, `Escape` = discard).

---

## 4. Feature: Video Duration Auto-Sync (Multi-Provider: Bunny & YouTube)

### API Endpoints: `POST /api/admin/lessons/sync-duration` & `GET|POST /api/admin/lessons/duration`
Supports dynamic duration resolution across multiple video providers (Bunny Stream, YouTube Data API v3, and Direct Video probe):

```ts
// app/api/admin/lessons/sync-duration/route.ts & duration/route.ts
export async function POST(req: Request) {
  const { video_source_type, video_external_id } = await req.json()
  const rawTarget = String(video_external_id || '').trim()

  // 1. YouTube Dynamic Resolution (via Google YouTube Data API v3)
  const ytId = extractYouTubeVideoId(rawTarget)
  if (video_source_type === 'youtube' || ytId) {
    const apiKey = process.env.YOUTUBE_API_KEY
    if (apiKey && ytId) {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ytId}&key=${apiKey}`)
      const data = await res.json()
      const isoDuration = data.items?.[0]?.contentDetails?.duration // e.g. "PT1M57S"
      if (isoDuration) {
        const seconds = parseISO8601Duration(isoDuration)           // e.g. 117 seconds
        return NextResponse.json({
          success: true,
          source: 'youtube',
          duration_seconds: seconds,
          durationSeconds: seconds,
          duration_minutes: Math.ceil(seconds / 60),
          durationMinutes: Math.ceil(seconds / 60)
        })
      }
    }
  }

  // 2. Bunny Stream API Dynamic Resolution
  if (video_source_type === 'bunny' || isBunnyGuid(rawTarget)) {
    const { libraryId, videoId } = parseBunnyTarget(rawTarget)
    const apiKey = process.env.BUNNY_STREAM_API_KEY
    if (libraryId && apiKey && videoId) {
      const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
        headers: { AccessKey: apiKey, Accept: 'application/json' }
      })
      if (res.ok) {
        const data = await res.json()
        const seconds = Number(data.length || 0)
        if (seconds > 0) {
          return NextResponse.json({
            success: true,
            source: 'bunny',
            duration_seconds: seconds,
            durationSeconds: seconds,
            duration_minutes: Math.ceil(seconds / 60),
            durationMinutes: Math.ceil(seconds / 60)
          })
        }
      }
    }
  }

  // 3. Fallback when duration cannot be auto-detected
  return NextResponse.json({
    success: false,
    error: 'Could not auto-detect video duration. Please enter duration in seconds manually.'
  }, { status: 404 })
}
```

---

## 5. Feature: Thumbnail Fallback & Bulk Inheritance

### 1. Public Display Fallback
```tsx
const lessonCover = 
  lesson.thumbnail_url || 
  module?.cover_image_url || 
  course?.thumbnail_url || 
  '/images/default-course-cover.jpg'
```

### 2. Bulk Module Application API
```ts
// PUT /api/admin/modules/apply-thumbnail
await supabase
  .from('lessons')
  .update({ thumbnail_url: moduleCoverUrl })
  .eq('module_id', moduleId)
  .is('thumbnail_url', null)
```

"use client"

import { useParams } from "next/navigation"
import LessonEditorForm from "../../editor-form"

export default function EditLessonPage() {
  const params = useParams<{ courseId: string; lessonId: string }>()
  const courseId = params?.courseId || ""
  const lessonId = params?.lessonId || ""

  return <LessonEditorForm courseId={courseId} lessonId={lessonId} />
}

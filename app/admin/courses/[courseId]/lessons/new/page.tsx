"use client"

import { useParams } from "next/navigation"
import LessonEditorForm from "../editor-form"

export default function NewLessonPage() {
  const params = useParams<{ courseId: string }>()
  const courseId = params?.courseId || ""

  return <LessonEditorForm courseId={courseId} />
}

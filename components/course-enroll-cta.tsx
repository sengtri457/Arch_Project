"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { Loader2, Play, ShoppingCart } from "lucide-react"

interface CourseEnrollCtaProps {
  courseId: string
  slug: string
}

export function CourseEnrollCta({ courseId, slug }: CourseEnrollCtaProps) {
  const [state, setState] = useState<"loading" | "guest" | "locked" | "owned">("loading")

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function resolve() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        setState("guest")
        return
      }
      const hasAccess = await db.checkCourseAccess(supabase, user.id, courseId)
      if (cancelled) return
      setState(hasAccess ? "owned" : "locked")
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [courseId])

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-4 rounded-xl bg-zinc-800/40 border border-zinc-800">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (state === "owned") {
    return (
      <Link
        href={`/courses/${slug}/start`}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm transition-all hover:brightness-110"
        style={{ backgroundColor: "#9ACD32", color: "#000" }}
      >
        <Play className="w-4 h-4 fill-current" />
        Start Learning
      </Link>
    )
  }

  return (
    <Link
      href={`/checkout?courseId=${courseId}`}
      className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm transition-all hover:brightness-110"
      style={{ backgroundColor: "#9ACD32", color: "#000" }}
    >
      <ShoppingCart className="w-4 h-4" />
      Buy Now - Instant Access
    </Link>
  )
}

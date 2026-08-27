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
  const [state, setState] = useState<"loading" | "pending" | "guest" | "locked" | "owned">("loading")

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
      
      if (hasAccess) {
        setState("owned")
      } else {
        const { data: pending } = await supabase
          .from('pending_enrollments')
          .select('status')
          .eq('email', user.email?.toLowerCase())
          .eq('course_id', courseId)
          .eq('status', 'pending')
          .maybeSingle()

        if (cancelled) return
        setState(pending ? ("pending" as any) : "locked")
      }
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

  if (state === "pending") {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed"
      >
        <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
        Unlock Pending (Awaiting Approval)
      </button>
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

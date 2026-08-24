"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function GlobalRouteError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Route error:", error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center" style={{ backgroundColor: "#060010" }}>
      <h1 className="text-5xl font-bold text-white">Something went wrong</h1>
      <p className="text-zinc-400 max-w-md">
        An unexpected error occurred while loading this page. Please try again - if the problem persists, contact archtipsbox@gmail.com.
      </p>
      <div className="flex gap-3">
        <Button
          onClick={reset}
          className="font-bold px-6 py-5 rounded-xl"
          style={{ backgroundColor: "#9ACD32", color: "#000" }}
        >
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline" className="border-zinc-800 text-zinc-300 px-6 py-5 rounded-xl">
            Back to home
          </Button>
        </Link>
      </div>
    </main>
  )
}

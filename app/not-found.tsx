import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center" style={{ backgroundColor: "#060010" }}>
      <span className="text-[#9ACD32] font-bold tracking-[0.4em] text-sm">404</span>
      <h1 className="text-5xl font-bold text-white">Page not found</h1>
      <p className="text-zinc-400 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link href="/">
          <Button className="font-bold px-6 py-5 rounded-xl" style={{ backgroundColor: "#9ACD32", color: "#000" }}>
            Back to home
          </Button>
        </Link>
        <Link href="/courses">
          <Button variant="outline" className="border-zinc-800 text-zinc-300 px-6 py-5 rounded-xl">
            Browse courses
          </Button>
        </Link>
      </div>
    </main>
  )
}

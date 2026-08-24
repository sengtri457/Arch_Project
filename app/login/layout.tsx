import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - Archtipsbox",
  description: "Sign in to access your Archtipsbox courses, progress, and certificates.",
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}

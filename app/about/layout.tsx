import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About - Archtipsbox",
  description: "Meet the team behind Archtipsbox architectural visualization studio and academy.",
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}

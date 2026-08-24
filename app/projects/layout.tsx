import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Projects - Archtipsbox",
  description: "Explore our architectural visualization portfolio: exterior and interior renders, animations, and CGI productions.",
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children
}

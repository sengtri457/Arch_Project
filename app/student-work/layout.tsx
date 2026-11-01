import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Student Work & ArchViz Portfolio Showcase",
  description:
    "Explore stunning architectural visualization projects, 3D renderings, and portfolio presentations created by students at Archtipsbox Academy.",
  alternates: {
    canonical: "/student-work",
  },
  openGraph: {
    title: "Student Work & ArchViz Portfolio Showcase | Archtipsbox",
    description:
      "Explore 3D renders and architectural project showcases submitted and reviewed by students and instructors.",
    url: "/student-work",
  },
}

export default function StudentWorkLayout({ children }: { children: React.ReactNode }) {
  return children
}

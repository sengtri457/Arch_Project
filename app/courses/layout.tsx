import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Architectural Visualization Courses & Masterclasses",
  description:
    "Master real-time 3D rendering, architectural animation, and post-production. Comprehensive courses in D5 Render, Enscape, SketchUp, and Photoshop taught by Bun Sambath.",
  alternates: {
    canonical: "/courses",
  },
  openGraph: {
    title: "Architectural Visualization Courses & Masterclasses | Archtipsbox",
    description:
      "Learn real-time 3D rendering, lighting, materials, and portfolio creation with industry masterclasses.",
    url: "/courses",
  },
}

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children
}

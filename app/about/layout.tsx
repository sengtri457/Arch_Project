import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | Architectural Visualization Studio & Academy",
  description:
    "Learn about Archtipsbox, our vision, and instructor Bun Sambath. Providing world-class architectural rendering services and specialized digital training.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Archtipsbox | Studio & Academy",
    description: "Meet the team and instructors behind Archtipsbox architectural visualization studio and academy.",
    url: "/about",
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}

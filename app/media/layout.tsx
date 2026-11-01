import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ArchViz Video Tutorials & Guides",
  description:
    "Watch free architectural visualization tutorials, software breakdowns, lighting guides, and portfolio advice covering D5 Render, Photoshop, Lumion, and Enscape.",
  alternates: {
    canonical: "/media",
  },
  openGraph: {
    title: "ArchViz Video Tutorials & Guides | Archtipsbox",
    description:
      "Free architectural visualization video tutorials, tips, and technique walkthroughs.",
    url: "/media",
  },
}

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return children
}

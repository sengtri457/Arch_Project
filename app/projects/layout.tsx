import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Architectural Visualization Projects & CGI Portfolio",
  description:
    "Explore our professional architectural visualization portfolio: photorealistic exterior and interior renders, commercial CGI productions, and architectural animations.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Architectural Visualization Projects & CGI Portfolio | Archtipsbox",
    description:
      "Photorealistic exterior and interior renders, commercial CGI productions, and architectural animations.",
    url: "/projects",
  },
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children
}

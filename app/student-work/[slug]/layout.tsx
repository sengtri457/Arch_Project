import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { db } from "@/lib/supabase/db"
import { getSiteUrl, JsonLd, generateBreadcrumbSchema } from "@/lib/seo"
import { getMediaUrl } from "@/lib/utils"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

async function getStudentPost(slug: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    return await db.getStudentWorkPostBySlug(supabase, slug)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getStudentPost(slug)

  if (!post) {
    return {
      title: "Student Work Showcase - Archtipsbox",
    }
  }

  const base = getSiteUrl()
  const title = `${post.title} | Student ArchViz Project`
  const description =
    post.description ||
    `Architectural visualization project ${post.title} created by ${post.student_name || "Archtipsbox Student"} using ${post.software_used || "3D software"}.`
  const imageUrl = post.cover_image_url
    ? getMediaUrl(post.cover_image_url)
    : `${base}/opengraph-image`

  return {
    title,
    description,
    alternates: {
      canonical: `/student-work/${slug}`,
    },
    keywords: [
      post.title,
      post.architecture_field || "Architecture",
      post.software_used || "D5 Render",
      "Student Work",
      "Archtipsbox Showcase",
      "3D Render Portfolio"
    ].filter(Boolean),
    openGraph: {
      type: "article",
      title,
      description,
      url: `/student-work/${slug}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function StudentWorkSlugLayout({ children, params }: LayoutProps) {
  const { slug } = await params
  const post = await getStudentPost(slug)

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Student Work", url: "/student-work" },
    { name: post?.title || "Work Detail", url: `/student-work/${slug}` }
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  )
}

import React from "react"

/**
 * Returns canonical site origin.
 * Priority: NEXT_PUBLIC_SITE_URL (if not localhost in production) -> VERCEL_URL -> fallback
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
    // In production Vercel environments, prefer production domain over inadvertent localhost configs
    if (process.env.NODE_ENV === "production" && url.includes("localhost") && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    }
    return url
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return "https://archtipsbox.com"
}

export const siteConfig = {
  name: "Archtipsbox",
  legalName: "Archtipsbox Studio & Academy",
  defaultTitle: "Archtipsbox | Architectural Visualization Studio & Academy",
  titleTemplate: "%s | Archtipsbox",
  description:
    "Premier architectural visualization studio and training academy. Master real-time rendering with D5 Render, Enscape, Lumion, and explore high-end 3D architectural CGI portfolios.",
  keywords: [
    "Architectural Visualization",
    "ArchViz",
    "3D Rendering Courses",
    "D5 Render Masterclass",
    "Enscape Masterclass",
    "Lumion Tutorial",
    "Photoshop for Architects",
    "Architecture Portfolio Cambodia",
    "CGI Architectural Rendering",
    "Bun Sambath",
    "Architectural Design Training",
    "Real-time 3D Rendering",
    "Exterior Rendering",
    "Interior Architectural Visualization"
  ],
  author: "Bun Sambath",
  creator: "Bun Sambath",
  publisher: "Archtipsbox",
  locale: "en_US",
  socials: {
    facebook: "https://www.facebook.com/archtipsbox",
    youtube: "https://www.youtube.com/@archtipsbox",
    telegram: "https://t.me/archtipsbox",
    tiktok: "https://www.tiktok.com/@archtipsbox"
  }
}

/**
 * Organization Schema for Google Search Knowledge Graph
 */
export function generateOrganizationSchema() {
  const base = getSiteUrl()
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: base,
    logo: `${base}/logo.png`,
    image: `${base}/opengraph-image`,
    description: siteConfig.description,
    sameAs: [
      siteConfig.socials.facebook,
      siteConfig.socials.youtube,
      siteConfig.socials.telegram,
      siteConfig.socials.tiktok
    ].filter(Boolean),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Phnom Penh",
      addressCountry: "KH"
    }
  }
}

/**
 * WebSite Schema with SearchAction
 */
export function generateWebSiteSchema() {
  const base = getSiteUrl()
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: base,
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${base}/logo.png`
      }
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/courses?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }
}

/**
 * Course Schema for Google Rich Snippets
 */
export function generateCourseSchema(course: {
  title: string
  description: string
  slug: string
  price?: number | string
  instructor?: string
  image?: string
  category?: string
}) {
  const base = getSiteUrl()
  const rawPrice = typeof course.price === "string" 
    ? parseFloat(course.price.replace(/[^0-9.]/g, "")) || 49.99 
    : (course.price ?? 49.99)
  
  const courseUrl = `${base}/courses/${course.slug}`
  const imageUrl = course.image
    ? course.image.startsWith("http")
      ? course.image
      : `${base}${course.image.startsWith("/") ? "" : "/"}${course.image}`
    : `${base}/opengraph-image`

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    url: courseUrl,
    image: imageUrl,
    provider: {
      "@type": "EducationalOrganization",
      name: siteConfig.name,
      url: base,
      sameAs: siteConfig.socials.youtube
    },
    instructor: {
      "@type": "Person",
      name: course.instructor || siteConfig.author
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: "Self-paced",
      offers: {
        "@type": "Offer",
        price: rawPrice.toFixed(2),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: courseUrl,
        validFrom: "2024-01-01"
      }
    }
  }
}

/**
 * VisualArtwork / CreativeWork Schema for Architectural Project Showcase
 */
export function generateProjectSchema(project: {
  title: string
  description?: string
  slug: string
  image?: string
  category?: string
  year?: string | number
  location?: string
}) {
  const base = getSiteUrl()
  const projectUrl = `${base}/projects/${project.slug}`
  const imageUrl = project.image
    ? project.image.startsWith("http")
      ? project.image
      : `${base}${project.image.startsWith("/") ? "" : "/"}${project.image}`
    : `${base}/opengraph-image`

  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: project.title,
    description: project.description || `Architectural visualization rendering of ${project.title} by Archtipsbox.`,
    url: projectUrl,
    image: imageUrl,
    artMedium: "3D Digital Architectural Rendering / CGI",
    artform: "Architectural Visualization",
    creator: {
      "@type": "Person",
      name: siteConfig.author
    },
    locationCreated: project.location
      ? {
          "@type": "Place",
          name: project.location
        }
      : undefined,
    dateCreated: project.year ? String(project.year) : undefined
  }
}

/**
 * BreadcrumbList Schema for hierarchical Google search listings
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  const base = getSiteUrl()
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${base}${item.url.startsWith("/") ? "" : "/"}${item.url}`
    }))
  }
}

/**
 * ItemList Schema for featured portfolio projects on homepage
 */
export function generateItemListSchema(items: { name: string; url: string }[]) {
  const base = getSiteUrl()
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${base}${item.url.startsWith("/") ? "" : "/"}${item.url}`
    }))
  }
}

/**
 * React Component for injecting JSON-LD safely into Next.js pages
 */
export function JsonLd({ data }: { data: Record<string, any> | Record<string, any>[] }) {
  return React.createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) }
  })
}

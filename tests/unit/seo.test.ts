import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  getSiteUrl,
  siteConfig,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateCourseSchema,
  generateProjectSchema,
  generateBreadcrumbSchema,
  generateItemListSchema
} from "@/lib/seo"

describe("SEO Utility & Structured Data", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
  })

  it("returns configured site URL or fallback domain", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://archtipsbox.com"
    expect(getSiteUrl()).toBe("https://archtipsbox.com")
  })

  it("generates valid EducationalOrganization JSON-LD schema", () => {
    const schema = generateOrganizationSchema()
    expect(schema["@context"]).toBe("https://schema.org")
    expect(schema["@type"]).toBe("EducationalOrganization")
    expect(schema.name).toBe(siteConfig.name)
    expect(schema.url).toBe(getSiteUrl())
    expect(Array.isArray(schema.sameAs)).toBe(true)
  })

  it("generates valid WebSite JSON-LD schema with SearchAction", () => {
    const schema = generateWebSiteSchema()
    expect(schema["@context"]).toBe("https://schema.org")
    expect(schema["@type"]).toBe("WebSite")
    expect(schema.name).toBe(siteConfig.name)
    expect(schema.potentialAction).toBeDefined()
    expect(schema.potentialAction["@type"]).toBe("SearchAction")
  })

  it("generates valid Course JSON-LD schema with offers and provider", () => {
    const schema = generateCourseSchema({
      title: "D5 Render Masterclass",
      description: "Learn photorealistic 3D rendering",
      slug: "d5-masterclass",
      price: 49.99,
      instructor: "Bun Sambath",
      image: "/assets/d5.jpg"
    })

    expect(schema["@context"]).toBe("https://schema.org")
    expect(schema["@type"]).toBe("Course")
    expect(schema.name).toBe("D5 Render Masterclass")
    expect(schema.provider.name).toBe(siteConfig.name)
    expect(schema.hasCourseInstance.offers.price).toBe("49.99")
    expect(schema.hasCourseInstance.offers.priceCurrency).toBe("USD")
  })

  it("generates valid VisualArtwork project schema", () => {
    const schema = generateProjectSchema({
      title: "White Beach Hotel",
      description: "CGI rendering of resort",
      slug: "white-beach-hotel",
      image: "/projects/beach.jpg",
      category: "Commercial",
      year: 2024,
      location: "Sihanoukville"
    })

    expect(schema["@context"]).toBe("https://schema.org")
    expect(schema["@type"]).toBe("VisualArtwork")
    expect(schema.name).toBe("White Beach Hotel")
    expect(schema.creator.name).toBe(siteConfig.author)
    expect(schema.locationCreated?.name).toBe("Sihanoukville")
  })

  it("generates valid BreadcrumbList schema", () => {
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Courses", url: "/courses" },
      { name: "D5 Masterclass", url: "/courses/d5-masterclass" }
    ]
    const schema = generateBreadcrumbSchema(breadcrumbs)

    expect(schema["@type"]).toBe("BreadcrumbList")
    expect(schema.itemListElement.length).toBe(3)
    expect(schema.itemListElement[0].position).toBe(1)
    expect(schema.itemListElement[0].name).toBe("Home")
    expect(schema.itemListElement[2].name).toBe("D5 Masterclass")
  })

  it("generates valid ItemList schema for featured projects", () => {
    const items = [
      { name: "Project 1", url: "/projects/1" },
      { name: "Project 2", url: "/projects/2" }
    ]
    const schema = generateItemListSchema(items)

    expect(schema["@type"]).toBe("ItemList")
    expect(schema.itemListElement.length).toBe(2)
    expect(schema.itemListElement[1].position).toBe(2)
  })
})

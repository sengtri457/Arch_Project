import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { AnimatedTextSection } from "@/components/animated-text-section"
import { WorksGallery } from "@/components/works-gallery"
import { ServicesSection } from "@/components/services-section"
import { TestimonialCarousel } from "@/components/testimonial-carousel"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"
import { getCachedTestimonials, getCachedFeaturedProjects } from "@/lib/supabase/cached-queries"
import { generateItemListSchema, JsonLd } from "@/lib/seo"

export default async function Home() {
  const [testimonials, projects] = await Promise.all([
    getCachedTestimonials(),
    getCachedFeaturedProjects(8)
  ])

  const featuredProjectsSchema = generateItemListSchema(
    projects.map((p) => ({
      name: p.title,
      url: `/projects/${p.id}`,
    }))
  )

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <JsonLd data={featuredProjectsSchema} />
      <Navigation />
      <HeroSection />
      <AnimatedTextSection />
      <WorksGallery projects={projects} />
      <ServicesSection />
      <TestimonialCarousel initialTestimonials={testimonials} />
      <ContactSection />
      <Footer />
    </main>
  )
}

import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createClientClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { EnhancedProjectGallery } from "@/components/enhanced-project-gallery"
import { EnhancedCategorizedGallery } from "@/components/enhanced-categorized-gallery"
import { VideoGallery } from "@/components/video-gallery"
import { Button } from "@/components/ui/button"
import { ProjectHeroMedia } from "@/components/project-hero-media"

export async function generateStaticParams() {
  const supabase = createClientClient()
  const projectsList = await db.getProjects(supabase)
  return projectsList.map((project) => ({
    id: project.id,
  }))
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const project = await db.getProjectBySlug(supabase, id)

  if (!project) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Image/Video - Scrollable Full Natural Size */}
      <div className="relative w-full bg-background" style={{ height: "100vh", overflow: "hidden", position: "relative" }}>
        {/* Back Button - Fixed on top */}
        <div className="absolute top-6 left-6 z-30">
          <Link href="/#work">
            <Button variant="ghost" className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90 border border-border/50">
              <ArrowLeft className="mr-2" size={20} />
              Back to Projects
            </Button>
          </Link>
        </div>

        {/* Scrollable Container for Video/Image */}
        <div 
          className="relative w-full h-full overflow-y-auto overflow-x-hidden"
          style={{
            scrollBehavior: "smooth",
          }}
        >
          {/* Video/Image - Full natural size, scrollable */}
          <ProjectHeroMedia project={project} />

          {/* Project Title Overlay - Sticky at bottom */}
          <div className="sticky bottom-0 left-0 right-0 p-8 md:p-12 z-20 pointer-events-none">
            <div className="container mx-auto">
              <div className="mb-2">
                <span className="text-primary font-medium text-lg">{project.category}</span>
                <span className="text-white/80 ml-3 text-lg">{project.year}</span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-2xl">
                {project.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">{project.description}</p>
            
            {/* Project Features */}
            {project.details.features && project.details.features.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">Key Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {project.details.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-muted-foreground">
                      <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Challenges & Solutions */}
            {((project.details.challenges && project.details.challenges.length > 0) || 
              (project.details.solutions && project.details.solutions.length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {project.details.challenges && project.details.challenges.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Challenges</h3>
                    <ul className="space-y-2">
                      {project.details.challenges.map((challenge, index) => (
                        <li key={index} className="text-muted-foreground flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          {challenge}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {project.details.solutions && project.details.solutions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Solutions</h3>
                    <ul className="space-y-2">
                      {project.details.solutions.map((solution, index) => (
                        <li key={index} className="text-muted-foreground flex items-start">
                          <span className="mr-2" style={{ color: '#9ACD32' }}>•</span>
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Project Details Sidebar */}
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Location</h3>
              <p className="text-foreground">{project.location}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Scope</h3>
              <p className="text-foreground">{project.details.scope}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Duration</h3>
              <p className="text-foreground">{project.details.duration}</p>
            </div>
            {(project.details.bedrooms || project.details.bathrooms || project.details.floors) && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Specifications</h3>
                <div className="space-y-1">
                  {project.details.bedrooms && (
                    <p className="text-foreground">Bedrooms: {project.details.bedrooms}</p>
                  )}
                  {project.details.bathrooms && (
                    <p className="text-foreground">Bathrooms: {project.details.bathrooms}</p>
                  )}
                  {project.details.floors && (
                    <p className="text-foreground">Floors: {project.details.floors}</p>
                  )}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Software</h3>
              <div className="flex flex-wrap gap-2">
                {project.details.software.map((software) => (
                  <span key={software} className="px-3 py-1 bg-secondary text-foreground text-sm">
                    {software}
                  </span>
                ))}
              </div>
            </div>
            {project.testimonials && (
              <div className="border-t pt-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Client Testimonial</h3>
                <blockquote className="text-foreground italic mb-2">
                  "{project.testimonials.quote}"
                </blockquote>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{project.testimonials.author}</p>
                  <p>{project.testimonials.role}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Gallery - If project has videos */}
      {project.videos && project.videos.length > 0 && (
        <div className="container mx-auto px-6 mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Animation & Video Showcase</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience our architectural visualizations through cinematic animations and dynamic presentations
          </p>
          <VideoGallery videos={project.videos} title={project.title} />
        </div>
      )}

      {/* Image Gallery - Enhanced with View Modes */}
      {(project.gallery && Object.keys(project.gallery).length > 0) || (project.images && project.images.length > 0) ? (
        <div className="container mx-auto px-6 mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Project Gallery</h2>
          
          {/* Categorized Gallery with View Modes */}
          {project.gallery && Object.keys(project.gallery).length > 0 && (
            <EnhancedCategorizedGallery gallery={project.gallery} title={project.title} />
          )}

          {/* Fallback to enhanced gallery if categorized gallery is not available */}
          {(!project.gallery || Object.keys(project.gallery).length === 0) && project.images && project.images.length > 0 && (
            <EnhancedProjectGallery images={project.images} title={project.title} />
          )}
        </div>
      ) : null}

      {/* CTA Section */}
      <div className="text-center py-16 border-t border-border">
        <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Start Your Project?</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Let's bring your architectural vision to life with stunning photorealistic visualizations
        </p>
        <Link href="/#contact">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Get in Touch
          </Button>
        </Link>
      </div>
    </main>
  )
}

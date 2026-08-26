import { Project } from "@/lib/projects-data"
import { CollageProjectCard } from "@/components/collage-project-card"
import FadeContent from "@/components/fade-content"

interface WorksGalleryProps {
  projects: Project[]
}

export function WorksGallery({ projects }: WorksGalleryProps) {
  return (
    <section 
      id="work" 
      className="relative py-24 overflow-hidden"
      style={{ backgroundColor: '#060010' }}
      suppressHydrationWarning
    >
      <div className="w-full px-6 relative z-10" suppressHydrationWarning>
        {/* Section Header */}
        <FadeContent delay={0} duration={1000} easing="ease-out" threshold={0.1}>
          <div className="text-left mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Selected Works</h2>
            <p className="text-xl text-gray-300 max-w-2xl">
              Explore our portfolio of photorealistic architectural visualizations
            </p>
          </div>
        </FadeContent>

        {/* Uniform Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((project, index) => {
            return (
              <FadeContent
                key={project.id}
                delay={index * 100}
                duration={800}
                easing="ease-out"
                threshold={0.1}
                initialOpacity={0}
              >
                <div className="w-full h-full">
                   <CollageProjectCard project={project} size="small" />
                </div>
              </FadeContent>
            )
          })}
        </div>
      </div>
    </section>
  )
}

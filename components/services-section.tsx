import Beams from "@/components/Beams"

export function ServicesSection() {
  return (
    <section id="services" className="relative bg-background p-12 md:p-20 min-h-screen flex flex-col justify-center overflow-hidden" suppressHydrationWarning>
      {/* Animated beams background */}
      <div className="absolute inset-0" suppressHydrationWarning>
        <Beams
          beamWidth={2}
          beamHeight={15}
          beamNumber={12}
          lightColor="#ffffff"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={0}
        />
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-6 relative z-10" suppressHydrationWarning>
        <h3 className="text-5xl md:text-6xl font-bold text-foreground mb-12 text-center">Our Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="border-l-4 border-primary pl-6">
            <h4 className="text-xl font-semibold text-foreground mb-2">Exterior Visualization</h4>
            <p className="text-muted-foreground">
              Stunning exterior renders showcasing your building design in its environment with realistic lighting and
              materials.
            </p>
          </div>
          <div className="border-l-4 border-primary pl-6">
            <h4 className="text-xl font-semibold text-foreground mb-2">Interior Visualization</h4>
            <p className="text-muted-foreground">
              Photorealistic interior renders that capture the atmosphere, materials, and spatial qualities of your
              design.
            </p>
          </div>
          <div className="border-l-4 border-primary pl-6">
            <h4 className="text-xl font-semibold text-foreground mb-2">Aerial & Drone Views</h4>
            <p className="text-muted-foreground">
              Bird&apos;s eye perspectives and aerial shots perfect for master planning and large-scale developments.
            </p>
          </div>
          <div className="border-l-4 border-primary pl-6">
            <h4 className="text-xl font-semibold text-foreground mb-2">Animation & Virtual Tours</h4>
            <p className="text-muted-foreground">
              Dynamic walkthroughs and animations that bring your project to life with cinematic quality.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}


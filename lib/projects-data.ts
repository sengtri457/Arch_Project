export interface Project {
  id: string
  project_id?: string
  title: string
  category: string
  description: string
  image: string
  year: string
  location: string
  price: string
  details: {
    client: string
    scope: string
    software: string[]
    duration: string
    area?: string
    bedrooms?: number
    bathrooms?: number
    floors?: number
    features?: string[]
    challenges?: string[]
    solutions?: string[]
  }
  images: string[]
  gallery: {
    exterior: string[]
    interior: string[]
    details: string[]
    aerial?: string[]
  }
  videos?: string[]
  testimonials?: {
    quote: string
    author: string
    role: string
  }
}

export const projects: Project[] = [
  {
    id: "krohom-bookstore",
    title: "Krohom Bookstore",
    category: "Institutional",
    description: "A modern bookstore designed to foster community and learning. Featuring contemporary architecture and welcoming spaces for readers of all ages.",
    image: "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$25,000",
    details: {
      client: "Krohom Bookstore",
      scope: "Exterior & Interior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "4 weeks",
      area: "15,000 sq ft",
      floors: 2,
      features: [
        "Modern educational facilities",
        "Community reading areas",
        "Sustainable design",
        "Natural lighting"
      ],
      challenges: [
        "Integrating modern design with functional requirements",
        "Optimizing natural light for reading areas"
      ],
      solutions: [
        "Open plan layout",
        "Skylights and large windows"
      ]
    },
    images: [
      "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-1.jpg",
      "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-2.jpg",
      "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-3.jpg",
      "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-4.jpg",
      "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-5.jpg",
      "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-6.jpg",
      "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-7.jpg",
      "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-8.jpg",
      "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-9.jpg",
      "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-10.jpg"
    ],
    gallery: {
      exterior: [
        "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-1.jpg",
        "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-2.jpg",
        "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-3.jpg",
        "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-4.jpg",
        "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-5.jpg",
        "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-6.jpg",
        "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-7.jpg",
        "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-8.jpg",
        "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-9.jpg",
        "/24-Krohom bookstore (Institutional)/Lightroom/Exterior-10.jpg"
      ],
      interior: [],
      details: []
    }
  },
  {
    id: "raffle-bookstore",
    title: "Raffle Bookstore",
    category: "Institutional",
    description: "A prestigious bookstore featuring classic architectural design elements mixed with modern functionality. An inspiring space for literature lovers.",
    image: "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$28,000",
    details: {
      client: "Raffle Bookstore",
      scope: "Exterior & Interior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "4 weeks",
      area: "18,000 sq ft",
      floors: 3,
      features: [
        "Classic architectural elements",
        "Spacious reading halls",
        "Modern amenities",
        "Elegant facade"
      ],
      challenges: [
        "Preserving architectural heritage style",
        "Creating functional modern retail space"
      ],
      solutions: [
        "Blend of classic and modern design",
        "Strategic lighting"
      ]
    },
    images: [
      "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-1.jpg",
      "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-2.jpg",
      "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-3.jpg",
      "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-4.jpg",
      "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-5.jpg",
      "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-1-2.jpg",
      "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-2-2.jpg",
      "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-3-2.jpg",
      "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-4-2.jpg",
      "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-5-2.jpg"
    ],
    gallery: {
      exterior: [
        "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-1.jpg",
        "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-2.jpg",
        "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-3.jpg",
        "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-4.jpg",
        "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-5.jpg",
        "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-1-2.jpg",
        "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-2-2.jpg",
        "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-3-2.jpg",
        "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-4-2.jpg",
        "/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-5-2.jpg"
      ],
      interior: [],
      details: []
    }
  },
  {
    id: "hill-house",
    title: "Hill House",
    category: "Residential",
    description:
      "A stunning residential house featuring contemporary architectural design, modern living spaces, and elegant home environments. This residential development showcases sophisticated home architecture with premium finishes, strategic space utilization, and a beautiful design that creates an inspiring living environment.",
    image: "/22-Hill House (Residential)/Lightroom/Exterior-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$18,000",
    details: {
      client: "Private Client",
      scope: "Exterior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "3 weeks",
      area: "5,500 sq ft",
      floors: 2,
      features: [
        "Contemporary residential architecture",
        "Modern living spaces",
        "Premium exterior finishes",
        "Elegant home design",
        "Strategic space utilization",
        "Beautiful landscaping",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic residential building materials and textures",
        "Achieving optimal lighting for different times of day",
        "Showcasing architectural details accurately"
      ],
      solutions: [
        "High-resolution material mapping and texture studies",
        "Advanced daylight simulation and rendering",
        "Detailed architectural element visualization"
      ]
    },
    images: [
      "/22-Hill House (Residential)/Lightroom/Exterior-1.jpg",
      "/22-Hill House (Residential)/Lightroom/Exterior-2.jpg",
      "/22-Hill House (Residential)/Lightroom/Exterior-3.jpg",
      "/22-Hill House (Residential)/Lightroom/Exterior-4.jpg",
      "/22-Hill House (Residential)/Lightroom/Exterior-5.jpg",
      "/22-Hill House (Residential)/Lightroom/Exterior-6.jpg",
      "/22-Hill House (Residential)/Lightroom/Exterior-7.jpg",
      "/22-Hill House (Residential)/Lightroom/Exterior-8.jpg",
      "/22-Hill House (Residential)/Lightroom/Exterior-9.jpg",
      "/22-Hill House (Residential)/Lightroom/Exterior-10.jpg"
    ],
    gallery: {
      exterior: [
        "/22-Hill House (Residential)/Lightroom/Exterior-1.jpg",
        "/22-Hill House (Residential)/Lightroom/Exterior-2.jpg",
        "/22-Hill House (Residential)/Lightroom/Exterior-3.jpg",
        "/22-Hill House (Residential)/Lightroom/Exterior-4.jpg",
        "/22-Hill House (Residential)/Lightroom/Exterior-5.jpg",
        "/22-Hill House (Residential)/Lightroom/Exterior-6.jpg",
        "/22-Hill House (Residential)/Lightroom/Exterior-7.jpg",
        "/22-Hill House (Residential)/Lightroom/Exterior-8.jpg",
        "/22-Hill House (Residential)/Lightroom/Exterior-9.jpg",
        "/22-Hill House (Residential)/Lightroom/Exterior-10.jpg"
      ],
      interior: [],
      details: []
    },
    testimonials: {
      quote: "The residential house visualizations perfectly captured our vision for the home. The photorealistic quality helped us make informed design decisions and visualize the final result before construction.",
      author: "Sophal Chan",
      role: "Homeowner"
    }
  },
  {
    id: "koh-pich-commercial-complex",
    title: "KOH PICH COMMERCIAL COMPLEX",
    category: "Commercial",
    description:
      "A prestigious commercial complex featuring contemporary architectural design, modern retail and office spaces, and innovative urban development. This mixed-use development showcases sophisticated commercial architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates a vibrant commercial hub.",
    image: "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$58,000",
    details: {
      client: "KOH PICH Development",
      scope: "Exterior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "6 weeks",
      area: "450,000 sq ft",
      floors: 20,
      features: [
        "Mixed-use commercial development",
        "Modern retail and office spaces",
        "Premium exterior finishes",
        "Strategic space utilization",
        "Contemporary commercial architecture",
        "Dynamic commercial atmosphere",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic commercial environments",
        "Showcasing multiple program types effectively",
        "Achieving optimal lighting for commercial spaces"
      ],
      solutions: [
        "Advanced lighting simulation for commercial environments",
        "Detailed storefront and office space visualization",
        "Comprehensive material studies for commercial spaces"
      ]
    },
    images: [
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-1.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-2.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-3.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-4.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-5.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-6.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-7.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-8.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-9.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-10.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-11.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-12.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-13.jpg",
      "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-14.jpg"
    ],
    gallery: {
      exterior: [
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-1.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-2.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-3.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-4.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-5.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-6.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-7.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-8.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-9.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-10.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-11.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-12.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-13.jpg",
        "/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-14.jpg"
      ],
      interior: [],
      details: []
    },
    testimonials: {
      quote: "The commercial complex visualizations perfectly captured our vision for the mixed-use development. The photorealistic quality helped us attract premium tenants and secure investor confidence before construction completion.",
      author: "Sokunthea Lim",
      role: "Project Developer"
    }
  },
  {
    id: "lotus-tower-office-building",
    title: "LOTUS TOWER OFFICE BUILDING",
    category: "Office",
    description:
      "A prestigious office tower featuring elegant lotus-inspired architectural design, modern workspace environments, and professional office facilities. This landmark building showcases sophisticated vertical architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates an iconic addition to the city skyline.",
    image: "/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$45,000",
    details: {
      client: "LOTUS Development Group",
      scope: "Exterior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "5 weeks",
      area: "280,000 sq ft",
      floors: 28,
      features: [
        "Lotus-inspired architectural design",
        "Contemporary tower architecture",
        "Modern office spaces",
        "Premium exterior finishes",
        "Iconic urban landmark design",
        "Advanced building systems",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic lotus-inspired architectural elements",
        "Achieving optimal lighting for different times of day",
        "Showcasing vertical architecture accurately"
      ],
      solutions: [
        "High-resolution material mapping and texture studies",
        "Advanced daylight simulation and rendering",
        "Detailed architectural element visualization"
      ]
    },
    images: [
      "/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-1.jpg",
      "/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-2.jpg",
      "/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-3.jpg",
      "/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-4.jpg",
      "/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-5.jpg"
    ],
    gallery: {
      exterior: [
        "/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-1.jpg",
        "/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-2.jpg",
        "/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-3.jpg",
        "/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-4.jpg",
        "/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-5.jpg"
      ],
      interior: [],
      details: []
    },
    testimonials: {
      quote: "The lotus tower visualizations perfectly captured our vision for the iconic landmark. The photorealistic quality helped us secure investors and attract premium tenants before construction completion.",
      author: "Vichea Lim",
      role: "Project Developer"
    }
  },
  {
    id: "norea-head-office",
    title: "NOREA HEAD OFFICE",
    category: "Office",
    description:
      "A prestigious corporate head office featuring contemporary architectural design, modern workspace environments, and professional office facilities. This office building showcases sophisticated corporate architecture with premium finishes, strategic space utilization, and a dynamic professional presence that creates an inspiring workplace environment.",
    image: "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$32,000",
    details: {
      client: "NOREA Corporation",
      scope: "Exterior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "4 weeks",
      area: "120,000 sq ft",
      floors: 15,
      features: [
        "Contemporary office architecture",
        "Modern workspace design",
        "Premium exterior finishes",
        "Professional office facilities",
        "Strategic space utilization",
        "Corporate aesthetic",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic office building materials and textures",
        "Achieving optimal lighting for different times of day",
        "Showcasing architectural details accurately"
      ],
      solutions: [
        "High-resolution material mapping and texture studies",
        "Advanced daylight simulation and rendering",
        "Detailed architectural element visualization"
      ]
    },
    images: [
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-1.jpg",
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-2.jpg",
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-3.jpg",
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-4.jpg",
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-5.jpg",
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-6.jpg",
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-7.jpg",
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-8.jpg",
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-1.jpg",
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-2.jpg",
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-3.jpg",
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-4.jpg",
      "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-5.jpg"
    ],
    gallery: {
      exterior: [
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-1.jpg",
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-2.jpg",
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-3.jpg",
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-4.jpg",
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-5.jpg",
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-6.jpg",
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-7.jpg",
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-8.jpg",
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-1.jpg",
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-2.jpg",
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-3.jpg",
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-4.jpg",
        "/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-5.jpg"
      ],
      interior: [],
      details: []
    },
    testimonials: {
      quote: "The head office visualizations perfectly captured our vision for the corporate space. The photorealistic quality helped us secure tenants and investor confidence before construction completion.",
      author: "Sophal Chea",
      role: "Project Developer"
    }
  },
  {
    id: "the-nes-mall-complex",
    title: "THE NES Mall Complex",
    category: "Commercial",
    description:
      "A modern shopping mall complex featuring contemporary retail architecture, spacious shopping environments, and dynamic commercial spaces. This retail development showcases innovative mall architecture with premium finishes, strategic tenant layouts, and a vibrant commercial atmosphere that attracts shoppers and visitors.",
    image: "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$38,000",
    details: {
      client: "THE NES Development",
      scope: "Exterior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "5 weeks",
      area: "180,000 sq ft",
      floors: 4,
      features: [
        "Modern retail architecture",
        "Spacious shopping environments",
        "Premium retail finishes",
        "Strategic tenant layouts",
        "Contemporary mall architecture",
        "Dynamic commercial atmosphere",
        "Elegant facade design"
      ],
      challenges: [
        "Creating realistic retail environments",
        "Showcasing multiple tenant spaces effectively",
        "Achieving optimal lighting for commercial environments"
      ],
      solutions: [
        "Advanced lighting simulation for retail environments",
        "Detailed storefront and retail space visualization",
        "Comprehensive material studies for commercial spaces"
      ]
    },
    images: [
      "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-1.jpg",
      "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-2.jpg",
      "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-3.jpg",
      "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-4.jpg",
      "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-5.jpg",
      "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-6.jpg",
      "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-7.jpg",
      "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-8.jpg",
      "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-9.jpg",
      "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-10.jpg"
    ],
    gallery: {
      exterior: [
        "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-1.jpg",
        "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-2.jpg",
        "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-3.jpg",
        "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-4.jpg",
        "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-5.jpg",
        "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-6.jpg",
        "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-7.jpg",
        "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-8.jpg",
        "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-9.jpg",
        "/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-10.jpg"
      ],
      interior: [],
      details: []
    },
    testimonials: {
      quote: "The mall complex visualizations perfectly captured our vision for the retail space. The photorealistic quality helped us attract premium tenants and secure investor confidence before construction completion.",
      author: "Ratha Kim",
      role: "Project Developer"
    }
  },
  {
    id: "greenbase-kindergarten",
    title: "GREENBASE Kindergarten",
    category: "Institutional",
    description:
      "A modern kindergarten facility featuring innovative educational design, child-friendly spaces, and inspiring learning environments. This educational institution showcases contemporary architecture with playful design elements, spacious classrooms, safe outdoor play areas, and a nurturing atmosphere that promotes early childhood development.",
    image: "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$22,000",
    details: {
      client: "GREENBASE Education",
      scope: "Exterior & Interior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "3 weeks",
      area: "25,000 sq ft",
      floors: 2,
      features: [
        "Child-friendly design",
        "Spacious classrooms",
        "Safe outdoor play areas",
        "Modern educational facilities",
        "Playful architectural elements",
        "Nurturing learning environment",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating child-appropriate educational environments",
        "Balancing safety with engaging design",
        "Showcasing playful architectural elements"
      ],
      solutions: [
        "Age-appropriate space planning",
        "Safe material selection and finishes",
        "Engaging color schemes and design elements"
      ]
    },
    images: [
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 1.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 2.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 3.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 4.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 5.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 6.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 7.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 8.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 9.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 10.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 11.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 13.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 14.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 15.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 16.jpg",
      "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 17.jpg"
    ],
    gallery: {
      exterior: [
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 1.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 2.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 3.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 4.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 5.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 6.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 7.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 8.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 9.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 10.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 11.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 13.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 14.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 15.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 16.jpg",
        "/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 17.jpg"
      ],
      interior: [],
      details: []
    },
    testimonials: {
      quote: "The kindergarten visualizations perfectly captured our vision for a child-friendly educational space. The playful design elements and safe environments were beautifully showcased, helping us attract families and secure funding.",
      author: "Sopheap Chan",
      role: "Education Director"
    }
  },
  {
    id: "sb-tower",
    title: "SB TOWER",
    category: "Commercial",
    description:
      "A prestigious office tower featuring contemporary architectural design, modern workspace environments, and innovative urban development. This landmark tower showcases sophisticated vertical architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates an iconic addition to the city skyline.",
    image: "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$52,000",
    details: {
      client: "SB Development Group",
      scope: "Exterior & Interior Visualization & Animation",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "6 weeks",
      area: "350,000 sq ft",
      floors: 30,
      features: [
        "Contemporary tower architecture",
        "Modern office spaces",
        "Premium exterior finishes",
        "Strategic vertical space utilization",
        "Iconic urban landmark design",
        "Advanced building systems",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic tower building materials and textures",
        "Achieving optimal lighting for different times of day",
        "Showcasing vertical architecture accurately",
        "Producing photorealistic animations"
      ],
      solutions: [
        "High-resolution material mapping and texture studies",
        "Advanced daylight simulation and rendering",
        "Detailed architectural element visualization",
        "Dynamic camera movements for cinematic presentations"
      ]
    },
    images: [
      "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-1.jpg",
      "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-2.jpg",
      "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-3.jpg",
      "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-4.jpg",
      "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-5.jpg",
      "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-6.jpg",
      "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-7.jpg",
      "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-8.jpg",
      "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-9.jpg",
      "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-10.jpg",
      "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-11.jpg",
      "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-12.jpg"
    ],
    gallery: {
      exterior: [
        "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-1.jpg",
        "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-2.jpg",
        "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-3.jpg",
        "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-4.jpg",
        "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-5.jpg",
        "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-6.jpg",
        "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-7.jpg",
        "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-8.jpg",
        "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-9.jpg",
        "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-10.jpg",
        "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-11.jpg",
        "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-12.jpg"
      ],
      interior: [],
      details: []
    },
    videos: [
      "/16-SB TOWER (Commercial)/Animation/Clip 1.mp4",
      "/16-SB TOWER (Commercial)/Animation/Clip 2.mp4",
      "/16-SB TOWER (Commercial)/Animation/Clip 3.mp4",
      "/16-SB TOWER (Commercial)/Animation/Clip 4.mp4"
    ],
    testimonials: {
      quote: "The tower visualizations and animations exceeded all expectations. The photorealistic quality and cinematic presentations helped us secure investors and attract premium tenants before construction even began.",
      author: "Sokunthea Bun",
      role: "Development Director"
    }
  },
  {
    id: "apac-building",
    title: "APAC BUILDING",
    category: "Commercial",
    description:
      "A prestigious twin tower building featuring contemporary architectural design, modern commercial spaces, and innovative urban development. This landmark development showcases sophisticated twin tower architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates an iconic addition to the city skyline.",
    image: "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$55,000",
    details: {
      client: "APAC Development",
      scope: "Exterior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "5 weeks",
      area: "400,000 sq ft",
      floors: 25,
      features: [
        "Twin tower design",
        "Contemporary architecture",
        "Modern commercial spaces",
        "Premium exterior finishes",
        "Iconic urban landmark",
        "Advanced building systems",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic twin tower materials and textures",
        "Achieving optimal lighting for different times of day",
        "Showcasing architectural symmetry accurately"
      ],
      solutions: [
        "High-resolution material mapping and texture studies",
        "Advanced daylight simulation and rendering",
        "Detailed architectural element visualization"
      ]
    },
    images: [
      "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-1.jpg",
      "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-2.jpg",
      "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-3.jpg",
      "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-4.jpg",
      "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-5.jpg",
      "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-6.jpg",
      "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-7.jpg",
      "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-8.jpg",
      "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-9.jpg"
    ],
    gallery: {
      exterior: [
        "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-1.jpg",
        "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-2.jpg",
        "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-3.jpg",
        "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-4.jpg",
        "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-5.jpg",
        "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-6.jpg",
        "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-7.jpg",
        "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-8.jpg",
        "/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-9.jpg"
      ],
      interior: [],
      details: []
    },
    testimonials: {
      quote: "The twin tower visualizations perfectly captured our vision for the landmark development. The photorealistic quality helped us secure investors and attract tenants before construction completion.",
      author: "Vichea Lim",
      role: "Project Developer"
    }
  },
  {
    id: "white-beach-hotel",
    title: "WHITE BEACH HOTEL BY SB",
    category: "Residential",
    description:
      "A luxurious beachfront hotel featuring elegant architectural design, stunning ocean views, and premium hospitality facilities. This seaside resort showcases contemporary hotel architecture with curved building designs, spacious guest rooms, world-class amenities, and a serene beachfront atmosphere that provides guests with an unforgettable vacation experience.",
    image: "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-1.jpg",
    year: "2024",
    location: "Cambodia",
    price: "$48,000",
    details: {
      client: "SB Hospitality Group",
      scope: "Exterior & Interior Visualization & Animation",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "7 weeks",
      area: "180,000 sq ft",
      floors: 6,
      features: [
        "Elegant curved building design",
        "Stunning ocean views",
        "Spacious guest rooms",
        "World-class amenities",
        "Beachfront location",
        "Premium hospitality facilities",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic beachfront environments",
        "Showcasing curved architectural elements",
        "Achieving photorealistic water and lighting effects"
      ],
      solutions: [
        "Advanced 3D modeling for curved structures",
        "Comprehensive material and lighting studies",
        "Dynamic camera movements and cinematic presentations"
      ]
    },
    images: [
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-1.jpg",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-2.jpg",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-3.jpg",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-4.jpg",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-5.jpg",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-6.jpg",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-7.jpg",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-8.jpg"
    ],
    gallery: {
      exterior: [
        "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-1.jpg",
        "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-2.jpg",
        "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-3.jpg",
        "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-4.jpg",
        "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-5.jpg",
        "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-6.jpg",
        "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-7.jpg",
        "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-8.jpg"
      ],
      interior: [],
      details: []
    },
    videos: [
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Animation/Clip 1.mp4",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Animation/Clip 2.mp4",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Animation/Clip 3.mp4",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Animation/Clip 4.mp4",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Animation/Clip 5.mp4",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Animation/Clip 6.mp4",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Animation/Clip 7.mp4",
      "/14-WHITE BEACH HOTEL BY SB (Residential)/Animation/Clip 8.mp4"
    ],
    testimonials: {
      quote: "The beachfront hotel visualizations and animations perfectly captured our vision. The photorealistic quality and cinematic presentations helped us secure investors and attract guests before opening.",
      author: "Sokunthea Bun",
      role: "Hotel Director"
    }
  },
  {
    id: "westline-university",
    title: "WESTLINE UNIVERSITY",
    category: "Institutional",
    description:
      "A prestigious university campus featuring innovative architectural design, modern educational facilities, and inspiring learning environments. This academic institution showcases contemporary campus architecture with spacious classrooms, advanced research facilities, and a dynamic campus atmosphere that promotes academic excellence and student engagement.",
    image: "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 1_1_upscale01.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$42,000",
    details: {
      client: "WESTLINE University",
      scope: "Exterior & Interior Visualization & Animation",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "6 weeks",
      area: "220,000 sq ft",
      floors: 7,
      features: [
        "Modern educational facilities",
        "Spacious classrooms and lecture halls",
        "Advanced research laboratories",
        "Student common areas",
        "Contemporary campus architecture",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic educational environments",
        "Achieving photorealistic animations and renders",
        "Balancing multiple functional requirements"
      ],
      solutions: [
        "Advanced 3D modeling and animation techniques",
        "Comprehensive material and lighting studies",
        "Dynamic camera movements and cinematic presentations"
      ]
    },
    images: [
      "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 1_1_upscale01.jpg",
      "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 2_1_upscale01.jpg",
      "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 3_1_upscale01.jpg",
      "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 4_1_upscale01.jpg",
      "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 5.jpg",
      "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 6.jpg",
      "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 7.jpg"
    ],
    gallery: {
      exterior: [
        "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 1_1_upscale01.jpg",
        "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 2_1_upscale01.jpg",
        "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 3_1_upscale01.jpg",
        "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 4_1_upscale01.jpg",
        "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 5.jpg",
        "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 6.jpg",
        "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 7.jpg"
      ],
      interior: [],
      details: []
    },
    videos: [
      "/13-WESTLINE UNIVERSITY (Institutional)/video/Clip 2.mp4",
      "/13-WESTLINE UNIVERSITY (Institutional)/video/Clip 3.mp4",
      "/13-WESTLINE UNIVERSITY (Institutional)/video/Clip 4.mp4",
      "/13-WESTLINE UNIVERSITY (Institutional)/video/Clip 5.mp4",
      "/13-WESTLINE UNIVERSITY (Institutional)/video/Clip 6.mp4",
      "/13-WESTLINE UNIVERSITY (Institutional)/video/Clip 7.mp4"
    ],
    testimonials: {
      quote: "The university campus visualizations and animations exceeded all expectations. The photorealistic quality helped us secure funding and attract students before construction even began.",
      author: "Dr. Ratha Sok",
      role: "University Director"
    }
  },
  {
    id: "high-rise-building",
    title: "HIGH RISE BUILDING",
    category: "Commercial",
    description:
      "A prestigious high-rise building featuring contemporary architectural design, modern office and residential spaces, and innovative urban development. This landmark tower showcases sophisticated vertical architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates an iconic addition to the city skyline.",
    image: "/12-HIGH RISE BUILDING (Commercial)/Render image/Scene 1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$50,000",
    details: {
      client: "High Rise Development Group",
      scope: "Exterior & Interior Visualization & Animation",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "7 weeks",
      area: "500,000 sq ft",
      floors: 35,
      features: [
        "Contemporary high-rise architecture",
        "Modern office and residential spaces",
        "Premium exterior finishes",
        "Strategic vertical space utilization",
        "Iconic urban landmark design",
        "Advanced building systems",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic high-rise building materials and textures",
        "Achieving optimal lighting for different times of day",
        "Showcasing vertical architecture accurately",
        "Producing photorealistic animations"
      ],
      solutions: [
        "High-resolution material mapping and texture studies",
        "Advanced daylight simulation and rendering",
        "Detailed architectural element visualization",
        "Dynamic camera movements for cinematic presentations"
      ]
    },
    images: [
      "/12-HIGH RISE BUILDING (Commercial)/Render image/Scene 1.jpg"
    ],
    gallery: {
      exterior: [
        "/12-HIGH RISE BUILDING (Commercial)/Render image/Scene 1.jpg"
      ],
      interior: [],
      details: []
    },
    videos: [
      "/12-HIGH RISE BUILDING (Commercial)/VIDEO/Clip 1.mp4",
      "/12-HIGH RISE BUILDING (Commercial)/VIDEO/Clip 2.mp4",
      "/12-HIGH RISE BUILDING (Commercial)/VIDEO/Clip 3.mp4",
      "/12-HIGH RISE BUILDING (Commercial)/VIDEO/Clip 4.mp4",
      "/12-HIGH RISE BUILDING (Commercial)/VIDEO/Clip 5.mp4",
      "/12-HIGH RISE BUILDING (Commercial)/VIDEO/Clip 6.mp4",
      "/12-HIGH RISE BUILDING (Commercial)/VIDEO/Clip 7.mp4",
      "/12-HIGH RISE BUILDING (Commercial)/VIDEO/Clip 8.mp4",
      "/12-HIGH RISE BUILDING (Commercial)/VIDEO/Clip 9.mp4",
      "/12-HIGH RISE BUILDING (Commercial)/VIDEO/Clip 10.mp4"
    ],
    testimonials: {
      quote: "The high-rise building visualizations and animations exceeded all expectations. The photorealistic quality and cinematic presentations helped us secure investors and attract premium tenants before construction even began.",
      author: "Sokunthea Chea",
      role: "Development Director"
    }
  },
  {
    id: "the-curve-k-shopping-mall",
    title: "THE CURVE K SHOPPING MALL",
    category: "Commercial",
    description:
      "A prestigious shopping mall featuring innovative curved architectural design, modern retail spaces, and dynamic commercial environments. This retail development showcases contemporary mall architecture with elegant curves, premium shopping experiences, strategic tenant layouts, and a vibrant commercial atmosphere that attracts shoppers and visitors.",
    image: "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$35,000",
    details: {
      client: "THE CURVE K Development",
      scope: "Exterior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "5 weeks",
      area: "200,000 sq ft",
      floors: 5,
      features: [
        "Innovative curved architectural design",
        "Modern retail spaces",
        "Premium shopping environments",
        "Strategic tenant layouts",
        "Contemporary mall architecture",
        "Dynamic commercial atmosphere",
        "Elegant facade design"
      ],
      challenges: [
        "Creating realistic curved architectural elements",
        "Showcasing multiple retail spaces effectively",
        "Achieving optimal lighting for commercial environments",
        "Capturing the elegant curved facade design"
      ],
      solutions: [
        "Advanced 3D modeling for curved structures",
        "Comprehensive material and lighting studies",
        "Detailed storefront and retail space visualization",
        "Photorealistic rendering techniques"
      ]
    },
    images: [
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-1.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-2.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-3.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-4.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-5.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-6.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-7.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-8.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-9.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-10.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-11.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-12.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-13.jpg",
      "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-14.jpg"
    ],
    gallery: {
      exterior: [
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-1.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-2.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-3.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-4.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-5.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-6.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-7.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-8.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-9.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-10.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-11.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-12.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-13.jpg",
        "/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-14.jpg"
      ],
      interior: [],
      details: []
    },
    testimonials: {
      quote: "The shopping mall visualizations perfectly captured our vision for the curved architectural design. The photorealistic quality helped us attract premium tenants and secure investor confidence before construction completion.",
      author: "Ratha Kim",
      role: "Project Developer"
    }
  },
  {
    id: "rufer-university",
    title: "RUFER UNIVERSITY",
    category: "Institutional",
    description:
      "A prestigious university campus featuring innovative architectural design, modern educational facilities, and inspiring learning environments. This academic institution showcases contemporary campus architecture with curved building designs, spacious classrooms, advanced research facilities, and a dynamic campus atmosphere that promotes academic excellence and student engagement.",
    image: "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$45,000",
    details: {
      client: "RUFER University",
      scope: "Exterior & Interior Visualization & Animation",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "6 weeks",
      area: "250,000 sq ft",
      floors: 8,
      features: [
        "Innovative curved building design",
        "Modern educational facilities",
        "Spacious classrooms and lecture halls",
        "Advanced research laboratories",
        "Student common areas and cafeterias",
        "Contemporary campus architecture",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic educational environments",
        "Showcasing curved architectural elements",
        "Achieving photorealistic animations and renders",
        "Balancing multiple functional requirements"
      ],
      solutions: [
        "Advanced 3D modeling for curved structures",
        "Comprehensive material and lighting studies",
        "Dynamic camera movements and cinematic presentations",
        "Detailed interior and exterior visualization"
      ]
    },
    images: [
      "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-1.jpg",
      "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-2.jpg",
      "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-3.jpg",
      "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-4.jpg",
      "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-5.jpg",
      "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-6.jpg",
      "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-7.jpg",
      "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-8.jpg",
      "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-9.jpg",
      "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-10.jpg",
      "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-11.jpg"
    ],
    gallery: {
      exterior: [
        "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-1.jpg",
        "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-2.jpg",
        "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-3.jpg",
        "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-4.jpg",
        "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-5.jpg",
        "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-6.jpg",
        "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-7.jpg",
        "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-8.jpg",
        "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-9.jpg",
        "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-10.jpg",
        "/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-11.jpg"
      ],
      interior: [],
      details: []
    },
    videos: [
      "/10-RUFER UNIVERSITY (Institutional)/Animation/Clip 1.mp4",
      "/10-RUFER UNIVERSITY (Institutional)/Animation/Clip 2.mp4",
      "/10-RUFER UNIVERSITY (Institutional)/Animation/Clip 3.mp4",
      "/10-RUFER UNIVERSITY (Institutional)/Animation/Clip 4.mp4",
      "/10-RUFER UNIVERSITY (Institutional)/Animation/Clip 5.mp4",
      "/10-RUFER UNIVERSITY (Institutional)/Animation/Clip 6.mp4",
      "/10-RUFER UNIVERSITY (Institutional)/Animation/Clip 7.mp4",
      "/10-RUFER UNIVERSITY (Institutional)/Animation/Clip 8.mp4",
      "/10-RUFER UNIVERSITY (Institutional)/Animation/Clip 9.mp4"
    ],
    testimonials: {
      quote: "The university campus visualizations and animations exceeded all expectations. The curved building designs were beautifully captured, and the cinematic presentations helped us secure funding and attract students before construction even began.",
      author: "Dr. Sopheak Lim",
      role: "University Director"
    }
  },
  {
    id: "haffity-sport-shopping-center",
    title: "HAFFITY SPORT SHOPPING CENTER",
    category: "Commercial",
    description:
      "A modern sports shopping center featuring contemporary retail architecture, spacious shopping environments, and dynamic design elements. This commercial development showcases innovative retail spaces with premium finishes, strategic tenant layouts, and a vibrant shopping experience that attracts sports enthusiasts and visitors.",
    image: "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 1_upscale01.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$28,000",
    details: {
      client: "HAFFITY Group",
      scope: "Exterior & Interior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "4 weeks",
      area: "150,000 sq ft",
      floors: 4,
      features: [
        "Modern sports retail architecture",
        "Spacious shopping environments",
        "Dynamic design elements",
        "Premium retail finishes",
        "Strategic tenant layouts",
        "Vibrant commercial atmosphere"
      ],
      challenges: [
        "Creating realistic retail environments and storefronts",
        "Showcasing multiple tenant spaces effectively",
        "Achieving optimal lighting for shopping experiences"
      ],
      solutions: [
        "Advanced lighting simulation for retail environments",
        "Detailed storefront and interior visualization",
        "Comprehensive material studies for commercial spaces"
      ]
    },
    images: [
      "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 1_upscale01.jpg",
      "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 3_upscale01.jpg",
      "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 5_upscale01.jpg",
      "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 6_1_upscale01.jpg",
      "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 7_upscale01.jpg",
      "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 8_upscale01.jpg",
      "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 9_upscale01.jpg",
      "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 10_upscale01.jpg"
    ],
    gallery: {
      exterior: [
        "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 1_upscale01.jpg",
        "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 3_upscale01.jpg",
        "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 5_upscale01.jpg",
        "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 6_1_upscale01.jpg",
        "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 7_upscale01.jpg",
        "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 8_upscale01.jpg",
        "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 9_upscale01.jpg",
        "/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 10_upscale01.jpg"
      ],
      interior: [],
      details: []
    },
    testimonials: {
      quote: "The sports shopping center visualizations perfectly captured our vision for the retail space. The photorealistic quality helped us attract premium tenants and secure investor confidence before construction completion.",
      author: "Sokha Chan",
      role: "Project Developer"
    }
  },
  {
    id: "kalmet-office-building",
    title: "KALMET OFFICE BUILDING",
    category: "Institutional",
    description:
      "A modern office building featuring contemporary architectural design, sleek facades, and professional workspace environments. This commercial development showcases sophisticated corporate architecture with premium finishes, strategic design elements, and a professional aesthetic that creates an inspiring workplace environment.",
    image: "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$25,000",
    details: {
      client: "KALMET Group",
      scope: "Exterior & Interior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "4 weeks",
      area: "180,000 sq ft",
      floors: 12,
      features: [
        "Modern office architecture",
        "Contemporary facade design",
        "Premium exterior finishes",
        "Professional workspace design",
        "Strategic lighting design",
        "Corporate aesthetic"
      ],
      challenges: [
        "Creating realistic office building materials and textures",
        "Achieving optimal lighting for different times of day",
        "Showcasing architectural details accurately"
      ],
      solutions: [
        "High-resolution material mapping and texture studies",
        "Advanced daylight simulation and rendering",
        "Detailed architectural element visualization"
      ]
    },
    images: [
      "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 1.jpg",
      "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 2.jpg",
      "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 3.jpg",
      "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 4.jpg",
      "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 5.jpg",
      "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 6.jpg",
      "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 7.jpg",
      "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 8.jpg",
      "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 9.jpg",
      "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 10.jpg",
      "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 11.jpg",
      "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 12.jpg"
    ],
    gallery: {
      exterior: [
        "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 1.jpg",
        "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 2.jpg",
        "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 3.jpg",
        "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 4.jpg",
        "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 5.jpg",
        "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 6.jpg",
        "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 7.jpg",
        "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 8.jpg",
        "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 9.jpg",
        "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 10.jpg",
        "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 11.jpg",
        "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 12.jpg"
      ],
      interior: [],
      details: []
    },
    testimonials: {
      quote: "The office building visualizations perfectly captured our vision for the corporate space. The photorealistic quality helped us secure tenants and investor confidence before construction completion.",
      author: "Vichea Lim",
      role: "Project Developer"
    }
  },
  {
    id: "liveron-sportcenter",
    title: "LIVERON SPORTCENTER",
    category: "Institutional",
    description:
      "A modern sports center featuring contemporary architectural design, state-of-the-art sports facilities, and dynamic recreational spaces. This institutional development showcases innovative sports architecture with premium finishes, strategic space utilization, and a vibrant athletic atmosphere that promotes health and wellness.",
    image: "/06-LIVERON SPORTCENTER(Institutional)/RENDER IMAGE/Sport-01-3.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$22,000",
    details: {
      client: "LIVERON Sports",
      scope: "Exterior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "3 weeks",
      area: "35,000 sq ft",
      floors: 2,
      features: [
        "Modern sports facilities",
        "Contemporary architectural design",
        "Premium exterior finishes",
        "Dynamic recreational spaces",
        "State-of-the-art equipment areas",
        "Vibrant athletic atmosphere"
      ],
      challenges: [
        "Creating realistic sports facility environments",
        "Showcasing athletic spaces effectively",
        "Achieving optimal lighting for sports activities"
      ],
      solutions: [
        "Advanced lighting simulation for sports environments",
        "Detailed facility and space visualization",
        "Comprehensive material studies for institutional spaces"
      ]
    },
    images: [
      "/06-LIVERON SPORTCENTER(Institutional)/RENDER IMAGE/Sport-01-3.jpg",
      "/06-LIVERON SPORTCENTER(Institutional)/RENDER IMAGE/Sport-9.jpg"
    ],
    gallery: {
      exterior: [
        "/06-LIVERON SPORTCENTER(Institutional)/RENDER IMAGE/Sport-01-3.jpg",
        "/06-LIVERON SPORTCENTER(Institutional)/RENDER IMAGE/Sport-9.jpg"
      ],
      interior: [],
      details: []
    },
    testimonials: {
      quote: "The sports center visualizations perfectly captured our vision for the athletic facility. The photorealistic quality helped us secure funding and attract members before construction completion.",
      author: "Sokha Bun",
      role: "Sports Director"
    }
  },
  {
    id: "mixed-use-building-04",
    title: "MIXED USE BUILDING",
    category: "Commercial",
    description:
      "A prestigious mixed-use building featuring contemporary architectural design, modern commercial and residential spaces, and innovative urban development. This landmark development showcases sophisticated mixed-use architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates a vibrant community hub.",
    image: "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$48,000",
    details: {
      client: "Mixed Use Development Group",
      scope: "Exterior & Interior Visualization & Animation",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "6 weeks",
      area: "320,000 sq ft",
      floors: 18,
      features: [
        "Mixed-use commercial and residential spaces",
        "Contemporary architecture",
        "Modern commercial and living environments",
        "Premium exterior finishes",
        "Strategic space utilization",
        "Iconic urban landmark",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic mixed-use building materials and textures",
        "Achieving optimal lighting for different program types",
        "Showcasing multiple uses effectively",
        "Producing photorealistic animations"
      ],
      solutions: [
        "High-resolution material mapping and texture studies",
        "Advanced daylight simulation and rendering",
        "Detailed architectural element visualization",
        "Dynamic camera movements for cinematic presentations"
      ]
    },
    images: [
      "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-1.jpg",
      "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-2.jpg",
      "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-3.jpg",
      "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-4.jpg",
      "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-5.jpg",
      "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-6.jpg",
      "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-7.jpg",
      "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-8.jpg",
      "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-9.jpg",
      "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-10.jpg",
      "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-11.jpg"
    ],
    gallery: {
      exterior: [
        "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-1.jpg",
        "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-2.jpg",
        "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-3.jpg",
        "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-4.jpg",
        "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-5.jpg",
        "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-6.jpg",
        "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-7.jpg",
        "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-8.jpg",
        "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-9.jpg",
        "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-10.jpg",
        "/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-11.jpg"
      ],
      interior: [],
      details: []
    },
    videos: [
      "/04-MIXED USE BUILDING(Commercial)/ANIMATION/Clip 2.mp4",
      "/04-MIXED USE BUILDING(Commercial)/ANIMATION/Clip 3.mp4",
      "/04-MIXED USE BUILDING(Commercial)/ANIMATION/Clip 4.mp4",
      "/04-MIXED USE BUILDING(Commercial)/ANIMATION/Clip 5.mp4",
      "/04-MIXED USE BUILDING(Commercial)/ANIMATION/Clip 6.mp4",
      "/04-MIXED USE BUILDING(Commercial)/ANIMATION/Clip 7.mp4",
      "/04-MIXED USE BUILDING(Commercial)/ANIMATION/Clip 8.mp4"
    ],
    testimonials: {
      quote: "The mixed-use building visualizations and animations exceeded all expectations. The photorealistic quality and cinematic presentations helped us secure investors and attract tenants before construction even began.",
      author: "Sokunthea Chea",
      role: "Development Director"
    }
  },
  {
    id: "trivienna-mixed-use-building",
    title: "TRIVIENNA MIXED USE BUILDING",
    category: "Commercial",
    description:
      "A prestigious mixed-use building featuring contemporary architectural design, modern commercial and residential spaces, and innovative urban development. This landmark development showcases sophisticated mixed-use architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates a vibrant community hub.",
    image: "/03-TRIVIENNA MIXED USE BUILDING(Commercial)/ANIMATION/Clip 14.mp4",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$45,000",
    details: {
      client: "TRIVIENNA Development Group",
      scope: "Exterior & Interior Visualization & Animation",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "6 weeks",
      area: "300,000 sq ft",
      floors: 20,
      features: [
        "Mixed-use commercial and residential spaces",
        "Contemporary architecture",
        "Modern commercial and living environments",
        "Premium exterior finishes",
        "Strategic space utilization",
        "Iconic urban landmark",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic mixed-use building materials and textures",
        "Achieving optimal lighting for different program types",
        "Showcasing multiple uses effectively",
        "Producing photorealistic animations"
      ],
      solutions: [
        "High-resolution material mapping and texture studies",
        "Advanced daylight simulation and rendering",
        "Detailed architectural element visualization",
        "Dynamic camera movements for cinematic presentations"
      ]
    },
    images: [],
    gallery: {
      exterior: [],
      interior: [],
      details: []
    },
    videos: [
      "/03-TRIVIENNA MIXED USE BUILDING(Commercial)/ANIMATION/Clip 14.mp4",
      "/03-TRIVIENNA MIXED USE BUILDING(Commercial)/ANIMATION/Clip 16.mp4",
      "/03-TRIVIENNA MIXED USE BUILDING(Commercial)/ANIMATION/Clip 17.mp4"
    ],
    testimonials: {
      quote: "The mixed-use building animations exceeded all expectations. The photorealistic quality and cinematic presentations helped us secure investors and attract tenants before construction even began.",
      author: "Vichea Lim",
      role: "Development Director"
    }
  },
  {
    id: "the-peak-shopping-mall",
    title: "The Peak Shopping Mall",
    category: "Commercial",
    description:
      "A prestigious shopping mall featuring contemporary architectural design, modern retail spaces, and dynamic commercial environments. This retail development showcases innovative mall architecture with premium finishes, strategic tenant layouts, and a vibrant commercial atmosphere that attracts shoppers and visitors.",
    image: "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$42,000",
    details: {
      client: "The Peak Development",
      scope: "Exterior & Interior Visualization & Animation",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "6 weeks",
      area: "250,000 sq ft",
      floors: 5,
      features: [
        "Modern retail architecture",
        "Spacious shopping environments",
        "Premium retail finishes",
        "Strategic tenant layouts",
        "Contemporary mall architecture",
        "Dynamic commercial atmosphere",
        "Elegant facade design"
      ],
      challenges: [
        "Creating realistic retail environments",
        "Showcasing multiple tenant spaces effectively",
        "Achieving optimal lighting for commercial environments",
        "Producing photorealistic animations"
      ],
      solutions: [
        "Advanced lighting simulation for retail environments",
        "Detailed storefront and retail space visualization",
        "Comprehensive material studies for commercial spaces",
        "Dynamic camera movements for cinematic presentations"
      ]
    },
    images: [
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 1.jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 4.jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 5.jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 6.jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 7.jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 9.jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 10.jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 11.jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 12.jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 13.jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 14.jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 15.jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/URBAN 3BUILDING (1 of 8).jpg",
      "/02-The Peak Shopping Mall (Commercial)/Lightroom/URBAN 3BUILDING (1 of 8)1.jpg"
    ],
    gallery: {
      exterior: [
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 1.jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 4.jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 5.jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 6.jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 7.jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 9.jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 10.jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 11.jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 12.jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 13.jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 14.jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 15.jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/URBAN 3BUILDING (1 of 8).jpg",
        "/02-The Peak Shopping Mall (Commercial)/Lightroom/URBAN 3BUILDING (1 of 8)1.jpg"
      ],
      interior: [],
      details: []
    },
    videos: [
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 1.mp4",
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 3.mp4",
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 4.mp4",
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 5.mp4",
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 6.mp4",
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 7.mp4",
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 9.mp4",
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 10.mp4",
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 11.mp4",
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 12.mp4",
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 13.mp4",
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 14.mp4",
      "/02-The Peak Shopping Mall (Commercial)/VIDEO/Clip 15.mp4"
    ],
    testimonials: {
      quote: "The shopping mall visualizations and animations perfectly captured our vision for the retail space. The photorealistic quality helped us attract premium tenants and secure investor confidence before construction completion.",
      author: "Ratha Kim",
      role: "Project Developer"
    }
  },
  {
    id: "mca-condo-complex",
    title: "MCA CONDO COMPLEX",
    category: "Residential",
    description:
      "A prestigious residential condominium complex featuring contemporary architectural design, modern living spaces, and elegant residential environments. This residential development showcases sophisticated condo architecture with premium finishes, strategic space utilization, and a beautiful design that creates an inspiring living environment.",
    image: "/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-1.jpg",
    year: "2024",
    location: "Phnom Penh, Cambodia",
    price: "$35,000",
    details: {
      client: "MCA Development",
      scope: "Exterior Visualization",
      software: ["D5 Render", "Photoshop", "Sketchup"],
      duration: "4 weeks",
      area: "180,000 sq ft",
      floors: 15,
      features: [
        "Contemporary residential architecture",
        "Modern living spaces",
        "Premium exterior finishes",
        "Elegant condo design",
        "Strategic space utilization",
        "Beautiful landscaping",
        "Sustainable design elements"
      ],
      challenges: [
        "Creating realistic residential building materials and textures",
        "Achieving optimal lighting for different times of day",
        "Showcasing architectural details accurately"
      ],
      solutions: [
        "High-resolution material mapping and texture studies",
        "Advanced daylight simulation and rendering",
        "Detailed architectural element visualization"
      ]
    },
    images: [
      "/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-1.jpg",
      "/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-2.jpg",
      "/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-3.jpg",
      "/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-4.jpg",
      "/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-5.jpg"
    ],
    gallery: {
      exterior: [
        "/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-1.jpg",
        "/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-2.jpg",
        "/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-3.jpg",
        "/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-4.jpg",
        "/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-5.jpg"
      ],
      interior: [],
      details: []
    },
    testimonials: {
      quote: "The condominium complex visualizations perfectly captured our vision for the residential space. The photorealistic quality helped us attract buyers and secure investor confidence before construction completion.",
      author: "Sophal Chan",
      role: "Project Developer"
    }
  }
]

// Export all projects for Selected Works section
export const limitedProjects = projects

export interface Course {
  id: string
  course_id?: string
  slug?: string
  title: string
  description: string
  image: string
  category: string
  duration: string
  level: string
  price: string
  features: string[]
  instructor: string
  students: number
  lessons: number
  introduction_url?: string
  software_used?: string | null
  thumbnail_url?: string
}

export const courses: Course[] = [
  {
    id: "d5-masterclass",
    title: "D5 Masterclass",
    description: "Master the art of real-time rendering with D5 Render. Create stunning photorealistic visualizations with speed and efficiency.",
    image: "/assets/images/D5_class_img/D5_Cover.jpg",
    category: "Rendering",
    duration: "6 weeks",
    level: "Intermediate to Advanced",
    price: "$49.99",
    features: [
      "Real-time rendering workflow",
      "Advanced lighting and materials",
      "Animation and video production",
      "Environment and landscape creation",
      "Post-processing in D5"
    ],
    instructor: "Bun Sambath",
    students: 1500,
    lessons: 10,
    software_used: "D5 Render"
  },
  {
    id: "enscape-masterclass",
    title: "Enscape Masterclass",
    description: "Learn to create beautiful real-time architectural visualizations directly from your modeling software using Enscape.",
    image: "/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-1.jpg",
    category: "Rendering",
    duration: "5 weeks",
    level: "Beginner to Intermediate",
    price: "$49.99",
    features: [
      "Seamless integration workflow",
      "Lighting and atmosphere settings",
      "Asset library management",
      "VR and panorama creation",
      "Video walkthroughs"
    ],
    instructor: "Bun Sambath",
    students: 1200,
    lessons: 35,
    software_used: "Enscape"
  },
  {
    id: "indesign-masterclass",
    title: "InDesign Masterclass",
    description: "Create professional architectural presentations, portfolios, and layout designs using Adobe InDesign.",
    image: "/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 1.jpg",
    category: "Post-Production",
    duration: "4 weeks",
    level: "Beginner to Intermediate",
    price: "$49.99",
    features: [
      "Portfolio layout design",
      "Typography and grid systems",
      "Image management and links",
      "Presentation board creation",
      "Print vs. digital workflows"
    ],
    instructor: "Bun Sambath",
    students: 850,
    lessons: 28,
    software_used: "Adobe InDesign"
  },
  {
    id: "photoshop-masterclass",
    title: "Photoshop Masterclass",
    description: "Elevate your renders with advanced post-production techniques. Learn compositing, color grading, and matte painting.",
    image: "/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 1_1_upscale01.jpg",
    category: "Post-Production",
    duration: "6 weeks",
    level: "All Levels",
    price: "$49.99",
    features: [
      "Advanced compositing",
      "Color grading and mood",
      "Matte painting techniques",
      "Adding people and vegetation",
      "Final image polish"
    ],
    instructor: "Bun Sambath",
    students: 1800,
    lessons: 45,
    software_used: "Adobe Photoshop"
  }
]

export interface Lesson {
  lesson_id: string
  module_id?: string
  order_index: number
  title: string
  duration_minutes: number
  is_preview: boolean
  downloadable_asset_url?: string | null
  cover_image?: string
  thumbnail_url?: string
  description?: string
  video_url?: string | null
}

export interface CourseModule {
  module_id: string
  lesson_id?: string // for backwards compatibility
  course_id?: string
  order_index: number
  module_number: string
  title: string
  cover_image: string
  duration_minutes: number
  is_preview: boolean
  description?: string
  lessons: Lesson[]
}

export const D5_LESSON_ALIAS_MAP: Record<string, string> = {
  "d5-m01": "d5d30129-234b-4b2a-8d19-450f612d4cf7",
  "d5-m02": "d59a6cf7-7756-42d4-bb34-8c6a0c021c32",
  "d5-m03": "d5030129-234b-4b2a-8d19-450f612d4cf7",
  "d5-m04": "d5040129-234b-4b2a-8d19-450f612d4cf7",
  "d5-m05": "d5050129-234b-4b2a-8d19-450f612d4cf7",
  "d5-m06": "d5060129-234b-4b2a-8d19-450f612d4cf7",
  "d5-m07": "d5070129-234b-4b2a-8d19-450f612d4cf7",
  "d5-m08": "d5080129-234b-4b2a-8d19-450f612d4cf7",
  "d5-m09": "d5090129-234b-4b2a-8d19-450f612d4cf7",
  "d5-m10": "d5100129-234b-4b2a-8d19-450f612d4cf7",
}

export function resolveLessonId(lessonId: string | null | undefined): string {
  if (!lessonId) return ""
  return D5_LESSON_ALIAS_MAP[lessonId] || lessonId
}

export const d5Modules: CourseModule[] = [
  {
    module_id: "mod-d5-01",
    lesson_id: "d5d30129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 1,
    module_number: "Module 01",
    title: "01. Introduction",
    cover_image: "/assets/images/D5_class_img/M1.jpg",
    duration_minutes: 15,
    is_preview: true,
    description: "Welcome to D5 Masterclass 2.0. Introduction to the course structure, essential rendering concepts, and project roadmap.",
    lessons: [
      {
        lesson_id: "d5d30129-234b-4b2a-8d19-450f612d4cf7",
        module_id: "mod-d5-01",
        order_index: 1,
        title: "1.1 Welcome & Course Overview",
        duration_minutes: 8,
        is_preview: true,
        description: "Overview of D5 Render capabilities and how to get the most out of this masterclass."
      },
      {
        lesson_id: "d5d30129-234b-4b2a-8d19-450f612d4cf8",
        module_id: "mod-d5-01",
        order_index: 2,
        title: "1.2 System Requirements & Installation",
        duration_minutes: 7,
        is_preview: true,
        description: "Hardware optimization, GPU driver setup, and installing D5 Render plugins."
      }
    ]
  },
  {
    module_id: "mod-d5-02",
    lesson_id: "d59a6cf7-7756-42d4-bb34-8c6a0c021c32",
    order_index: 2,
    module_number: "Module 02",
    title: "02. Interface & Navigation",
    cover_image: "/assets/images/D5_class_img/M2.jpg",
    duration_minutes: 20,
    is_preview: false,
    description: "Deep dive into the modern D5 Render 2.0 workspace, viewport navigation, toolbars, and shortcut configurations.",
    lessons: [
      {
        lesson_id: "d59a6cf7-7756-42d4-bb34-8c6a0c021c32",
        module_id: "mod-d5-02",
        order_index: 1,
        title: "2.1 Viewport Controls & Navigation",
        duration_minutes: 10,
        is_preview: false,
        description: "Mastering WASD navigation, camera movement, speed controls, and fly modes."
      },
      {
        lesson_id: "d59a6cf7-7756-42d4-bb34-8c6a0c021c33",
        module_id: "mod-d5-02",
        order_index: 2,
        title: "2.2 Workspace Layout & Preference Setup",
        duration_minutes: 10,
        is_preview: false,
        description: "Customizing UI layout, widget toolbars, and setting optimal display settings."
      }
    ]
  },
  {
    module_id: "mod-d5-03",
    lesson_id: "d5030129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 3,
    module_number: "Module 03",
    title: "03. Core Workflow",
    cover_image: "/assets/images/D5_class_img/M3.jpg",
    duration_minutes: 25,
    is_preview: false,
    description: "Importing architectural models from SketchUp/Revit, live sync setups, scene organization, and layer hierarchies.",
    lessons: [
      {
        lesson_id: "d5030129-234b-4b2a-8d19-450f612d4cf7",
        module_id: "mod-d5-03",
        order_index: 1,
        title: "3.1 Importing 3D Models & Syncing",
        duration_minutes: 15,
        is_preview: false,
        description: "Live-syncing SketchUp, Revit, or Rhino models directly into D5 Render."
      },
      {
        lesson_id: "d5030129-234b-4b2a-8d19-450f612d4cf8",
        module_id: "mod-d5-03",
        order_index: 2,
        title: "3.2 Scene Management & Layer Structure",
        duration_minutes: 10,
        is_preview: false,
        description: "Organizing complex scenes, managing resource usage, and clean layer naming."
      }
    ]
  },
  {
    module_id: "mod-d5-04",
    lesson_id: "d5040129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 4,
    module_number: "Module 04",
    title: "04. Material",
    cover_image: "/assets/images/D5_class_img/M4.jpg",
    duration_minutes: 30,
    is_preview: false,
    description: "PBR materials creation, normal maps, roughness, subsurface scattering, custom glass, water, and realistic textures.",
    lessons: [
      {
        lesson_id: "d5040129-234b-4b2a-8d19-450f612d4cf7",
        module_id: "mod-d5-04",
        order_index: 1,
        title: "4.1 PBR Material Fundamentals",
        duration_minutes: 15,
        is_preview: false,
        description: "Understanding Albedo, Roughness, Metallic, and Normal maps in D5."
      },
      {
        lesson_id: "d5040129-234b-4b2a-8d19-450f612d4cf8",
        module_id: "mod-d5-04",
        order_index: 2,
        title: "4.2 Architectural Water, Glass & Emissives",
        duration_minutes: 15,
        is_preview: false,
        description: "Creating realistic architectural glass, pool water, and light-emitting materials."
      }
    ]
  },
  {
    module_id: "mod-d5-05",
    lesson_id: "d5050129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 5,
    module_number: "Module 05",
    title: "05. Lighting",
    cover_image: "/assets/images/D5_class_img/M5.jpg",
    duration_minutes: 30,
    is_preview: false,
    description: "Geo & HDRI sky systems, sun positioning, emissive surfaces, spotlights, strip lights, and interior mood lighting.",
    lessons: [
      {
        lesson_id: "d5050129-234b-4b2a-8d19-450f612d4cf7",
        module_id: "mod-d5-05",
        order_index: 1,
        title: "5.1 Daylight & HDRI Sky Lighting",
        duration_minutes: 15,
        is_preview: false,
        description: "Setting up sunlight, geographic location, cloud coverage, and custom HDRI skies."
      },
      {
        lesson_id: "d5050129-234b-4b2a-8d19-450f612d4cf8",
        module_id: "mod-d5-05",
        order_index: 2,
        title: "5.2 Artificial Lights & Interior Atmosphere",
        duration_minutes: 15,
        is_preview: false,
        description: "Placing point, spot, strip, and IES lights for cozy interior rendering."
      }
    ]
  },
  {
    module_id: "mod-d5-06",
    lesson_id: "d5060129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 6,
    module_number: "Module 06",
    title: "06. Assets",
    cover_image: "/assets/images/D5_class_img/M6.jpg",
    duration_minutes: 25,
    is_preview: false,
    description: "Scattering vegetations, brush tool mastery, animated characters, vehicle paths, and library asset management.",
    lessons: [
      {
        lesson_id: "d5060129-234b-4b2a-8d19-450f612d4cf7",
        module_id: "mod-d5-06",
        order_index: 1,
        title: "6.1 Vegetation Brush & Scattering",
        duration_minutes: 15,
        is_preview: false,
        description: "Populating landscapes using D5 foliage brush and path scatter tools."
      },
      {
        lesson_id: "d5060129-234b-4b2a-8d19-450f612d4cf8",
        module_id: "mod-d5-06",
        order_index: 2,
        title: "6.2 Animated Assets & People Paths",
        duration_minutes: 10,
        is_preview: false,
        description: "Adding dynamic 3D people, moving vehicles, and animated trees to bring renders alive."
      }
    ]
  },
  {
    module_id: "mod-d5-07",
    lesson_id: "d5070129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 7,
    module_number: "Module 07",
    title: "07. Composition",
    cover_image: "/assets/images/D5_class_img/M7.jpg",
    duration_minutes: 25,
    is_preview: false,
    description: "Architectural camera framing, two-point perspective, focal lengths, depth of field, and visual storytelling.",
    lessons: [
      {
        lesson_id: "d5070129-234b-4b2a-8d19-450f612d4cf7",
        module_id: "mod-d5-07",
        order_index: 1,
        title: "7.1 Camera Framing & 2-Point Perspective",
        duration_minutes: 15,
        is_preview: false,
        description: "Setting up architectural camera views, grid guides, and two-point perspective correction."
      },
      {
        lesson_id: "d5070129-234b-4b2a-8d19-450f612d4cf8",
        module_id: "mod-d5-07",
        order_index: 2,
        title: "7.2 Depth of Field & Lens Effects",
        duration_minutes: 10,
        is_preview: false,
        description: "Controlling aperture, focus distance, bokeh, and field of view."
      }
    ]
  },
  {
    module_id: "mod-d5-08",
    lesson_id: "d5080129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 8,
    module_number: "Module 08",
    title: "08. Post-Production",
    cover_image: "/assets/images/D5_class_img/M8.jpg",
    duration_minutes: 35,
    is_preview: false,
    description: "D5 built-in post-processing, LUTs, exposure balancing, bloom, chromatic aberration, and final render channel passes.",
    lessons: [
      {
        lesson_id: "d5080129-234b-4b2a-8d19-450f612d4cf7",
        module_id: "mod-d5-08",
        order_index: 1,
        title: "8.1 Built-in Post-Processing & Color Grading",
        duration_minutes: 20,
        is_preview: false,
        description: "Applying LUTs, adjusting highlights, shadows, white balance, and contrast."
      },
      {
        lesson_id: "d5080129-234b-4b2a-8d19-450f612d4cf8",
        module_id: "mod-d5-08",
        order_index: 2,
        title: "8.2 Render Channels Exporting",
        duration_minutes: 15,
        is_preview: false,
        description: "Exporting Material ID, Depth, AO, and Reflection passes for Photoshop compositing."
      }
    ]
  },
  {
    module_id: "mod-d5-09",
    lesson_id: "d5090129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 9,
    module_number: "Module 09",
    title: "09. D5 AI Features",
    cover_image: "/assets/images/D5_class_img/M9.jpg",
    duration_minutes: 25,
    is_preview: false,
    description: "Leveraging AI Atmosphere Match, AI Enhancer, texture upscalers, and modern generative toolsets in D5.",
    lessons: [
      {
        lesson_id: "d5090129-234b-4b2a-8d19-450f612d4cf7",
        module_id: "mod-d5-09",
        order_index: 1,
        title: "9.1 AI Atmosphere Match & Environment Generator",
        duration_minutes: 15,
        is_preview: false,
        description: "Matching atmosphere style automatically using AI reference images."
      },
      {
        lesson_id: "d5090129-234b-4b2a-8d19-450f612d4cf8",
        module_id: "mod-d5-09",
        order_index: 2,
        title: "9.2 AI Texture Upscaling & Enhancer",
        duration_minutes: 10,
        is_preview: false,
        description: "Boosting texture resolutions and sharpening detail with AI."
      }
    ]
  },
  {
    module_id: "mod-d5-10",
    lesson_id: "d5100129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 10,
    module_number: "Module 10",
    title: "10. Animation",
    cover_image: "/assets/images/D5_class_img/M10.jpg",
    duration_minutes: 40,
    is_preview: false,
    description: "Keyframe camera animation, video transitions, weather effects sequencing, render queue export, and cinematic walkthroughs.",
    lessons: [
      {
        lesson_id: "d5100129-234b-4b2a-8d19-450f612d4cf7",
        module_id: "mod-d5-10",
        order_index: 1,
        title: "10.1 Keyframing & Cinematic Camera Path Setup",
        duration_minutes: 20,
        is_preview: false,
        description: "Creating smooth camera transitions, focal adjustments, and speed curves."
      },
      {
        lesson_id: "d5100129-234b-4b2a-8d19-450f612d4cf8",
        module_id: "mod-d5-10",
        order_index: 2,
        title: "10.2 Video Batch Rendering & Queue Export",
        duration_minutes: 20,
        is_preview: false,
        description: "Exporting 4K video clips, setting bitrate, frame rates, and final video rendering."
      }
    ]
  }
]

export function getLessonCoverImage(
  courseSlugOrId?: string | null,
  lesson?: { order_index?: number; title?: string; cover_image?: string; thumbnail_url?: string } | null,
  index?: number,
  fallbackCover?: string | null
): string {
  if (lesson?.thumbnail_url && !lesson.thumbnail_url.includes("placeholder.svg")) {
    return lesson.thumbnail_url
  }
  if (lesson?.cover_image && !lesson.cover_image.includes("placeholder.svg")) {
    return lesson.cover_image
  }

  const slug = (courseSlugOrId || "").toLowerCase()
  const isD5 =
    slug.includes("d5") ||
    slug.includes("render") ||
    slug === "d4a1b756-12d4-4047-93bd-8b58b94cb146" ||
    slug === "d5c66d93-3d02-466d-a77b-6c6a46cd4cf7" ||
    !courseSlugOrId ||
    (lesson?.title && lesson.title.toLowerCase().includes("d5"))

  if (isD5) {
    const order = lesson?.order_index ?? (index !== undefined ? index + 1 : 1)
    const normalizedOrder = Math.max(1, Math.min(10, order))
    return `/assets/images/D5_class_img/M${normalizedOrder}.jpg`
  }

  if (fallbackCover && !fallbackCover.includes("placeholder.svg")) {
    return fallbackCover
  }

  return "/placeholder.svg"
}


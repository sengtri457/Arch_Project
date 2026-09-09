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

export interface CourseModule {
  lesson_id: string
  order_index: number
  module_number: string
  title: string
  cover_image: string
  duration_minutes: number
  is_preview: boolean
  description?: string
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
    lesson_id: "d5d30129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 1,
    module_number: "Module 01",
    title: "01. Introduction",
    cover_image: "/assets/images/D5_class_img/M1.jpg",
    duration_minutes: 15,
    is_preview: true,
    description: "Welcome to D5 Masterclass 2.0. Introduction to the course structure, essential rendering concepts, and project roadmap."
  },
  {
    lesson_id: "d59a6cf7-7756-42d4-bb34-8c6a0c021c32",
    order_index: 2,
    module_number: "Module 02",
    title: "02. Interface & Navigation",
    cover_image: "/assets/images/D5_class_img/M2.jpg",
    duration_minutes: 20,
    is_preview: false,
    description: "Deep dive into the modern D5 Render 2.0 workspace, viewport navigation, toolbars, and shortcut configurations."
  },
  {
    lesson_id: "d5030129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 3,
    module_number: "Module 03",
    title: "03. Core Workflow",
    cover_image: "/assets/images/D5_class_img/M3.jpg",
    duration_minutes: 25,
    is_preview: false,
    description: "Importing architectural models from SketchUp/Revit, live sync setups, scene organization, and layer hierarchies."
  },
  {
    lesson_id: "d5040129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 4,
    module_number: "Module 04",
    title: "04. Material",
    cover_image: "/assets/images/D5_class_img/M4.jpg",
    duration_minutes: 30,
    is_preview: false,
    description: "PBR materials creation, normal maps, roughness, subsurface scattering, custom glass, water, and realistic textures."
  },
  {
    lesson_id: "d5050129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 5,
    module_number: "Module 05",
    title: "05. Lighting",
    cover_image: "/assets/images/D5_class_img/M5.jpg",
    duration_minutes: 30,
    is_preview: false,
    description: "Geo & HDRI sky systems, sun positioning, emissive surfaces, spotlights, strip lights, and interior mood lighting."
  },
  {
    lesson_id: "d5060129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 6,
    module_number: "Module 06",
    title: "06. Assets",
    cover_image: "/assets/images/D5_class_img/M6.jpg",
    duration_minutes: 25,
    is_preview: false,
    description: "Scattering vegetations, brush tool mastery, animated characters, vehicle paths, and library asset management."
  },
  {
    lesson_id: "d5070129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 7,
    module_number: "Module 07",
    title: "07. Composition",
    cover_image: "/assets/images/D5_class_img/M7.jpg",
    duration_minutes: 25,
    is_preview: false,
    description: "Architectural camera framing, two-point perspective, focal lengths, depth of field, and visual storytelling."
  },
  {
    lesson_id: "d5080129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 8,
    module_number: "Module 08",
    title: "08. Post-Production",
    cover_image: "/assets/images/D5_class_img/M8.jpg",
    duration_minutes: 35,
    is_preview: false,
    description: "D5 built-in post-processing, LUTs, exposure balancing, bloom, chromatic aberration, and final render channel passes."
  },
  {
    lesson_id: "d5090129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 9,
    module_number: "Module 09",
    title: "09. D5 AI Features",
    cover_image: "/assets/images/D5_class_img/M9.jpg",
    duration_minutes: 25,
    is_preview: false,
    description: "Leveraging AI Atmosphere Match, AI Enhancer, texture upscalers, and modern generative toolsets in D5."
  },
  {
    lesson_id: "d5100129-234b-4b2a-8d19-450f612d4cf7",
    order_index: 10,
    module_number: "Module 10",
    title: "10. Animation",
    cover_image: "/assets/images/D5_class_img/M10.jpg",
    duration_minutes: 40,
    is_preview: false,
    description: "Keyframe camera animation, video transitions, weather effects sequencing, render queue export, and cinematic walkthroughs."
  }
]

export function getLessonCoverImage(
  courseSlugOrId?: string | null,
  lesson?: { order_index?: number; title?: string; cover_image?: string; thumbnail_url?: string } | null,
  index?: number
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

  return "/placeholder.svg"
}


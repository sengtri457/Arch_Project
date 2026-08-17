export interface Course {
  id: string
  course_id?: string
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
}

export const courses: Course[] = [
  {
    id: "d5-masterclass",
    title: "D5 Masterclass",
    description: "Master the art of real-time rendering with D5 Render. Create stunning photorealistic visualizations with speed and efficiency.",
    image: "/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-1.jpg",
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
    lessons: 42
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
    lessons: 35
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
    lessons: 28
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
    lessons: 45
  }
]


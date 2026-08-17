# Frontend Integration Guide

This guide details how to refactor the frontend application to fetch dynamic data from the backend APIs instead of relying on the static mock arrays in `lib/`.

---

## 🛠️ Step-by-Step Integration Guide

### Step 1: Set Up Environment Variables

Define the backend base API URL in your local environment file.
Create or edit `.env.local` in the root of the `archviz-portfolio-website` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

_(Next.js exposes variables prefixed with_ _`NEXT_PUBLIC_`_ _to the client-side browser bundle)._

---

### Step 2: Create the API Client Layer

Create a new utility file [`lib/api.ts`](../lib/api.ts) to manage fetch calls, error handling, and type safety:

```TypeScript
import { Project, Course, Testimonial } from './types'; // Add missing type exports as needed

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Projects
  async getProjects(params?: { category?: string; featured?: boolean; limit?: number }): Promise<Project[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.append('category', params.category);
    if (params?.featured) query.append('featured', String(params.featured));
    if (params?.limit) query.append('limit', String(params.limit));

    const response = await fetch(`${API_BASE_URL}/projects?${query.toString()}`, {
      next: { revalidate: 3600 }, // Enable Next.js Incremental Static Regeneration (1 hour cache)
    });
    return handleResponse<Project[]>(response);
  },

  async getProjectById(id: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });
    return handleResponse<Project>(response);
  },

  // Courses
  async getCourses(category?: string): Promise<Course[]> {
    const query = new URLSearchParams();
    if (category && category !== 'All') query.append('category', category);

    const response = await fetch(`${API_BASE_URL}/courses?${query.toString()}`, {
      next: { revalidate: 3600 },
    });
    return handleResponse<Course[]>(response);
  },

  // Testimonials
  async getTestimonials(): Promise<Testimonial[]> {
    const response = await fetch(`${API_BASE_URL}/testimonials`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    return handleResponse<Testimonial[]>(response);
  },

  // Contact Submissions
  async submitContactForm(data: { name: string; email: string; company?: string; message: string }) {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  }
};
```

---

### Step 3: Refactoring Client Components (`use client`)

For client-side routes (like `app/courses/page.tsx`), use standard React state hooks to fetch data asynchronously:

#### Example: Refactoring `app/courses/page.tsx`

```TSX
"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Course } from "@/lib/courses-data" // Or import from types directly
// ... other UI imports

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true)
        const data = await api.getCourses(selectedCategory)
        setCourses(data)
        setError(null)
      } catch (err: any) {
        setError(err.message || "Failed to load courses")
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [selectedCategory])

  // ... render loading, error, or courses list
}
```

---

### Step 4: Refactoring Server Components

For server-rendered pages (like the project detail view `app/projects/[id]/page.tsx`), fetch data directly on the server.

#### Example: Refactoring `app/projects/[id]/page.tsx`

```TSX
import { notFound } from "next/navigation"
import { api } from "@/lib/api"
// ... UI imports

// Keep generateStaticParams to statically pre-build projects
export async function generateStaticParams() {
  try {
    const projects = await api.getProjects()
    return projects.map((project) => ({
      id: project.id,
    }))
  } catch (error) {
    console.error("Failed to generate static params:", error)
    return []
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let project = null
  try {
    project = await api.getProjectById(id)
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error)
  }

  if (!project) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      {/* ... Render page exactly as before using database "project" object */}
    </main>
  )
}
```

---

### Step 5: Connecting the Contact Form

Update [`components/contact-section.tsx`](../components/contact-section.tsx) to dispatch a request payload to the API server:

```TSX
import { api } from "@/lib/api"
import { toast } from "sonner" // Assuming you use Sonner or similar alert library

// ... State declarations
const [isSubmitting, setIsSubmitting] = useState(false)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)
  try {
    await api.submitContactForm(formData)
    toast.success("Thank you for your message! We'll get back to you soon.")
    setFormData({ name: "", email: "", company: "", message: "" })
  } catch (error: any) {
    toast.error(error.message || "Something went wrong. Please try again.")
  } finally {
    setIsSubmitting(false)
  }
}
```

_(Ensure to disable form buttons and input fields while_ _`isSubmitting`_ _is true to prevent duplicate submissions)._

# Folder Structure & Backend Integration Entry Points

This document provides a breakdown of the frontend directory structure and highlights the specific files that need to be updated during the backend integration process.

---

## 📁 Directory Tree

Below is the directory structure of the Next.js application, highlighting folders relevant to dynamic data:

```text
archviz-portfolio-website/
├── app/                           # Next.js App Router (Pages & Routes)
│   ├── about/
│   │   └── page.tsx               # About us page
│   ├── courses/
│   │   └── page.tsx               # Courses page (Lists course cards) *INTEGRATION TARGET*
│   ├── projects/
│   │   ├── [id]/
│   │   │   ├── not-found.tsx      # Custom 404 page for missing projects
│   │   │   └── page.tsx           # Project details page (Dynamic route) *INTEGRATION TARGET*
│   │   └── page.tsx               # Portfolio projects page *INTEGRATION TARGET*
│   ├── globals.css                # Global styles & Tailwind injections
│   ├── layout.tsx                 # Root layout layout wrap
│   └── page.tsx                   # Homepage (Includes Works Gallery) *INTEGRATION TARGET*
├── components/                    # Reusable React components
│   ├── ui/                        # Low-level UI elements (Button, Input, Textarea)
│   ├── contact-section.tsx        # Contact Form handling *INTEGRATION TARGET*
│   ├── works-gallery.tsx          # Homepage gallery *INTEGRATION TARGET*
│   ├── testimonial-carousel.tsx   # Homepage reviews *INTEGRATION TARGET*
│   └── navigation.tsx             # Navbar component
├── lib/                           # Utilities & Static Data Sources
│   ├── courses-data.ts            # Mock courses *REFACTOR / REPLACE*
│   ├── portfolio-data.ts          # Older mock portfolio projects
│   ├── projects-data.ts           # Mock architectural projects (80KB+) *REFACTOR / REPLACE*
│   ├── testimonials-data.ts       # Mock customer reviews *REFACTOR / REPLACE*
│   ├── types.ts                   # TS Interface definitions *MATCH DB DESIGN*
│   └── utils.ts                   # Utility functions (media URL CDN mapper, cn, classnames)
├── public/                        # Static assets (images, logos, local media)
├── structure/                     # Backend integration documentation (This directory)
├── styles/                        # Style assets
├── package.json                   # Project scripts and dependencies
└── tsconfig.json                  # TypeScript compiler settings
```

---

## 🎯 Key Backend Integration Points

The following files contain the static mock data or actions that must be refactored to communicate with your backend APIs:

### 1. The Mock Data Layer (`lib/`)

These files currently export hardcoded arrays that represent the site's content database. During integration, these will be replaced by a service file (e.g., `lib/api.ts`) that fetches data from the backend.

- **[`lib/projects-data.ts`](../lib/projects-data.ts):** Holds all architectural project metadata, categories, features, galleries, and specifications.
- **[`lib/courses-data.ts`](../lib/courses-data.ts):** Stores online visualization course details, prices, topics, and instructors.
- **[`lib/testimonials-data.ts`](../lib/testimonials-data.ts):** Houses customer reviews displayed on the homepage.

### 2. Homepage Content

- **[`components/works-gallery.tsx`](../components/works-gallery.tsx):** Imports `limitedProjects` from `lib/projects-data.ts` to display a subset of projects on the homepage. This needs to fetch from your backend with a limit/featured filter (e.g. `GET /api/projects?limit=8`).
- **[`components/testimonial-carousel.tsx`](../components/testimonial-carousel.tsx):** Imports `testimonials` from `lib/testimonials-data.ts`. Needs to fetch testimonial records.

### 3. Projects Page & Dynamic Route

- **[`app/projects/page.tsx`](../app/projects/page.tsx):** Shows the full list of projects, with client-side category filtering. Refactor this to fetch projects dynamically, ideally offloading filtering to the backend query parameters (e.g. `GET /api/projects?category=residential`).
- **[`app/projects/[id]/page.tsx`](../app/projects/[id]/page.tsx):** Uses `generateStaticParams()` to pre-render project pages at build time. When converting to a dynamic backend:
  - You can keep `generateStaticParams` by querying the backend API during the Next.js build step.
  - Alternatively, configure it for dynamic server-side rendering (SSR) or incremental static regeneration (ISR) depending on the content update frequency.

### 4. Courses Page

- **[`app/courses/page.tsx`](../app/courses/page.tsx):** Displays educational courses. Needs to fetch courses dynamically from your backend API (e.g., `GET /api/courses`).

### 5. Contact Section Form Submission

- **[`components/contact-section.tsx`](../components/contact-section.tsx):** Handles the form data state (`name`, `email`, `company`, `message`). Currently, `handleSubmit` simply logs the data and alerts the user:
  ```TypeScript
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    alert("Thank you for your message! We'll get back to you soon.")
    setFormData({ name: "", email: "", company: "", message: "" })
  }
  ```
  This function must be updated to dispatch an HTTP `POST` request to your backend contact endpoint (e.g., `POST /api/contact`) to store/email the lead.

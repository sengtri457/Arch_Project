# API Endpoints Specification

This document provides a specifications of the REST API endpoints that the backend service must implement.

---

## 📡 Base Configuration

- **Content-Type:** `application/json`
- **Recommended API Prefix:** `/api/v1` or `/api`
- **CORS Configuration:** Ensure `Access-Control-Allow-Origin` allows requests from the frontend domain (e.g. `http://localhost:3000` in development).

---

## 🔌 API Summary Table

| Method   | Endpoint            | Description                       | Query Parameters                |
| :------- | :------------------ | :-------------------------------- | :------------------------------ |
| **GET**  | `/api/projects`     | Fetch list of portfolio projects  | `category`, `limit`, `featured` |
| **GET**  | `/api/projects/:id` | Fetch details of a single project | None                            |
| **GET**  | `/api/courses`      | Fetch list of educational courses | `category`                      |
| **GET**  | `/api/testimonials` | Fetch customer testimonials       | None                            |
| **POST** | `/api/contact`      | Submit a client inquiry message   | None                            |

---

## 🔎 Endpoint Details

### 1. Fetch Projects

Retrieve lists of portfolio projects. Supports server-side filtering and limits.

- **Endpoint:** `/api/projects`
- **Method:** `GET`
- **Query Parameters (Optional):**
  - `category` (string): Filter by category (e.g. `Residential`, `Commercial`, `Institutional`).
  - `featured` (boolean): Fetch only featured items (e.g. `true`).
  - `limit` (number): Max number of items to return.
- **Success Response (200 OK):**
  ```JSON
  [
    {
      "id": "krohom-bookstore",
      "title": "Krohom Bookstore",
      "category": "Institutional",
      "description": "A modern bookstore designed to foster community...",
      "image": "https://public.archtipsbox.com/24-Krohom%20bookstore%20(Institutional)/Lightroom/Exterior-1.jpg",
      "year": "2024",
      "location": "Phnom Penh, Cambodia",
      "price": "$25,000"
    }
  ]
  ```

---

### 2. Fetch Single Project Detail

Fetch detailed information for a specific project based on its ID.

- **Endpoint:** `/api/projects/:id`
- **Method:** `GET`
- **Success Response (200 OK):**
  ```JSON
  {
    "id": "krohom-bookstore",
    "title": "Krohom Bookstore",
    "category": "Institutional",
    "description": "A modern bookstore designed to foster community...",
    "image": "https://public.archtipsbox.com/24-Krohom%20bookstore%20(Institutional)/Lightroom/Exterior-1.jpg",
    "year": "2024",
    "location": "Phnom Penh, Cambodia",
    "price": "$25,000",
    "details": {
      "client": "Krohom Bookstore",
      "scope": "Exterior & Interior Visualization",
      "software": ["D5 Render", "Photoshop", "Sketchup"],
      "duration": "4 weeks",
      "area": "15,000 sq ft",
      "floors": 2,
      "features": [
        "Modern educational facilities",
        "Community reading areas",
        "Sustainable design",
        "Natural lighting"
      ],
      "challenges": [
        "Integrating modern design with functional requirements",
        "Optimizing natural light for reading areas"
      ],
      "solutions": [
        "Open plan layout",
        "Skylights and large windows"
      ]
    },
    "images": [
      "https://public.archtipsbox.com/24-Krohom%20bookstore%20(Institutional)/Lightroom/Exterior-1.jpg",
      "https://public.archtipsbox.com/24-Krohom%20bookstore%20(Institutional)/Lightroom/Exterior-2.jpg"
    ],
    "gallery": {
      "exterior": [
        "https://public.archtipsbox.com/24-Krohom%20bookstore%20(Institutional)/Lightroom/Exterior-1.jpg"
      ],
      "interior": [],
      "details": []
    },
    "videos": [],
    "testimonials": {
      "quote": "The condominium complex visualizations perfectly captured our vision...",
      "author": "Sophal Chan",
      "role": "Project Developer"
    }
  }
  ```
- **Error Response (404 Not Found):**
  ```JSON
  {
    "message": "Project with ID 'invalid-id' not found."
  }
  ```

---

### 3. Fetch Courses

Retrieve a list of lessons and masterclasses.

- **Endpoint:** `/api/courses`
- **Method:** `GET`
- **Query Parameters (Optional):**
  - `category` (string): Filter courses by category (e.g. `Rendering`, `Post-Production`).
- **Success Response (200 OK):**
  ```JSON
  [
    {
      "id": "d5-masterclass",
      "title": "D5 Masterclass",
      "description": "Master the art of real-time rendering with D5 Render. Create stunning photorealistic visualizations with speed and efficiency.",
      "image": "https://public.archtipsbox.com/16-SB%20TOWER%20(Commercial)/Render%20Image/LIGHTROOM/Exterior-1.jpg",
      "category": "Rendering",
      "duration": "6 weeks",
      "level": "Intermediate to Advanced",
      "price": "$49.99",
      "features": [
        "Real-time rendering workflow",
        "Advanced lighting and materials",
        "Animation and video production",
        "Environment and landscape creation",
        "Post-processing in D5"
      ],
      "instructor": "Bun Sambath",
      "students": 1500,
      "lessons": 42
    }
  ]
  ```

---

### 4. Fetch Testimonials

Fetch client testimonials for the homepage carousel.

- **Endpoint:** `/api/testimonials`
- **Method:** `GET`
- **Success Response (200 OK):**
  ```JSON
  [
    {
      "id": "1",
      "name": "Srey Pich",
      "role": "Creative Director",
      "organization": "Luxe Properties",
      "text": "Archtipsbox transformed our vision into stunning photorealistic renders that helped us secure funding for our luxury development project. Their attention to detail and understanding of architectural aesthetics is unmatched."
    }
  ]
  ```

---

### 5. Submit Contact Message

Submit user inquiries from the site's contact form. Recommended actions include saving records to the database and sending an email notification to the administrator (e.g., via Nodemailer, SendGrid, Amazon SES, or Mailgun).

- **Endpoint:** `/api/contact`
- **Method:** `POST`
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```JSON
  {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "company": "JD Architects",
    "message": "We would like to get a quote for exterior visualization of a 3-story modern villa."
  }
  ```
- **Success Response (201 Created):**
  ```JSON
  {
    "success": true,
    "message": "Inquiry submitted successfully.",
    "data": {
      "id": "64c5fdc72c88fd9b85c1bf32",
      "name": "John Doe",
      "email": "johndoe@example.com",
      "company": "JD Architects",
      "message": "We would like to get a quote for exterior visualization of a 3-story modern villa.",
      "createdAt": "2026-08-16T09:50:00Z"
    }
  }
  ```
- **Error Response (400 Bad Request):**
  ```JSON
  {
    "success": false,
    "message": "Validation failed: 'name', 'email', and 'message' are required fields."
  }
  ```

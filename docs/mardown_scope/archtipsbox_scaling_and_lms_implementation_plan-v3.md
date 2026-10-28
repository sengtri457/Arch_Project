# ArchTipsBox — Scale-Up & LMS Implementation Plan (v3)

**Domain:** [archtipsbox.com](https://archtipsbox.com/)

**Goal:** Turn ArchTipsBox into a subscription-based architectural visualization LMS with a proper 3D asset library, video courses, and self-service content management.

**What's new in this version:**

1. Google Sign-In for students (one click, JWT-based sessions)
2. Video protection so courses can't be easily downloaded or shared
3. A comparison of video hosting options (YouTube, Vimeo, Cloudflare Stream, Bunny.net)
4. Bakong KHQR payments for Cambodian students, with automatic subscription activation
5. Project and gallery system for showing off renders and case studies
6. An admin panel so you can add courses, projects, and assets yourself, no code needed

---

## 1. Student Login with Google

Students sign in with their existing Google account. No new password to remember.

**How it works:**

1. Student clicks "Continue with Google" on the site.
2. The Angular frontend gets an `id_token` back from Google.
3. The backend checks that token against Google's public keys (`https://www.googleapis.com/oauth2/v3/certs`) to make sure it's real.
4. If the student is new, we create a record in the `Users` table with their email, name, and avatar. If they already exist, we just look them up.
5. Either way, the backend issues a JWT (access token + refresh token) with the student's role baked in — Student, Instructor, or Admin.

```
[ Student Browser ] ───(1. Google Sign-In)───> [ Google Identity Server ]
        │                                                │
        │ <────────(2. Return id_token)─────────────────┘
        │
        └───(3. Send id_token)───> [ ArchTipsBox Backend API ]
                                            │
                                            ├──(4. Verify with Google API)
                                            ├──(5. Create/Fetch User in SQL)
                                            └──(6. Return ArchTips JWT Token)
```

---

## 2. Protecting the Video Content

### Why a plain video link doesn't work

If you just point a `<video>` tag at an MP4 file, anyone can right-click "Save Video As," or use a browser extension to rip it. That's not good enough for paid courses.

### The approach for ArchTipsBox

```
+---------------------------------------------------------------------------------------+
|                             VIDEO ANTI-PIRACY SECURITY LAYERS                         |
+---------------------------------------------------------------------------------------+
|  Layer 1: HLS/DASH Chunking      |  Video split into encrypted .ts fragments (no MP4) |
|  Layer 2: Domain Whitelisting    |  Embeds ONLY play on archtipsbox.com               |
|  Layer 3: Signed Token Expiry    |  Streaming tokens expire after 30–60 minutes       |
|  Layer 4: Dynamic Watermarking   |  Student's Email/ID moves dynamically across screen|
|  Layer 5: Device Session Lock    |  Max 1-2 active devices; prevents account sharing  |
+---------------------------------------------------------------------------------------+
```

1. **Encrypted HLS/DASH streaming, no raw MP4.** Videos get encoded into small encrypted chunks (`.m3u8` playlist plus 3-second `.ts` segments). There's no single downloadable file sitting in the browser's network tab.
2. **Domain locking.** Playback only works on `archtipsbox.com` and its subdomains. If someone grabs the embed URL and drops it on another site, they get a `403`.
3. **Short-lived signed URLs.** When a student hits play, the backend generates an HMAC-signed token valid for 30–60 minutes, tied to their user ID and IP.
4. **Moving watermark.** The student's email and ID (e.g. `sengtri@archtipsbox.com [ID: 8842]`) shows up faintly on the video and shifts position every 15–20 seconds. If someone screen-records it, their account is burned into the footage.
5. **One active session at a time.** Enforced with Redis or WebSocket heartbeats. If someone logs in on a second device, playback on the first one stops.

---

## 3. Video Hosting: Can You Use YouTube, Vimeo, Cloudflare, or Bunny?

Yes. You can host on any of these and embed into ArchTipsBox. They differ a lot on privacy and how hard they make it to steal the video.

| Provider               | Cost                                     | Protection Level                                            | Download Risk   | Best Use Case                                     |
| :--------------------- | :--------------------------------------- | :---------------------------------------------------------- | :-------------- | :------------------------------------------------ |
| **YouTube (Unlisted)** | Free                                     | Low — anyone with the link can share or download it         | High            | Free preview lessons, trailers, marketing content |
| **Vimeo Pro / OTT**    | \~\$20–65/mo                             | High — domain restriction, unlisted player, custom branding | Low to moderate | Fastest way to get a working paid-course player   |
| **Bunny.net Stream**   | Pay-as-you-go, \~\$0.005–0.01/GB         | Very high — token auth, DRM, domain locking, auto HLS       | Very low        | Best value for a growing course library           |
| **Cloudflare Stream**  | $5/1000 min stored + $1/1000 min watched | Highest — signed URLs, watermarking, instant encoding       | Negligible      | Best performance and analytics if budget allows   |

**Recommendation:** Use YouTube for free preview lessons to pull traffic in from search. Use Bunny Stream or Vimeo Pro for anything behind the paywall — you just paste the video ID into the admin course builder and it embeds securely.

---

## 4. Bakong KHQR Payments

### How it fits together

Students in Cambodia and the wider region can pay by scanning a KHQR code, no international card needed. This runs alongside normal card payments.

```
[ Student Checkout ] ───(1. Selects Plan: $15/mo)───> [ ArchTipsBox API ]
        ▲                                                      │
        │ <──(2. Generates & Displays Dynamic KHQR)────────────┘
        │
   [ Student Scans with ABA / ACLEDA / Bakong App ]
        │
        └───(3. Completes Payment)───> [ Bakong Payment Network ]
                                                     │
                                                     ▼ (4. Webhook Notification)
                                         [ ArchTipsBox Webhook Endpoint ]
                                                     │
                                                     ├──(5. Verify MD5 / Signature)
                                                     ├──(6. Activate 'Student Pro' Plan)
                                                     └──(7. Send Invoice & Email Receipt)
```

### How the payment flow works

1. **QR generation.** When a student picks a plan (say "Student Pro — \$15/month"), the backend generates a KHQR code with the exact amount, currency (USD or KHR), merchant ID, and a unique order reference.
2. **Checking status.** The checkout page polls for payment status every few seconds, or listens over a WebSocket.
3. **Webhook verification.** Bakong (or the gateway provider) sends a webhook once payment clears. The backend checks the signature/hash to confirm it's genuine before trusting it.
4. **Instant activation.** Once verified, the student's subscription flips to `Active` right away. No manual approval needed.

---

## 5. Admin Panel: Managing Content Without Code

You'll be able to add and edit projects, gallery images, 3D assets, and video lessons yourself, no developer needed for day-to-day updates.

### Admin modules

```
+---------------------------------------------------------------------------------------+
|                               ARCHTIPSBOX ADMIN CMS PORTAL                            |
+---------------------------------------------------------------------------------------+
|  1. Project & Gallery Manager  | Upload 3D renders, before/after images, specs & tags |
|  2. Course & Video Builder     | Create modules, paste video IDs, add timestamps      |
|  3. Asset & File Library       | Upload .skp, .d5a presets, HDRI & texture packages   |
|  4. Exercise & Rubric Setup    | Attach project briefs, starter files & rubrics       |
|  5. Student & Subscriber CRM   | View active members, payments, and approve reviews   |
+---------------------------------------------------------------------------------------+
```

### Adding a new project, step by step

1. Log in to the admin portal with your admin Google account.
2. Go to **CMS → Projects Showcase → Create New Project**.
3. Fill in the details:
   - **Title:** e.g. "Modern Minimalist Villa — Twilight Render"
   - **Category / tags:** Exterior, D5 Render, SketchUp 2024, Residential, Photorealistic
   - **Images:** drag and drop renders, wireframes, and clay renders (auto-compressed to WebP)
   - **Before/after slider:** upload the raw render and the post-production version
   - **Downloadable assets (optional):** upload the `.skp` model or `.d5a` package, and mark it free or Pro-only
4. Click **Publish** — it's live on the site right away.

---

## 6. Database Schema

This covers Google login, Bakong payments, the video/course system, and the CMS.

```SQL
-- 1. Users & Authentication (Google OAuth supported)
CREATE TABLE Users (
    UserId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GoogleSubjectId NVARCHAR(255) UNIQUE NULL, -- Google OAuth Sub ID
    FullName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(MAX) NULL, -- Nullable for Google-only users
    Role NVARCHAR(50) NOT NULL CHECK (Role IN ('Student', 'Instructor', 'Admin')),
    AvatarUrl NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- 2. Subscription Plans
CREATE TABLE SubscriptionPlans (
    PlanId INT IDENTITY(1,1) PRIMARY KEY,
    PlanCode NVARCHAR(50) UNIQUE NOT NULL, -- 'FREE', 'STUDENT_PRO', 'MENTORSHIP'
    Name NVARCHAR(100) NOT NULL,
    PriceUsd DECIMAL(10,2) NOT NULL,
    BillingInterval NVARCHAR(20) NOT NULL, -- 'Monthly', 'Yearly'
    FeaturesJson NVARCHAR(MAX) NOT NULL,
    IsActive BIT DEFAULT 1
);

-- 3. Payments & Bakong KHQR Transactions
CREATE TABLE PaymentTransactions (
    TransactionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    PlanId INT NOT NULL FOREIGN KEY REFERENCES SubscriptionPlans(PlanId),
    PaymentMethod NVARCHAR(50) NOT NULL, -- 'BakongKHQR', 'Stripe', 'ABA_PAY'
    BillNumber NVARCHAR(100) UNIQUE NOT NULL,
    Amount DECIMAL(12,2) NOT NULL,
    Currency NVARCHAR(10) NOT NULL DEFAULT 'USD', -- 'USD' or 'KHR'
    KhqrPayload NVARCHAR(MAX) NULL,
    ExternalTxHash NVARCHAR(255) NULL,
    PaymentStatus NVARCHAR(50) NOT NULL CHECK (PaymentStatus IN ('Pending', 'Completed', 'Failed', 'Expired')),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CompletedAt DATETIME2 NULL
);

CREATE TABLE UserSubscriptions (
    SubscriptionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    PlanId INT NOT NULL FOREIGN KEY REFERENCES SubscriptionPlans(PlanId),
    Status NVARCHAR(50) NOT NULL, -- 'Active', 'Canceled', 'PastDue', 'Expired'
    CurrentPeriodStart DATETIME2 NOT NULL,
    CurrentPeriodEnd DATETIME2 NOT NULL,
    LastTransactionId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES PaymentTransactions(TransactionId)
);

-- 4. Dynamic Projects & Showcase CMS (Self-Service)
CREATE TABLE Projects (
    ProjectId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Title NVARCHAR(255) NOT NULL,
    Slug NVARCHAR(255) UNIQUE NOT NULL,
    Description NVARCHAR(MAX),
    SoftwareUsed NVARCHAR(255), -- 'SketchUp, D5 Render, Photoshop'
    Category NVARCHAR(100), -- 'Interior', 'Exterior', 'Commercial', 'Landscape'
    CoverImageUrl NVARCHAR(500) NOT NULL,
    GalleryImagesJson NVARCHAR(MAX), -- Array of image URLs
    BeforeAfterRenderJson NVARCHAR(MAX), -- { "raw": "url1", "final": "url2" }
    DownloadableAssetUrl NVARCHAR(500) NULL,
    RequiredPlanId INT FOREIGN KEY REFERENCES SubscriptionPlans(PlanId) NULL, -- NULL = Public
    IsFeatured BIT DEFAULT 0,
    IsPublished BIT DEFAULT 1,
    CreatedBy UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- 5. Courses, Video Lessons & Exercises
CREATE TABLE Courses (
    CourseId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Title NVARCHAR(255) NOT NULL,
    Slug NVARCHAR(255) UNIQUE NOT NULL,
    Description NVARCHAR(MAX),
    ThumbnailUrl NVARCHAR(500),
    RequiredPlanId INT FOREIGN KEY REFERENCES SubscriptionPlans(PlanId),
    Difficulty NVARCHAR(50) CHECK (Difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    SoftwareUsed NVARCHAR(255),
    IsPublished BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Lessons (
    LessonId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CourseId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Courses(CourseId) ON DELETE CASCADE,
    Title NVARCHAR(255) NOT NULL,
    VideoSourceType NVARCHAR(50) NOT NULL, -- 'BunnyStream', 'CloudflareStream', 'Vimeo', 'YouTube'
    VideoExternalId NVARCHAR(255) NOT NULL, -- Provider Video ID
    DurationMinutes INT NOT NULL,
    DownloadableAssetUrl NVARCHAR(500) NULL,
    OrderIndex INT NOT NULL,
    IsPreview BIT DEFAULT 0
);

CREATE TABLE Exercises (
    ExerciseId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    LessonId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Lessons(LessonId) ON DELETE CASCADE,
    Title NVARCHAR(255) NOT NULL,
    BriefPrompt NVARCHAR(MAX) NOT NULL,
    StarterAssetUrl NVARCHAR(500),
    MaxScore INT DEFAULT 100
);

CREATE TABLE ExerciseSubmissions (
    SubmissionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ExerciseId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Exercises(ExerciseId),
    StudentId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    SubmissionFilesJson NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(50) NOT NULL CHECK (Status IN ('Submitted', 'InReview', 'Graded', 'RevisionRequested')),
    Score INT NULL,
    InstructorFeedback NVARCHAR(MAX) NULL,
    SubmittedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    ReviewedAt DATETIME2 NULL
);

-- 6. Course Enrollment & Watch History (so Admin can see who is taking what)
CREATE TABLE CourseEnrollments (
    EnrollmentId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    StudentId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    CourseId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Courses(CourseId),
    EnrolledAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    Status NVARCHAR(50) NOT NULL CHECK (Status IN ('Active', 'Completed', 'Dropped')) DEFAULT 'Active',
    LastAccessedAt DATETIME2 NULL,
    CompletedAt DATETIME2 NULL,
    CONSTRAINT UQ_Student_Course UNIQUE (StudentId, CourseId) -- one enrollment row per student per course
);

CREATE TABLE LessonProgress (
    ProgressId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    StudentId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    LessonId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Lessons(LessonId),
    CourseId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Courses(CourseId), -- denormalized for fast admin queries
    WatchedSeconds INT NOT NULL DEFAULT 0,
    IsCompleted BIT NOT NULL DEFAULT 0,
    LastWatchedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CompletedAt DATETIME2 NULL,
    CONSTRAINT UQ_Student_Lesson UNIQUE (StudentId, LessonId) -- one progress row per student per lesson
);
```

These two tables are what let the admin panel show "what has this student actually done." `CourseEnrollments` answers _which_ courses someone signed up for and whether they finished. `LessonProgress` answers the finer-grained question, which specific lessons they watched, how far, and when. Together they give you a per-student history view: courses enrolled, percent complete, last active date, and a lesson-by-lesson breakdown, without having to infer any of that from payment or exercise data.

A useful admin query once these exist:

```SQL
-- Per-student course history: % of lessons completed per course
SELECT
    e.StudentId,
    e.CourseId,
    c.Title AS CourseTitle,
    e.Status,
    e.EnrolledAt,
    e.LastAccessedAt,
    COUNT(lp.LessonId) AS LessonsStarted,
    SUM(CASE WHEN lp.IsCompleted = 1 THEN 1 ELSE 0 END) AS LessonsCompleted,
    (SELECT COUNT(*) FROM Lessons WHERE CourseId = e.CourseId) AS TotalLessonsInCourse
FROM CourseEnrollments e
JOIN Courses c ON c.CourseId = e.CourseId
LEFT JOIN LessonProgress lp ON lp.StudentId = e.StudentId AND lp.CourseId = e.CourseId
WHERE e.StudentId = @StudentId
GROUP BY e.StudentId, e.CourseId, c.Title, e.Status, e.EnrolledAt, e.LastAccessedAt;
```

> Note: this schema is written in T-SQL (SQL Server). If you go with Supabase for the backend, see the companion file `archtipsbox_supabase_setup.md` for the Postgres version with row-level security and storage buckets set up to match.

---

## 7. Roadmap

```
[ Week 1-2: Auth & DB ] ──> [ Week 3-4: Video & Anti-Piracy ] ──> [ Week 5-6: Bakong Payment ]
                                                                             │
[ Week 11-12: Launch ] <── [ Week 9-10: Dashboard & Exercises ] <── [ Week 7-8: CMS & Projects ]
```

1. **Weeks 1–2: Architecture, database, Google login**
   Set up the Angular 18+ frontend with Tailwind, and the ASP.NET Core API with SQL Server (or Postgres/Supabase) plus Google OAuth.
2. **Weeks 3–4: Secure video player**
   Wire up Bunny.net, Cloudflare Stream, or Vimeo Pro. Build the moving watermark and domain locking.
3. **Weeks 5–6: Bakong KHQR payments**
   Dynamic QR generation, webhook verification, automatic subscription activation.
4. **Weeks 7–8: Self-service CMS**
   Drag-and-drop uploader for projects, renders, and course lessons. Public gallery with before/after slider.
5. **Weeks 9–10: Exercises and student dashboard**
   Assignment upload, instructor grading workspace, watch progress, certificates, streaks.
6. **Weeks 11–12: Beta, security audit, launch**
   End-to-end testing with your existing YouTube and Telegram audience before going live.

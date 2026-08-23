import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId parameter' }, { status: 400 })
    }

    // 1. Initialize Supabase Server Client (cookie-based to get user auth)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server component write fallback
            }
          },
        },
      }
    )

    // 2. Authenticate the active user session
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 })
    }

    // 3. Initialize Supabase Admin Service Client to query schema and write records bypassing RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )

    // 4. Fetch total lessons in this course
    const { data: lessons, error: lessonsErr } = await supabaseAdmin
      .from('lessons')
      .select('lesson_id')
      .eq('course_id', courseId)

    if (lessonsErr) {
      console.error("Failed to load course lessons:", lessonsErr)
      return NextResponse.json({ error: 'Failed to retrieve course curriculum' }, { status: 500 })
    }

    const totalLessons = lessons?.length || 0
    if (totalLessons === 0) {
      return NextResponse.json({ error: 'Course does not contain lessons to complete' }, { status: 400 })
    }

    // 5. Fetch student's completed lessons in this course
    const { data: completedProgress, error: progressErr } = await supabaseAdmin
      .from('lesson_progress')
      .select('lesson_id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .eq('is_completed', true)

    if (progressErr) {
      console.error("Failed to load lesson progress:", progressErr)
      return NextResponse.json({ error: 'Failed to retrieve completion progress' }, { status: 500 })
    }

    const completedCount = completedProgress?.length || 0

    // Validate completion (Student must have completed 100% of the lessons)
    if (completedCount < totalLessons) {
      return NextResponse.json({
        error: `Course not fully completed yet. Completed ${completedCount}/${totalLessons} lessons.`
      }, { status: 400 })
    }

    // 6. Check if certificate already exists
    const { data: existingCert } = await supabaseAdmin
      .from('certificates')
      .select('certificate_id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existingCert) {
      return NextResponse.json({ success: true, certificateId: existingCert.certificate_id, isNew: false })
    }

    // 7. Generate a unique certificate serial number: e.g., AVA-2026-D5MA-XXXXXX
    const cleanCoursePrefix = courseId.slice(0, 4).toUpperCase()
    const randomSerial = Math.random().toString(36).substring(2, 8).toUpperCase()
    const certificateNumber = `AVA-2026-${cleanCoursePrefix}-${randomSerial}`

    // 8. Insert new certificate
    const { data: newCert, error: insertErr } = await supabaseAdmin
      .from('certificates')
      .insert({
        student_id: user.id,
        course_id: courseId,
        certificate_number: certificateNumber
      })
      .select('certificate_id')
      .single()

    if (insertErr || !newCert) {
      console.error("Failed to write certificate record:", insertErr)
      return NextResponse.json({ error: 'Failed to register certificate database record' }, { status: 500 })
    }

    console.log(`Successfully generated certificate ${newCert.certificate_id} for student ${user.id}`)
    return NextResponse.json({ success: true, certificateId: newCert.certificate_id, isNew: true })

  } catch (err: any) {
    console.error("Certificate generation error:", err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

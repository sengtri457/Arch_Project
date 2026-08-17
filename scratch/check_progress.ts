import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log("Checking database progress states...")

  const { data: progress, error } = await supabase
    .from("lesson_progress")
    .select("*")

  console.log("Lesson Progress rows in DB:", { progress, error })

  const { data: lessons } = await supabase
    .from("lessons")
    .select("lesson_id, course_id, title")

  console.log("Lessons list in DB:", lessons)
}

check()

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log("Checking Course Enrollments...")
  
  const { data: enrollments, error } = await supabase
    .from("course_enrollments")
    .select("*")

  console.log("Enrollments in DB:", { enrollments, error })

  const { data: users, error: userError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
  
  console.log("Profiles in DB:", { users, userError })
}

check()

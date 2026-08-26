import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.join(__dirname, "../.env") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function dump() {
  const { data, error } = await supabase.from("courses").select("course_id, title, slug, duration, lessons, difficulty, is_published")
  if (error) {
    console.error("Error fetching courses:", error)
  } else {
    console.log("Courses in DB:", JSON.stringify(data, null, 2))
  }
}

dump()

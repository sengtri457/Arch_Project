import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// 1. Manually parse .env file to load credentials in raw runtime environment
try {
  const envPath = path.resolve(__dirname, '../.env')
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) return
    
    const match = trimmedLine.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (match) {
      const key = match[1]
      let value = match[2] || ''
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1)
      }
      process.env[key] = value
    }
  })
} catch (e) {
  console.error("Failed to load .env file manually:", e)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

async function runSeed() {
  console.log("🚀 Starting database test seeding...")

  try {
    // 2. Ensure courses prices and plan requirements are populated in public.courses
    console.log("2. Seeding course prices and required subscription plans...")
    
    // Set D5 Masterclass: Price $49.99, Requires Student Pro Plan (plan_id = 2)
    const { error: d5Err } = await supabase
      .from('courses')
      .update({ 
        price: 49.99, 
        required_plan_id: 2 
      })
      .eq('slug', 'd5-masterclass')
    if (d5Err) console.warn("D5 update warning:", d5Err.message)

    // Set Enscape Masterclass: Price $39.99, Requires Student Pro Plan (plan_id = 2)
    const { error: enscapeErr } = await supabase
      .from('courses')
      .update({ 
        price: 39.99, 
        required_plan_id: 2 
      })
      .eq('slug', 'enscape-masterclass')
    if (enscapeErr) console.warn("Enscape update warning:", enscapeErr.message)

    // Set InDesign Masterclass: Price $29.99, Requires Student Pro Plan (plan_id = 2)
    const { error: indesignErr } = await supabase
      .from('courses')
      .update({ 
        price: 29.99, 
        required_plan_id: 2 
      })
      .eq('slug', 'indesign-masterclass')
    if (indesignErr) console.warn("InDesign update warning:", indesignErr.message)

    // Set Photoshop Masterclass: Price $59.99, Requires Mentorship Plan (plan_id = 3)
    const { error: photoErr } = await supabase
      .from('courses')
      .update({ 
        price: 59.99, 
        required_plan_id: 3 
      })
      .eq('slug', 'photoshop-masterclass')
    if (photoErr) console.warn("Photoshop update warning:", photoErr.message)

    console.log("✅ Course parameters seeded successfully!")

    // 3. Fetch the test student user (sengktri@gmail.com)
    console.log("\n3. Fetching student profiles...")
    const { data: student, error: studentErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', 'sengktri@gmail.com')
      .single()

    if (studentErr || !student) {
      console.warn("⚠️ Could not find profile for sengktri@gmail.com. Please make sure they have logged in once.");
      return;
    }

    console.log(`Found test student: ${student.full_name} (${student.id})`)

    // 4. Clean up old test data to reset lock/unlock checks
    console.log("\n4. Cleaning up old test enrollments & subscriptions to reset access...")
    
    // Remove direct course enrollments for this student (so courses lock again for testing)
    await supabase
      .from('course_enrollments')
      .delete()
      .eq('student_id', student.id)
      
    // Remove plan subscriptions for this student
    await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', student.id)

    console.log("✅ Reset complete! Courses are locked for sengktri@gmail.com.")

    // 5. Generate mock pending transaction to simulate checkout flow
    console.log("\n5. Seeding mock pending checkout transaction...")
    const mockBillNumber = `BILL-MOCK-${Date.now()}`
    
    // Fetch D5 Masterclass ID to link
    const { data: d5Course } = await supabase
      .from('courses')
      .select('course_id')
      .eq('slug', 'd5-masterclass')
      .single()

    if (d5Course) {
      const { error: txErr } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: student.id,
          course_id: d5Course.course_id,
          payment_method: 'bakong_khqr',
          bill_number: mockBillNumber,
          amount: 49.99,
          currency: 'USD',
          khqr_payload: '00020101021230670013sxngtri@aba0115SENGTREE bUN0210Phnom Penh...',
          payment_status: 'pending'
        })

      if (txErr) {
        console.error("Failed to seed transaction:", txErr)
      } else {
        console.log(`✅ Seeded pending checkout transaction in DB!`)
        console.log(`👉 Bill Number: ${mockBillNumber}`)
        console.log(`👉 Student ID: ${student.id}`)
      }
    }

  } catch (err: any) {
    console.error("Seeding crashed:", err.message)
  }
}

runSeed()

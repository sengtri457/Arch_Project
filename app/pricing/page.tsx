"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { 
  Check, 
  Sparkles, 
  HelpCircle, 
  Loader2, 
  ArrowRight 
} from "lucide-react"
import Link from "next/link"

interface SubscriptionPlan {
  plan_id: number
  plan_code: string
  name: string
  price_usd: number
  billing_interval: string
}

export default function PricingPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [activePlanId, setActivePlanId] = useState<number | null>(null)
  const [unlockedCourses, setUnlockedCourses] = useState<{ course_id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadPlansAndStatus() {
      try {
        setLoading(true)
        
        // 1. Fetch available plans from DB
        const { data: plansData, error: plansErr } = await supabase
          .from("subscription_plans")
          .select("plan_id, plan_code, name, price_usd, billing_interval")
          .order("plan_id", { ascending: true })

        if (!plansErr && plansData) {
          setPlans(plansData)
        }

        // 2. Fetch student's current active subscription if logged in
        if (user) {
          const { data: sub } = await supabase
            .from("user_subscriptions")
            .select("plan_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle()

          if (sub) {
            setActivePlanId(sub.plan_id)
          }
        }

        // 3. Fetch student's current active course enrollments if logged in
        if (user) {
          const { data: enrollments } = await supabase
            .from("course_enrollments")
            .select("course_id, courses(title)")
            .eq("student_id", user.id)
            .eq("status", "active")

          if (enrollments) {
            const mapped = enrollments.map((e: any) => ({
              course_id: e.course_id,
              title: e.courses?.title || "Course"
            }))
            setUnlockedCourses(mapped)
          }
        }
      } catch (err) {
        console.error("Failed to load subscription plans:", err)
      } finally {
        setLoading(false)
      }
    }

    loadPlansAndStatus()
  }, [user])

  // Get plan feature checklist
  const getFeatures = (planCode: string) => {
    switch (planCode) {
      case "FREE":
        return [
          "Access to free starter courses",
          "Basic rendering video tutorials",
          "Public project showcase browsing",
          "Standard community support access"
        ]
      case "STUDENT_PRO":
        return [
          "Unlock D5 Masterclass & Enscape Masterclass",
          "Unlock InDesign Masterclass syllabus",
          "Downloadable starter models & HDRIs",
          "Dynamic homework exercises & feedback",
          "Priority student community support"
        ]
      case "MENTORSHIP":
        return [
          "Access all courses (including Photoshop)",
          "1-on-1 direct reviews from Bun Sambath",
          "Telegram direct feedback portal",
          "Commercial library project assets",
          "Portfolio review & guidance logs",
          "Custom rendering assets license"
        ]
      default:
        return ["Course material access"]
    }
  }

  if (loading || authLoading) {
    return (
      <main className="min-h-screen flex flex-col justify-between bg-zinc-950 text-white" style={{ backgroundColor: '#060010' }}>
        <Navigation />
        <div className="flex-grow flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9ACD32' }} />
          <span>Loading subscription plans...</span>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col justify-between bg-zinc-950 text-white" style={{ backgroundColor: '#060010' }}>
      <Navigation />

      <div className="flex-grow container mx-auto px-6 py-28 md:py-36 max-w-6xl relative z-10">
        
        {/* Header section */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="px-3 py-1 text-xs font-semibold bg-primary/20 text-primary border border-primary/30 rounded-full inline-flex items-center gap-1.5" style={{ color: '#9ACD32', borderColor: 'rgba(154, 205, 50, 0.3)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            Pricing Plans
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Choose Your Learning Tier
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Invest in your rendering portfolio. Select the right subscription plan to unlock step-by-step visual lessons, assets, and project files.
          </p>
        </div>

        {/* Unlocked Courses / Owned Assets banner */}
        {unlockedCourses.length > 0 && (
          <div className="mb-12 bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-primary" style={{ color: '#9ACD32' }}>
                Your Owned Catalog
              </p>
              <h4 className="text-white font-bold text-sm mt-1">Unlocked Courses (One-time purchase):</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {unlockedCourses.map((c) => (
                  <span key={c.course_id} className="px-2.5 py-1 bg-zinc-950/80 border border-zinc-850 text-zinc-300 text-xs rounded-lg font-medium">
                    {c.title}
                  </span>
                ))}
              </div>
            </div>
            <Link href="/dashboard">
              <Button className="bg-primary text-black font-semibold rounded-xl text-xs py-5 px-5 flex items-center gap-1.5" style={{ backgroundColor: '#9ACD32', color: '#000' }}>
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const features = getFeatures(plan.plan_code)
            const isActive = activePlanId === plan.plan_id
            const isPro = plan.plan_code === "STUDENT_PRO"
            const isMentorship = plan.plan_code === "MENTORSHIP"

            return (
              <div 
                key={plan.plan_id}
                className={`flex flex-col justify-between p-8 rounded-3xl border transition-all duration-300 relative ${
                  isPro 
                    ? "bg-zinc-900/50 border-primary shadow-[0_0_40px_rgba(154,205,50,0.1)] scale-105 z-10" 
                    : "bg-zinc-900/20 border-zinc-800 hover:border-zinc-700/80"
                }`}
                style={isPro ? { borderColor: '#9ACD32' } : {}}
              >
                {/* Popular Badge */}
                {isPro && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] uppercase font-bold bg-primary text-black rounded-full shadow-lg" style={{ backgroundColor: '#9ACD32' }}>
                    Most Popular
                  </span>
                )}

                <div className="space-y-6">
                  {/* Plan Identification */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      {isPro ? "Complete rendering foundations." : isMentorship ? "Direct mentorship and project review." : "Explore starter workflows."}
                    </p>
                  </div>

                  {/* Price info */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      ${parseFloat(plan.price_usd.toString()).toFixed(2)}
                    </span>
                    <span className="text-zinc-500 text-sm">/ {plan.billing_interval}</span>
                  </div>

                  <hr className="border-zinc-800/80" />

                  {/* Feature lists */}
                  <ul className="space-y-3.5">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-zinc-300 gap-3">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" style={{ color: '#9ACD32' }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call-to-action button */}
                <div className="mt-8 pt-6 border-t border-zinc-800/40">
                  {isActive ? (
                    <Button disabled className="w-full bg-zinc-800 text-zinc-500 font-semibold rounded-xl cursor-default py-6">
                      Current Active Plan
                    </Button>
                  ) : plan.plan_code === "FREE" ? (
                    <Link href={user ? "/dashboard" : "/login"} className="w-full">
                      <Button variant="ghost" className="w-full text-zinc-300 hover:text-white border border-zinc-800 hover:bg-zinc-900/40 font-semibold py-6 rounded-xl">
                        {user ? "View Dashboard" : "Get Started"}
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/checkout?planId=${plan.plan_id}`} className="w-full">
                      <Button 
                        className={`w-full font-bold py-6 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                          isPro 
                            ? "bg-primary text-black hover:bg-primary/90" 
                            : "bg-zinc-800 text-white hover:bg-zinc-700"
                        }`}
                        style={isPro ? { backgroundColor: '#9ACD32', color: '#000' } : {}}
                      >
                        Subscribe Now
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>

              </div>
            )
          })}
        </div>

      </div>

      <Footer />
    </main>
  )
}

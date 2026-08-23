import type { Metadata } from "next"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Terms of Service - Archtipsbox",
  description: "Terms of Service for Archtipsbox architectural visualization courses and services.",
}

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. About These Terms",
    body: [
      "These Terms of Service (\"Terms\") govern your access to and use of the Archtipsbox website, online courses, digital content, and related services (collectively, the \"Services\") operated by [COMPANY LEGAL NAME], located in Phnom Penh, Cambodia (\"Archtipsbox\", \"we\", \"us\").",
      "By creating an account, purchasing a course or subscription, or otherwise using the Services, you agree to be bound by these Terms. If you do not agree, please do not use the Services.",
    ],
  },
  {
    title: "2. Accounts",
    body: [
      "You must provide accurate and complete information when creating an account. You are responsible for safeguarding your account credentials and for all activity that occurs under your account.",
      "You must be at least [MINIMUM AGE, e.g. 13] years old to create an account. Accounts may be suspended or terminated for violation of these Terms.",
    ],
  },
  {
    title: "3. Courses, Subscriptions & Payments",
    body: [
      "Courses may be purchased individually or unlocked through a subscription plan. Prices are displayed in US dollars and processed through Bakong KHQR payment channels unless stated otherwise.",
      "Subscriptions renew for the period shown at checkout until cancelled. Access to subscription-gated courses ends when your subscription expires or is terminated.",
      "We reserve the right to change prices, course availability, or plan features at any time; changes will not affect payments already completed.",
    ],
  },
  {
    title: "4. Refund Policy",
    body: [
      "[DESCRIBE YOUR REFUND POLICY - e.g. Digital course purchases are non-refundable once access has been granted. Requests made within 48 hours of purchase and before substantial course consumption may be considered on a case-by-case basis via archtipsbox@gmail.com.]",
    ],
  },
  {
    title: "5. License & Acceptable Use",
    body: [
      "All course videos, exercise files, certificates, and materials are licensed to you for personal, non-commercial learning only. You may not download, record, redistribute, resell, share account credentials, or publicly display course content.",
      "Course materials remain the intellectual property of Archtipsbox and its instructors. Unauthorized distribution may result in account termination and legal action.",
    ],
  },
  {
    title: "6. Certificates",
    body: [
      "Certificates of completion are issued upon satisfying course completion requirements. Certificates acknowledge personal completion of the course and do not constitute an accredited professional qualification.",
    ],
  },
  {
    title: "7. Disclaimer & Limitation of Liability",
    body: [
      "The Services are provided \"as is\" without warranties of any kind. To the maximum extent permitted by law, Archtipsbox shall not be liable for indirect, incidental, or consequential damages arising from your use of the Services.",
    ],
  },
  {
    title: "8. Changes & Contact",
    body: [
      "We may update these Terms from time to time. Continued use of the Services after changes take effect constitutes acceptance of the revised Terms.",
      "Questions about these Terms can be sent to [CONTACT EMAIL, e.g. archtipsbox@gmail.com].",
    ],
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#060010' }}>
      <Navigation />
      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-10">Last updated: August 23, 2026</p>
        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-white mb-3">{section.title}</h2>
              <div className="space-y-3">
                {section.body.map((paragraph, idx) => (
                  <p key={idx} className="text-zinc-400 leading-relaxed">{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="text-sm text-zinc-500 mt-12">
          See also our <Link href="/privacy" className="text-primary underline hover:opacity-80">Privacy Policy</Link>.
        </p>
      </div>
      <Footer />
    </main>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Privacy Policy - Archtipsbox",
  description: "Privacy Policy describing how Archtipsbox collects, uses, and protects your personal data.",
}

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Overview",
    body: [
      "This Privacy Policy explains how [COMPANY LEGAL NAME] (\"Archtipsbox\", \"we\", \"us\") collects, uses, and protects personal information when you use our website, courses, and services.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "Account information: your name, email address, and profile photo, provided via Google sign-in or entered by you.",
      "Learning data: course enrollments, lesson watch progress, exercise submissions, scores, and certificates.",
      "Payment metadata: transaction references, amounts, billing numbers, and promo codes. We do not store bank card details; payments are processed through Bakong KHQR channels.",
      "Usage data: pages visited and basic analytics collected through Vercel Analytics.",
      "Contact form messages you send us, including name, email, company, and message content.",
    ],
  },
  {
    title: "3. How We Use Information",
    body: [
      "To operate your account, deliver purchased courses and subscriptions, track learning progress, issue certificates, process payments, prevent fraud and abuse, respond to inquiries, and improve the Services.",
      "We do not sell your personal information to third parties.",
    ],
  },
  {
    title: "4. Service Providers",
    body: [
      "We rely on Supabase (database, authentication, storage), Vercel (hosting and analytics), Bakong (payment network), and video hosting providers to operate the Services. These providers process data on our behalf under their own privacy terms.",
    ],
  },
  {
    title: "5. Data Retention & Security",
    body: [
      "Account and learning records are retained while your account is active and for a reasonable period afterwards for legal and operational purposes. You may request deletion of your account and personal data at any time.",
      "Access to course video URLs is restricted to enrolled or subscribed users. We apply technical measures to protect content, but no online protection measure is absolute; please help us by not sharing course content.",
    ],
  },
  {
    title: "6. Your Rights",
    body: [
      "You may access, correct, export, or delete your personal information, and object to certain processing, by contacting us at [CONTACT EMAIL, e.g. archtipsbox@gmail.com]. We respond to verified requests within a reasonable timeframe.",
    ],
  },
  {
    title: "7. Children's Privacy",
    body: [
      "The Services are not directed to children under [MINIMUM AGE, e.g. 13]. If you believe a child has created an account, please contact us so we can remove it.",
    ],
  },
  {
    title: "8. Changes & Contact",
    body: [
      "We may update this Privacy Policy from time to time. Material changes will be posted on this page with an updated date.",
      "Privacy questions can be sent to [CONTACT EMAIL, e.g. archtipsbox@gmail.com].",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#060010' }}>
      <Navigation />
      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
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
          See also our <Link href="/terms" className="text-primary underline hover:opacity-80">Terms of Service</Link>.
        </p>
      </div>
      <Footer />
    </main>
  )
}

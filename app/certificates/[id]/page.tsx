import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PrintCertificateButton } from "@/components/print-certificate-button"
import { Award, ArrowLeft, ShieldCheck } from "lucide-react"
import { notFound } from 'next/navigation'

interface CertificatePageProps {
  params: Promise<{ id: string }>
}

export default async function CertificateDetailPage({ params }: CertificatePageProps) {
  const { id } = await params

  // 1. Initialize Supabase Admin client to fetch certificate publicly
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

  // 2. Fetch certificate details
  const { data: cert, error } = await supabaseAdmin
    .from('certificates')
    .select(`
      certificate_id,
      certificate_number,
      issued_at,
      student_id,
      profiles:student_id(full_name),
      courses:course_id(title, slug)
    `)
    .eq('certificate_id', id)
    .single()

  if (error || !cert) {
    console.error("Certificate load error:", error)
    return notFound()
  }

  const studentName = (cert.profiles as any)?.full_name || "Graduate Student"
  const courseTitle = (cert.courses as any)?.title || "Advanced Visual Masterclass"
  const issueDate = new Date(cert.issued_at).toLocaleDateString("en-US", {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <main className="min-h-screen flex flex-col justify-between bg-zinc-950 text-white relative" style={{ backgroundColor: '#060010' }}>
      <style dangerouslySetInnerHTML={{ __html: "@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4 landscape;margin:0}}" }} />
      {/* Navigation header hidden during printing */}
      <div className="print:hidden">
        <Navigation />
      </div>

      <div className="flex-grow container mx-auto px-6 py-28 md:py-36 max-w-5xl flex flex-col items-center justify-center relative z-10">
        
        {/* Top Control Bar (Hidden during printing) */}
        <div className="w-full max-w-4xl flex justify-between items-center mb-8 print:hidden">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-zinc-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
          
          <PrintCertificateButton />
        </div>

        {/* Certificate Paper Frame */}
        <div className="w-full max-w-4xl bg-zinc-900/10 border-4 border-zinc-800 rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden backdrop-blur-sm print:bg-white print:text-black print:border-black print:shadow-none print:p-8 print:my-0">
          
          {/* Elegant Gold Border Inset */}
          <div className="border-2 border-[#9ACD32]/30 rounded-2xl p-6 md:p-10 flex flex-col items-center justify-between text-center relative print:border-black/40 min-h-[500px]">
            
            {/* Background Seal watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-800/10 pointer-events-none select-none print:text-black/5">
              <Award className="w-[300px] h-[300px]" />
            </div>

            {/* Certificate Header */}
            <div className="space-y-3 z-10">
              <span className="text-[10px] tracking-[0.3em] font-extrabold text-[#9ACD32] uppercase">
                ArchViz Academy
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-white print:text-black mt-2">
                Certificate of Completion
              </h2>
              <div className="w-24 h-0.5 bg-[#9ACD32]/40 mx-auto mt-4 print:bg-black/20" />
            </div>

            {/* Recipient Details */}
            <div className="my-8 space-y-4 z-10">
              <p className="text-zinc-400 text-xs italic tracking-wider print:text-zinc-600">
                This is proudly presented to
              </p>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-[#9ACD32] tracking-wide py-2 print:text-black">
                {studentName}
              </h1>
              <p className="text-zinc-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed print:text-zinc-600">
                for successfully completing all visual curriculum lesson modules, video watch heartbeats, and assignment grading criteria established for the advanced masterclass course
              </p>
              <h3 className="text-lg md:text-2xl font-bold text-white print:text-black tracking-wide mt-2">
                {courseTitle}
              </h3>
            </div>

            {/* Issuer and Details Footer */}
            <div className="w-full flex flex-col sm:flex-row justify-between items-end gap-8 pt-8 border-t border-zinc-850/60 print:border-black/10 mt-6 z-10">
              
              {/* Issued Date & Serial */}
              <div className="text-left space-y-2 order-2 sm:order-1">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Date of Issue</p>
                  <p className="text-xs font-semibold text-zinc-300 print:text-black">{issueDate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Verification Serial</p>
                  <p className="text-xs font-mono text-zinc-400 print:text-black">{cert.certificate_number}</p>
                </div>
              </div>

              {/* Secured Badge Center (For verification status) */}
              <div className="mx-auto sm:mx-0 order-1 sm:order-2 flex flex-col items-center gap-1 bg-zinc-950/60 border border-zinc-850 py-2.5 px-4 rounded-xl print:border-black/20 print:bg-zinc-50">
                <ShieldCheck className="w-5 h-5 text-[#9ACD32]" />
                <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Secured & Verified</span>
              </div>

              {/* Instructor Signature Block */}
              <div className="text-right space-y-1.5 order-3">
                <div className="italic text-lg md:text-2xl font-serif text-[#9ACD32] tracking-wider print:text-black">
                  Bun Sambath
                </div>
                <div className="w-32 h-[1px] bg-zinc-800 ml-auto print:bg-black/20" />
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Lead Instructor</p>
                  <p className="text-xs font-semibold text-zinc-300 print:text-black">ArchViz Academy Founder</p>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Verification Link Banner (Hidden during printing) */}
        <div className="mt-8 text-center text-xs text-zinc-500 flex items-center gap-1.5 print:hidden">
          <ShieldCheck className="w-4 h-4 text-zinc-600" />
          Anyone can verify this credential using the secure URL: 
          <span className="font-mono text-zinc-400">/certificates/{cert.certificate_id}</span>
        </div>

      </div>

      {/* Footer hidden during printing */}
      <div className="print:hidden">
        <Footer />
      </div>
    </main>
  )
}

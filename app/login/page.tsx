"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  // Redirect to homepage if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/")
    }
  }, [user, loading, router])

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true)
    setErrorMsg(null)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "Failed to initiate login with Google. Please try again.")
      setIsLoggingIn(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col justify-between" style={{ backgroundColor: '#060010' }}>
      <Navigation />

      {/* Center Box Container */}
      <div className="flex-grow flex items-center justify-center px-6 py-24 relative overflow-hidden">
        {/* Soft background light beams overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-md bg-zinc-950 border border-zinc-800/80 p-8 md:p-10 shadow-2xl rounded-2xl flex flex-col">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-sm text-zinc-400">
              Sign in to access your visualization courses, 3D asset library, and submit exercises.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-lg text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Login Button */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 text-zinc-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9ACD32' }} />
              <span className="text-sm font-medium">Checking session...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 py-6 text-base font-semibold border border-zinc-800 text-white rounded-xl transition-all duration-300 shadow-md bg-zinc-900 hover:bg-zinc-800/80 hover:border-zinc-700 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                )}
                <span>Continue with Google</span>
              </Button>
            </div>
          )}

          <div className="mt-8 border-t border-zinc-900 pt-6 text-center">
            <p className="text-xs text-zinc-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

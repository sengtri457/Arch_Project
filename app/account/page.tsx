"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, User as UserIcon, CheckCircle2, AlertCircle } from "lucide-react"

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]

export default function AccountPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fullName, setFullName] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "")
      setAvatarPreview(profile.avatar_url || null)
    }
  }, [profile])

  const handleSaveName = async () => {
    if (!user) return
    setSavingProfile(true)
    setFeedback(null)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", user.id)

      if (error) throw error

      await refreshProfile()
      setFeedback({ kind: "ok", text: "Profile updated successfully." })
    } catch (err: any) {
      setFeedback({ kind: "error", text: err.message || "Failed to update profile." })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAvatarSelected = async (file: File) => {
    if (!user) return
    setFeedback(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFeedback({ kind: "error", text: "Avatar must be a PNG, JPG or WebP image." })
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFeedback({ kind: "error", text: "Avatar must be smaller than 2 MB." })
      return
    }

    setUploadingAvatar(true)

    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadErr) throw uploadErr

      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      const publicUrl = data.publicUrl

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)

      if (updateErr) throw updateErr

      setAvatarPreview(publicUrl)
      await refreshProfile()
      setFeedback({ kind: "ok", text: "Avatar updated successfully." })
    } catch (err: any) {
      setFeedback({
        kind: "error",
        text:
          err.message?.includes("bucket") || err.message?.includes("storage")
            ? "Storage is not configured yet. Ask the administrator to run the avatars SQL migration."
            : err.message || "Failed to upload avatar."
      })
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#060010" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#9ACD32" }} />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#060010" }}>
      <Navigation />

      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-3xl">
        <h1 className="text-4xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-sm text-zinc-500 mb-10">{user.email}</p>

        {feedback && (
          <div
            className={`mb-8 p-4 rounded-xl border flex items-center gap-2.5 text-sm ${
              feedback.kind === "ok"
                ? "bg-green-950/30 border-green-900/50 text-green-400"
                : "bg-red-950/30 border-red-900/50 text-red-400"
            }`}
          >
            {feedback.kind === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {feedback.text}
          </div>
        )}

        <div className="space-y-8">
          <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-5">Profile picture</h2>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8 text-zinc-600" />
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleAvatarSelected(file)
                  }}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  variant="outline"
                  className="border-zinc-800 text-zinc-300 hover:text-white"
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                    </>
                  ) : (
                    "Choose image"
                  )}
                </Button>
                <p className="text-[11px] text-zinc-500 mt-2">PNG, JPG or WebP - max 2 MB.</p>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-5">Display name</h2>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={120}
              placeholder="Your full name"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-700"
            />
            <p className="text-[11px] text-zinc-500 mt-2">
              This name appears on your certificates and course submissions.
            </p>
            <Button
              onClick={handleSaveName}
              disabled={savingProfile || !fullName.trim()}
              className="mt-5 font-bold px-6"
              style={{ backgroundColor: "#9ACD32", color: "#000" }}
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}

import { useMutation } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"

export function useContactSubmit() {
  const supabase = createClient()
  return useMutation({
    mutationFn: (message: { name: string; email: string; company?: string; message: string }) =>
      db.submitContactMessage(supabase, message),
  })
}
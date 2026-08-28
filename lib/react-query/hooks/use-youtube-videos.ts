import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { queryKeys } from "@/lib/react-query/query-keys"

export function useYoutubeVideos(filters?: { category?: string; search?: string }) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.youtubeVideos.list(filters),
    queryFn: () => db.getYoutubeVideos(supabase, filters),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAddYoutubeVideoMutation() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (video: { video_id: string; title: string; description?: string; category: string; is_featured: boolean; published_at?: string }) =>
      db.addYoutubeVideo(supabase, video),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.youtubeVideos.all })
      queryClient.invalidateQueries({ queryKey: ["admin", "youtubeVideos"] })
    },
  })
}

export function useUpdateYoutubeVideoMutation() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, video }: { id: string; video: { title: string; description?: string; category: string; is_featured: boolean; published_at?: string } }) =>
      db.updateYoutubeVideo(supabase, id, video),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.youtubeVideos.all })
      queryClient.invalidateQueries({ queryKey: ["admin", "youtubeVideos"] })
    },
  })
}

export function useDeleteYoutubeVideoMutation() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => db.deleteYoutubeVideo(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.youtubeVideos.all })
      queryClient.invalidateQueries({ queryKey: ["admin", "youtubeVideos"] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/supabase/db";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useStudentWorkList(filters?: { field?: string; search?: string }) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.studentWork.list(filters),
    queryFn: () => db.getStudentWorkPosts(supabase, { ...filters, onlyPublished: true }),
    staleTime: 2 * 60 * 1000,
  });
}

export function useStudentWorkBySlug(slug: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.studentWork.detail(slug),
    queryFn: () => db.getStudentWorkPostBySlug(supabase, slug),
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });
}

export function useStudentWorkRatings(postId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.studentWork.ratings(postId),
    queryFn: () => db.getStudentWorkRatings(supabase, postId),
    staleTime: 1 * 60 * 1000,
    enabled: !!postId,
  });
}

export function useUserRatingForPost(postId: string, userId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.studentWork.userRating(postId, userId || "none"),
    queryFn: () => db.getUserRatingForPost(supabase, postId, userId!),
    staleTime: 1 * 60 * 1000,
    enabled: !!postId && !!userId,
  });
}

export function useRateWorkMutation(postId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { student_id: string; rating: number; feedback?: string }) =>
      db.rateStudentWork(supabase, { post_id: postId, ...payload }),
    onSuccess: (data) => {
      // Invalidate ratings for this specific post
      queryClient.invalidateQueries({ queryKey: queryKeys.studentWork.ratings(postId) });
      // Invalidate specific user rating cache
      if (data?.student_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.studentWork.userRating(postId, data.student_id) });
      }
      // Invalidate post detail details (average and count recalculated)
      queryClient.invalidateQueries({ queryKey: ["studentWork"] });
    },
  });
}

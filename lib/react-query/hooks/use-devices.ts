"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { queryKeys } from "../query-keys"

export interface ActiveDevice {
  id: string
  user_id: string
  device_id: string
  device_name: string | null
  ip_address: string | null
  user_agent: string | null
  last_active_at: string
  created_at: string
}

export function useActiveDevices(userId: string | undefined) {
  const supabase = createClient()

  return useQuery<ActiveDevice[]>({
    queryKey: queryKeys.account.devices(userId ?? "none"),
    queryFn: async () => {
      if (!userId) return []
      return (await db.getUserActiveDevices(supabase, userId)) as ActiveDevice[]
    },
    enabled: !!userId,
    staleTime: 10 * 1000,
  })
}

export function useRevokeDevice(userId: string | undefined) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (deviceId: string) => {
      await db.revokeUserActiveDevice(supabase, deviceId)
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.account.devices(userId),
        })
      }
    },
  })
}

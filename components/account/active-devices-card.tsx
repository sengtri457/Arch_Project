"use client"

import { useState } from "react"
import { useActiveDevices, useRevokeDevice } from "@/lib/react-query/hooks/use-devices"
import { getDeviceId } from "@/lib/device"
import { Button } from "@/components/ui/button"
import {
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  ShieldCheck,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Radio,
} from "lucide-react"

interface ActiveDevicesCardProps {
  userId: string
}

function getDeviceIcon(deviceName?: string | null, userAgent?: string | null) {
  const combined = `${deviceName || ""} ${userAgent || ""}`.toLowerCase()
  if (combined.includes("iphone") || combined.includes("android") || combined.includes("mobile")) {
    return Smartphone
  }
  if (combined.includes("ipad") || combined.includes("tablet")) {
    return Tablet
  }
  if (combined.includes("mac") || combined.includes("laptop")) {
    return Laptop
  }
  return Monitor
}

function formatRelativeTime(dateString: string) {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    if (diffSecs < 60) return "Active just now"
    const diffMins = Math.floor(diffSecs / 60)
    if (diffMins < 60) return `Active ${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Active ${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return "Active yesterday"
    return `Active ${diffDays} days ago`
  } catch {
    return "Recently active"
  }
}

export function ActiveDevicesCard({ userId }: ActiveDevicesCardProps) {
  const { data: devices = [], isLoading, error } = useActiveDevices(userId)
  const revokeMutation = useRevokeDevice(userId)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null)

  const currentDeviceId = typeof window !== "undefined" ? getDeviceId() : ""

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to sign out "${name || "this device"}"?`)) {
      return
    }

    setRevokingId(id)
    setFeedback(null)

    try {
      await revokeMutation.mutateAsync(id)
      setFeedback({ kind: "ok", text: "Device session revoked successfully." })
    } catch (err: any) {
      setFeedback({ kind: "error", text: err.message || "Failed to revoke device session." })
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <section id="devices" className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 scroll-mt-28">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" style={{ color: "#9ACD32" }} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            Registered Active Devices
          </h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60 w-fit">
          {devices.length} / 2 Devices
        </span>
      </div>

      <p className="text-xs text-zinc-400 mb-6">
        To prevent account sharing and protect your 3D Masterclass content, ArchTipsBox allows up to 2 active workstations or devices simultaneously.
      </p>

      {feedback && (
        <div
          className={`mb-5 p-3 rounded-xl border flex items-center gap-2 text-xs ${
            feedback.kind === "ok"
              ? "bg-green-950/30 border-green-900/50 text-green-400"
              : "bg-red-950/30 border-red-900/50 text-red-400"
          }`}
        >
          {feedback.kind === "ok" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {feedback.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-900/30 bg-red-950/20 text-red-400 text-xs">
          Unable to load active devices.
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
          No registered devices yet. When you watch a lesson, your device is securely registered here.
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => {
            const Icon = getDeviceIcon(device.device_name, device.user_agent)
            const isCurrent = device.device_id === currentDeviceId
            const isRevoking = revokingId === device.id

            return (
              <div
                key={device.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors gap-3 ${
                  isCurrent
                    ? "bg-zinc-950/80 border-[#9ACD32]/40"
                    : "bg-zinc-950/40 border-zinc-800/60"
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                      isCurrent
                        ? "bg-[#9ACD32]/10 border-[#9ACD32]/30 text-[#9ACD32]"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-white">
                        {device.device_name || "Workstation / Browser"}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9ACD32] bg-[#9ACD32]/10 border border-[#9ACD32]/30 px-2 py-0.5 rounded-full">
                          <Radio className="w-2.5 h-2.5 animate-pulse" />
                          This Device
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span>{formatRelativeTime(device.last_active_at)}</span>
                      {device.ip_address && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px]">{device.ip_address}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRevoking}
                    onClick={() => handleRevoke(device.id, device.device_name || "Device")}
                    className="border-zinc-800 hover:border-red-900/60 hover:bg-red-950/20 hover:text-red-400 text-zinc-400 text-xs transition-all h-8 px-3"
                  >
                    {isRevoking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {isCurrent ? "Sign out" : "Revoke"}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

import { describe, it, expect, beforeEach, vi } from "vitest"
import { getDeviceId, getDeviceName, getDeviceHeaders, isCurrentDevice } from "@/lib/device"
import { db } from "@/lib/supabase/db"

describe("Device Tracking Helper (lib/device.ts)", () => {
  beforeEach(() => {
    // Clear localStorage mock
    if (typeof window !== "undefined") {
      localStorage.clear()
    }
  })

  it("generates a valid stable UUID and persists it in localStorage", () => {
    const id1 = getDeviceId()
    expect(id1).toBeDefined()
    expect(typeof id1).toBe("string")
    expect(id1.length).toBeGreaterThan(10)

    // Second call should return the exact same persisted ID
    const id2 = getDeviceId()
    expect(id2).toBe(id1)
  })

  it("generates a human-friendly device name from userAgent", () => {
    const deviceName = getDeviceName()
    expect(deviceName).toBeDefined()
    expect(typeof deviceName).toBe("string")
    expect(deviceName.length).toBeGreaterThan(2)
  })

  it("returns x-device-id and x-device-name in getDeviceHeaders()", () => {
    const headers = getDeviceHeaders()
    expect(headers).toBeDefined()
    expect(headers["x-device-id"]).toBeDefined()
    expect(headers["x-device-name"]).toBeDefined()
    expect(headers["x-device-id"]).toBe(getDeviceId())
    expect(headers["x-device-name"]).toBe(getDeviceName())
  })

  it("accurately identifies current device vs foreign device", () => {
    const currentId = getDeviceId()
    expect(isCurrentDevice(currentId)).toBe(true)
    expect(isCurrentDevice("different-device-uuid-12345")).toBe(false)
    expect(isCurrentDevice("")).toBe(false)
  })

  it("handles db.getUserActiveDevices and db.revokeUserActiveDevice gracefully", async () => {
    const mockDevices = [
      { id: "1", user_id: "user-1", device_id: "dev-1", device_name: "MacBook Pro", last_active_at: new Date().toISOString() }
    ]

    const mockSupabase: any = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockDevices, error: null })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
    }

    const devices = await db.getUserActiveDevices(mockSupabase, "user-1")
    expect(devices).toEqual(mockDevices)
    expect(mockSupabase.from).toHaveBeenCalledWith("user_active_devices")

    await expect(db.revokeUserActiveDevice(mockSupabase, "1")).resolves.toBeUndefined()
  })
})

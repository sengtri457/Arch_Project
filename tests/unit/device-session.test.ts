import { describe, it, expect, beforeEach, vi } from "vitest"
import { getDeviceId, getDeviceName, getDeviceHeaders } from "@/lib/device"

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
})

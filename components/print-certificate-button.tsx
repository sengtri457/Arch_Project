"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PrintCertificateButton() {
  return (
    <Button
      onClick={() => {
        if (typeof window !== "undefined") window.print()
      }}
      className="bg-[#9ACD32] hover:bg-[#9ACD32]/90 text-black font-bold flex items-center gap-1.5 text-xs py-5 px-5"
      style={{ backgroundColor: "#9ACD32", color: "#000" }}
    >
      <Printer className="w-4 h-4" />
      Print / Save PDF
    </Button>
  )
}

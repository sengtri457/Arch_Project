import { ImageResponse } from "next/og"

export const alt = "Archtipsbox - Architectural Visualization Courses & Portfolio"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#060010",
          backgroundImage: "radial-gradient(circle at 25% 20%, rgba(154,205,50,0.18), transparent 45%), radial-gradient(circle at 80% 85%, rgba(120,60,255,0.15), transparent 40%)"
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 8, color: "#9ACD32", fontWeight: 700 }}>
          ARCHTIPSBOX
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: "#fafafa", marginTop: 24, textAlign: "center" }}>
          Architectural Visualization
        </div>
        <div style={{ display: "flex", fontSize: 36, fontWeight: 600, color: "#a1a1aa", marginTop: 12 }}>
          Masterclasses &amp; Portfolio
        </div>
        <div style={{ display: "flex", width: 160, height: 6, backgroundColor: "#9ACD32", borderRadius: 3, marginTop: 40 }} />
      </div>
    ),
    size
  )
}

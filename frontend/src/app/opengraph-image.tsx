import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = "Wellness companion: one small step at a time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#07070b", color: "#f3f3f8" }}>
        <div style={{ fontSize: 34, color: "#8c9bff" }}>{SITE_NAME}</div>
        <div style={{ fontSize: 120, lineHeight: 1, letterSpacing: -4, display: "flex" }}>One small step at a time.</div>
        <div style={{ fontSize: 30, color: "#a9acbd" }}>A wellness companion, not a therapist or a medical service.</div>
      </div>
    ),
    size,
  );
}

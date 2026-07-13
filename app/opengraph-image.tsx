import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Cowork.lk — Coworking Space in Pannipitiya, Sri Lanka";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#231F20",
          backgroundImage:
            "radial-gradient(circle at 85% 25%, rgba(249,164,64,0.35) 0%, rgba(35,31,32,0) 55%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: -1,
            color: "#F9A440",
            textTransform: "uppercase",
          }}
        >
          Cowork.lk
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.1,
            color: "#FFFFFF",
            maxWidth: 900,
          }}
        >
          Work Solo, Collaborate Together.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 30,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          Hot desks, workspaces &amp; meeting rooms in Pannipitiya, Sri Lanka
        </div>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Talk Your Way Out â a daily persuasion game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Gelasio is metric-compatible with the Georgia used on the site.
async function serif() {
  return readFile(join(process.cwd(), "assets/Gelasio-Regular.ttf"));
}

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#faf7f0",
          color: "#292b24",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          fontFamily: "Gelasio",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, letterSpacing: -1.4 }}>
          talk your way out
          <span style={{ color: "#b8442b" }}>.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 990 }}>
          <div style={{ fontSize: 68, lineHeight: 1.14, letterSpacing: -2.4 }}>
            Boarding’s closed. The door’s shut, and it’s shut for everyone.
          </div>
          <div style={{ fontSize: 46, letterSpacing: -1.2, color: "#b8442b", marginTop: 36 }}>
            Get on that plane.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 25, letterSpacing: 2.4, color: "#6c6e62" }}>
          THREE ATTEMPTS. SAY ANYTHING.
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Gelasio", data: await serif(), style: "normal", weight: 400 }] },
  );
}

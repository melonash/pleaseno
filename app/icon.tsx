import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const data = await readFile(join(process.cwd(), "assets/Gelasio-Regular.ttf"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#faf7f0",
          color: "#b8442b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Gelasio",
          fontSize: 82,
          lineHeight: 1,
          paddingTop: 34,
        }}
      >
        &rdquo;
      </div>
    ),
    { ...size, fonts: [{ name: "Gelasio", data, style: "normal", weight: 400 }] },
  );
}

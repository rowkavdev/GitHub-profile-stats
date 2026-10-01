import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const runtime = "edge";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          overflow: "hidden",
          display: "flex",
        }}
      >
        <img
          alt=""
          src={SITE.avatarUrl}
          width={32}
          height={32}
          style={{ borderRadius: "50%" }}
        />
      </div>
    ),
    { width: 32, height: 32 },
  );
}

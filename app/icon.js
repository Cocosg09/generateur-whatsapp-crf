import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e30613",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            position: "relative",
            width: 20,
            height: 20,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 7,
              width: 6,
              height: 20,
              background: "#fff",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 7,
              left: 0,
              width: 20,
              height: 6,
              background: "#fff",
              borderRadius: 1,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";

export const alt = "VieRates sealed mortgage bid ledger";
export const contentType = "image/png";
export const size = {
  height: 630,
  width: 1200,
};

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background: "#0C2A23",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial",
        height: "100%",
        justifyContent: "space-between",
        padding: 72,
        width: "100%",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: 24 }}>
        <div
          style={{
            background: "#F5F7F3",
            borderRadius: 18,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            height: 72,
            justifyContent: "center",
            paddingLeft: 18,
            width: 72,
          }}
        >
          <div
            style={{
              background: "#D9A52B",
              borderRadius: 999,
              height: 8,
              width: 38,
            }}
          />
          <div
            style={{
              background: "#0C2A23",
              borderRadius: 999,
              height: 8,
              width: 28,
            }}
          />
          <div
            style={{
              background: "#7E8C83",
              borderRadius: 999,
              height: 8,
              width: 18,
            }}
          />
        </div>
        <div style={{ fontSize: 46, fontWeight: 700 }}>VieRates</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.02,
          }}
        >
          <div>Lenders compete.</div>
          <div>You stay anonymous.</div>
        </div>
        <div style={{ color: "#C7D3CC", fontSize: 30, lineHeight: 1.35 }}>
          A sealed mortgage bid room where borrowers choose when identity is
          revealed.
        </div>
      </div>

      <div
        style={{
          border: "1px solid #1E4F42",
          borderRadius: 22,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {[
          ["FICO 740+", "30-year fixed", "6.08% APR"],
          ["FICO 720-739", "30-year fixed", "6.31% APR"],
          ["FICO 700-719", "30-year fixed", "6.54% APR"],
        ].map(([profile, product, apr], index) => (
          <div
            key={profile}
            style={{
              alignItems: "center",
              background: index === 0 ? "#143B31" : "#0C2A23",
              borderTop: index === 0 ? "0" : "1px solid #1E4F42",
              display: "flex",
              fontSize: 28,
              justifyContent: "space-between",
              padding: "18px 26px",
            }}
          >
            <div style={{ color: "#C7D3CC" }}>{profile}</div>
            <div style={{ color: "#C7D3CC" }}>{product}</div>
            <div style={{ color: "#D9A52B", fontWeight: 700 }}>{apr}</div>
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}

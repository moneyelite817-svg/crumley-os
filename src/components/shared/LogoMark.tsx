// All In One Luxury 4-dot logo mark with double circle
export function LogoMark({ size = 44, dotColor = "#fff", ringColor = "#1a6eff" }: { size?: number; dotColor?: string; ringColor?: string }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${ringColor}88` }} />
      <div style={{ position: "absolute", inset: size * 0.11, borderRadius: "50%", border: `1px solid ${ringColor}44` }} />
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: size * 0.09, padding: size * 0.27 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ borderRadius: "50%", background: dotColor }} />
        ))}
      </div>
    </div>
  );
}

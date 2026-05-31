"use client";
import Link from "next/link";
import { SAMPLE_ATHLETES } from "@/lib/sample-data";

export default function CoachDashboard() {
  const athletes = SAMPLE_ATHLETES;
  const urgent = athletes.filter((a) => a.status === "urgent").length;

  return (
    <main style={{ minHeight: "100vh", background: "#000", paddingBottom: 40 }}>
      <div style={{ background: "linear-gradient(150deg,#001133,#000)", borderBottom: "3px solid #1a6eff", padding: "28px 16px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#1a6eff", fontWeight: 700 }}>D1 TRAINING · HULEN</div>
          <Link href="/dashboard" style={{ color: "#888", textDecoration: "none", fontSize: 13 }}>⚡ Master</Link>
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>COACH T<br /><span style={{ color: "#1a6eff" }}>COMMAND CENTER</span></div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[{ l: "ROSTER", icon: "👥", href: "/coach/roster" }, { l: "SCHEDULE", icon: "📅", href: "/coach/schedule" }, { l: "AI AGENT", icon: "⚡", href: "/coach/agent" }, { l: "$800 GOAL", icon: "💰", href: "/coach/dashboard" }].map((c, i) => (
            <Link key={i} href={c.href} style={{ textDecoration: "none" }}>
              <div style={{ background: "#111", border: "1px solid #1a6eff44", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 26 }}>{c.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#1a6eff", marginTop: 6 }}>{c.l}</div>
              </div>
            </Link>
          ))}
        </div>
        {urgent > 0 && <div style={{ marginTop: 16, background: "#ff3b3b18", border: "1px solid #ff3b3b", borderRadius: 12, padding: 14, color: "#ff3b3b", fontSize: 13, fontWeight: 700 }}>{urgent} athlete(s) need renewal — commission opportunity</div>}
      </div>
    </main>
  );
}

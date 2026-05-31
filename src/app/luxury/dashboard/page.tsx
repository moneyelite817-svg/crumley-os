"use client";
import Link from "next/link";
import { LogoMark } from "@/components/shared/LogoMark";
import { SAMPLE_JOBS } from "@/lib/sample-data";
import { daysUntil } from "@/services/scheduling-engine";

export default function LuxuryDashboard() {
  const jobs = SAMPLE_JOBS; // replace with Supabase query in production
  const total = jobs.reduce((s, j) => s + j.value, 0);
  const expiring = jobs.filter((j) => daysUntil(j.end_date) <= 14);

  return (
    <main style={{ minHeight: "100vh", background: "#0d1628", paddingBottom: 40 }}>
      <div style={{ background: "linear-gradient(160deg,#060d1a,#0d1628 60%,#111e36)", borderBottom: "3px solid #1a6eff", padding: "28px 16px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LogoMark size={40} />
            <div style={{ fontSize: 15, fontWeight: 900 }}>ALL IN ONE <span style={{ color: "#1a6eff" }}>LUXURY</span></div>
          </div>
          <Link href="/dashboard" style={{ color: "#7a8fbb", textDecoration: "none", fontSize: 13 }}>⚡ Master</Link>
        </div>
        <div style={{ fontSize: 26, fontWeight: 900 }}>Business <span style={{ color: "#1a6eff" }}>Command Center</span></div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {[{ l: "ACTIVE", v: jobs.length, c: "#2ab877" }, { l: "EXPIRING", v: expiring.length, c: "#f0c040" }, { l: "REVENUE", v: `$${(total / 1000).toFixed(1)}k`, c: "#1a6eff" }].map((s, i) => (
            <div key={i} style={{ flex: 1, background: `${s.c}18`, border: `1px solid ${s.c}44`, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 8, color: "#7a8fbb", letterSpacing: 2, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[{ l: "JOBS", icon: "🏠", href: "/luxury/jobs" }, { l: "MOVING", icon: "🚛", href: "/luxury/moving" }, { l: "CLIENTS", icon: "🤝", href: "/luxury/clients" }, { l: "INVOICES", icon: "📋", href: "/luxury/invoices" }, { l: "REVENUE", icon: "💰", href: "/luxury/revenue" }].map((c, i) => (
            <Link key={i} href={c.href} style={{ textDecoration: "none" }}>
              <div style={{ background: "#162040", border: "1px solid #1a6eff44", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 26 }}>{c.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#1a6eff", marginTop: 6 }}>{c.l}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

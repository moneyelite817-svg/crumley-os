"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

// ── Logo Mark Component ──
function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* Outer ring */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: "50%",
        border: "1.5px solid rgba(26,110,255,0.5)",
        animation: "spin-slow 20s linear infinite",
      }} />
      {/* Inner ring */}
      <div style={{
        position: "absolute", inset: size * 0.12,
        borderRadius: "50%",
        border: "1px solid rgba(26,110,255,0.2)",
        animation: "counter-spin 15s linear infinite",
      }} />
      {/* 4-dot grid */}
      <div style={{
        position: "absolute", inset: 0,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: size * 0.1,
        padding: size * 0.28,
      }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 0 8px rgba(26,110,255,0.6)",
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Stat Counter ──
function StatCounter({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(22px, 4vw, 32px)",
        fontWeight: 800,
        color: "#fff",
        letterSpacing: "-0.02em",
      }}>{value}</div>
      <div style={{
        fontFamily: "var(--font-body)",
        fontSize: 11,
        color: "rgba(255,255,255,0.35)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginTop: 4,
      }}>{label}</div>
    </div>
  );
}

// ── Business Card ──
function BusinessCard({
  href, brand, title, subtitle, items, accent, delay
}: {
  href: string;
  brand: string;
  title: string;
  subtitle: string;
  items: string[];
  accent: string;
  delay: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        className={`animate-fade-up ${delay}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          background: hovered
            ? `linear-gradient(135deg, rgba(26,110,255,0.08), rgba(10,18,35,0.9))`
            : "rgba(255,255,255,0.02)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${hovered ? "rgba(26,110,255,0.3)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 20,
          padding: "28px 24px",
          cursor: "pointer",
          transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered
            ? `0 20px 60px rgba(26,110,255,0.15), 0 4px 20px rgba(0,0,0,0.5)`
            : "0 4px 20px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Top glow line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: hovered
            ? `linear-gradient(90deg, transparent, ${accent}, transparent)`
            : "transparent",
          transition: "all 0.35s",
        }} />

        {/* Brand label */}
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2em",
          color: accent,
          marginBottom: 14,
          textTransform: "uppercase",
        }}>{brand}</div>

        {/* Title */}
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(18px, 3vw, 22px)",
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          marginBottom: 8,
        }}>{title}</div>

        {/* Subtitle */}
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "rgba(255,255,255,0.45)",
          marginBottom: 20,
          lineHeight: 1.5,
        }}>{subtitle}</div>

        {/* Divider */}
        <div className="divider" />

        {/* Feature list */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {items.map((item, i) => (
            <span key={i} style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 6,
              padding: "4px 10px",
              transition: "all 0.2s",
            }}>{item}</span>
          ))}
        </div>

        {/* Arrow */}
        <div style={{
          position: "absolute",
          top: 24, right: 24,
          width: 32, height: 32,
          borderRadius: "50%",
          background: hovered ? accent : "rgba(255,255,255,0.04)",
          border: `1px solid ${hovered ? accent : "rgba(255,255,255,0.08)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
          transition: "all 0.3s",
          transform: hovered ? "rotate(-45deg)" : "rotate(0deg)",
        }}>→</div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    setLoaded(true);
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
    }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="ambient-bg grid-texture" style={{
      minHeight: "100vh",
      background: "var(--os-bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 20px 60px",
      position: "relative",
    }}>

      {/* ── Top status bar ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(3,6,15,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        padding: "10px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark size={24} />
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 13, fontWeight: 700,
            letterSpacing: "0.08em", color: "#fff",
          }}>CRUMLEY OS</span>
        </div>
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: 12, color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.05em",
        }}>{time}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d084",
            boxShadow: "0 0 8px rgba(0,208,132,0.8)" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 10,
            color: "#00d084", letterSpacing: "0.1em" }}>LIVE</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{
        paddingTop: "120px",
        textAlign: "center",
        maxWidth: 520,
        width: "100%",
      }}>
        <div className="animate-fade-up" style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <LogoMark size={72} />
        </div>

        <div className="animate-fade-up delay-100" style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(36px, 8vw, 56px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.0,
          marginBottom: 10,
        }}>
          CRUMLEY<br />
          <span style={{
            background: "linear-gradient(135deg, #1a6eff, #4a8fff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>OS</span>
        </div>

        <div className="animate-fade-up delay-200" style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}>AI Operating System · DFW</div>

        <div className="animate-fade-up delay-300" style={{
          fontFamily: "var(--font-body)",
          fontSize: "clamp(13px, 2vw, 15px)",
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.7,
          marginBottom: 36,
          maxWidth: 360,
          margin: "0 auto 36px",
        }}>
          Precision. Luxury. Intelligence.<br />
          One system for every operation.
        </div>

        {/* Stats row */}
        <div className="animate-fade-up delay-400" style={{
          display: "flex",
          justifyContent: "center",
          gap: "clamp(20px, 6vw, 48px)",
          marginBottom: 48,
          padding: "20px 24px",
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 16,
        }}>
          <StatCounter value="2" label="Businesses" />
          <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
          <StatCounter value="8" label="Active Jobs" />
          <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
          <StatCounter value="AI" label="Powered" />
        </div>
      </div>

      {/* ── Business cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
        gap: 14,
        width: "100%",
        maxWidth: 680,
        marginBottom: 14,
      }}>
        <BusinessCard
          href="/luxury/dashboard"
          brand="All In One Luxury"
          title="Staging & Moving Operations"
          subtitle="Client management · Revenue · Invoices · Logistics"
          items={["Staging", "Moving", "Clients", "Revenue", "Invoices", "Leads"]}
          accent="#1a6eff"
          delay="delay-300"
        />
        <BusinessCard
          href="/coach/dashboard"
          brand="Elite Skillz Lab 🧪"
          title="Athlete Development System"
          subtitle="D1 Training · Private coaching · 7v7 operations"
          items={["Roster", "Schedule", "AI Workouts", "$800 Goal", "Progress"]}
          accent="#4a8fff"
          delay="delay-400"
        />
      </div>

      {/* ── Master dashboard CTA ── */}
      <div className="animate-fade-up delay-500" style={{
        width: "100%",
        maxWidth: 680,
        marginBottom: 32,
      }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <div style={{
            background: "rgba(26,110,255,0.06)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(26,110,255,0.15)",
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "all 0.3s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(26,110,255,0.1)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,110,255,0.3)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(26,110,255,0.06)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,110,255,0.15)";
          }}>
            <div>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 15, fontWeight: 700,
                color: "#fff", letterSpacing: "-0.01em",
                marginBottom: 3,
              }}>⚡ Master Dashboard</div>
              <div style={{
                fontFamily: "var(--font-body)",
                fontSize: 12, color: "rgba(255,255,255,0.35)",
              }}>Both businesses · AI daily brief · Unified schedule · Priority engine</div>
            </div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: 11, fontWeight: 700,
              color: "#1a6eff", letterSpacing: "0.1em",
              whiteSpace: "nowrap",
            }}>OPEN →</div>
          </div>
        </Link>
      </div>

      {/* ── Footer ── */}
      <div style={{
        fontFamily: "var(--font-body)",
        fontSize: 11,
        color: "rgba(255,255,255,0.18)",
        letterSpacing: "0.1em",
        textAlign: "center",
      }}>
        CRUMLEY OS · DFW METROPLEX · DESIGNS INSPIRED TO ENHANCE
      </div>
    </main>
  );
}

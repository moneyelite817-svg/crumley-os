"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAI } from "@/hooks/useAI";
import { buildDailyPlan, revenueSnapshot, LOCKED_COACHING_BLOCKS } from "@/services/scheduling-engine";
import { dailyBriefPrompt } from "@/services/ai-prompts";
import { SAMPLE_JOBS, SAMPLE_ATHLETES } from "@/lib/sample-data";

// ── Types ──
interface KPICard {
  label: string;
  value: string;
  sub: string;
  accent: string;
  trend?: string;
}

interface PriorityTask {
  title: string;
  reason: string;
  business: "luxury" | "coach" | "personal";
  priority: number;
  locked: boolean;
}

// ── Logo Mark ──
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%",
        border: "1.5px solid rgba(26,110,255,0.5)" }} />
      <div style={{ position: "absolute", inset: size * 0.12, borderRadius: "50%",
        border: "1px solid rgba(26,110,255,0.2)" }} />
      <div style={{ position: "absolute", inset: 0, display: "grid",
        gridTemplateColumns: "1fr 1fr", gap: size * 0.1, padding: size * 0.28 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ borderRadius: "50%", background: "#fff",
            boxShadow: "0 0 4px rgba(26,110,255,0.5)" }} />
        ))}
      </div>
    </div>
  );
}

// ── KPI Card ──
function KPICardComponent({ card, delay }: { card: KPICard; delay: number }) {
  return (
    <div className={`kpi-card animate-fade-up`}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}>
      {/* Label */}
      <div style={{ fontFamily: "var(--font-display)", fontSize: 9,
        fontWeight: 700, letterSpacing: "0.15em",
        color: "rgba(255,255,255,0.35)", marginBottom: 10,
        textTransform: "uppercase" }}>{card.label}</div>
      {/* Value */}
      <div style={{ fontFamily: "var(--font-display)",
        fontSize: "clamp(22px,4vw,28px)", fontWeight: 800,
        color: card.accent, letterSpacing: "-0.02em",
        lineHeight: 1, marginBottom: 6 }}>{card.value}</div>
      {/* Sub */}
      <div style={{ fontFamily: "var(--font-body)", fontSize: 11,
        color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{card.sub}</div>
      {/* Trend */}
      {card.trend && (
        <div style={{ marginTop: 10, fontFamily: "var(--font-display)", fontSize: 10,
          fontWeight: 600, color: "#00d084", letterSpacing: "0.05em" }}>
          {card.trend}
        </div>
      )}
    </div>
  );
}

// ── Priority Item ──
function PriorityItem({ task, index }: { task: PriorityTask; index: number }) {
  const colors = { 1: "#ff4444", 2: "#f0c040", 3: "#1a6eff", 4: "#00d084", 5: "rgba(255,255,255,0.3)" };
  const color = colors[task.priority as keyof typeof colors] || colors[5];

  return (
    <div style={{
      display: "flex", gap: 12, padding: "12px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      alignItems: "flex-start",
      animation: `fade-up 0.4s ease ${index * 60}ms both`,
    }}>
      {/* Priority indicator */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginTop: 3 }}>
        <div className={`priority-dot priority-${task.priority}`} />
        {task.locked && <span style={{ fontSize: 9 }}>🔒</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600,
          color: task.locked ? "#1a6eff" : "#fff",
          letterSpacing: "-0.01em", marginBottom: 2,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{task.title}</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 11,
          color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>{task.reason}</div>
      </div>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700,
        color: task.business === "luxury" ? "#1a6eff" : "#4a8fff",
        letterSpacing: "0.08em", flexShrink: 0, marginTop: 2,
        textTransform: "uppercase",
      }}>{task.business}</div>
    </div>
  );
}

// ── AI Brief Panel ──
function AIBriefPanel({ onGenerate, loading, result, error }: {
  onGenerate: () => void;
  loading: boolean;
  result: string;
  error: string;
}) {
  return (
    <div style={{
      background: "rgba(26,110,255,0.04)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(26,110,255,0.12)",
      borderRadius: 20, padding: "22px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Scan line effect */}
      {loading && (
        <div style={{
          position: "absolute", left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(26,110,255,0.8), transparent)",
          animation: "scan-line 2s ease-in-out infinite",
        }} />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(26,110,255,0.15)",
          border: "1px solid rgba(26,110,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
          animation: loading ? "pulse-glow 1.5s ease infinite" : "none",
        }}>⚡</div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 13,
            fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>AI Daily Brief</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11,
            color: "rgba(255,255,255,0.3)" }}>Powered by Claude</div>
        </div>
      </div>

      {!result && !loading && (
        <button onClick={onGenerate} className="btn-primary"
          style={{ width: "100%", fontSize: 13 }}>
          Generate Today's Brief
        </button>
      )}

      {loading && (
        <div style={{ padding: "20px 0" }}>
          {[80, 60, 70, 45].map((w, i) => (
            <div key={i} className="skeleton" style={{
              height: 12, marginBottom: 10,
              width: `${w}%`,
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
      )}

      {error && (
        <div style={{
          background: "rgba(255,68,68,0.1)",
          border: "1px solid rgba(255,68,68,0.2)",
          borderRadius: 10, padding: "12px 14px",
          fontFamily: "var(--font-body)", fontSize: 13, color: "#ff6b6b",
        }}>{error}</div>
      )}

      {result && (
        <div style={{
          fontFamily: "var(--font-body)", fontSize: 14,
          color: "rgba(255,255,255,0.75)",
          lineHeight: 1.75, whiteSpace: "pre-wrap",
        }}>{result}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MASTER DASHBOARD
// ══════════════════════════════════════════════════════════
export default function MasterDashboard() {
  const { loading, result, error, generate } = useAI();
  const [tasks, setTasks] = useState<PriorityTask[]>([]);
  const [revenue, setRevenue] = useState({ activeStaging: 0, urgentCommission: 0, expiringValue: 0 });
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const plan = buildDailyPlan(SAMPLE_JOBS, SAMPLE_ATHLETES, []);
    setTasks(plan as PriorityTask[]);
    setRevenue(revenueSnapshot(SAMPLE_JOBS, SAMPLE_ATHLETES));

    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
      setDate(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
    };
    tick();
    const t = setInterval(tick, 10000);
    return () => clearInterval(t);
  }, []);

  const today = new Date().getDay();
  const isCoachingDay = LOCKED_COACHING_BLOCKS.some(b => b.day === today);

  const kpis: KPICard[] = [
    {
      label: "Active Staging",
      value: "$19.9k",
      sub: "8 properties active",
      accent: "#1a6eff",
      trend: "↑ 2 expiring soon",
    },
    {
      label: "Commission Due",
      value: `$${revenue.urgentCommission}+`,
      sub: "5 urgent renewals",
      accent: "#f0c040",
      trend: "Close now",
    },
    {
      label: "D1 Weekly Goal",
      value: "$800",
      sub: "Tue + Wed + Thu",
      accent: "#00d084",
    },
    {
      label: "Priorities",
      value: `${tasks.length}`,
      sub: "AI-ranked tasks",
      accent: tasks.some(t => t.priority === 1) ? "#ff4444" : "#4a8fff",
    },
  ];

  return (
    <main className="ambient-bg grid-texture" style={{
      minHeight: "100vh", background: "var(--os-bg)",
      paddingBottom: 80,
    }}>

      {/* ── Top Navigation ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(3,6,15,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "0 20px",
      }}>
        <div style={{
          maxWidth: 720, margin: "0 auto",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          height: 56,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={28} />
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 13,
                fontWeight: 800, letterSpacing: "0.05em" }}>CRUMLEY OS</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 10,
                color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em",
                textTransform: "uppercase" }}>Master Dashboard</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12,
              color: "rgba(255,255,255,0.25)" }}>{time}</div>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div className="btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}>
                ← Home
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px" }}>

        {/* ── Date/greeting ── */}
        <div className="animate-fade-up" style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: "var(--font-body)", fontSize: 12,
            color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em",
            marginBottom: 4,
          }}>{date}</div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px, 4vw, 28px)",
            fontWeight: 800, letterSpacing: "-0.03em",
          }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
            <span style={{ color: "#1a6eff" }}>Terrance.</span>
          </div>
        </div>

        {/* ── Coaching day alert ── */}
        {isCoachingDay && (
          <div className="animate-fade-up delay-100" style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(26,110,255,0.06)",
            border: "1px solid rgba(26,110,255,0.15)",
            borderRadius: 12, padding: "12px 16px",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 16 }}>🔒</div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 12,
                fontWeight: 700, color: "#1a6eff", letterSpacing: "0.05em" }}>
                D1 TRAINING LOCKED · 5:45–7:45 PM
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11,
                color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                AI will not schedule over this commitment
              </div>
            </div>
          </div>
        )}

        {/* ── KPI Grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10, marginBottom: 16,
        }}>
          {kpis.map((kpi, i) => (
            <KPICardComponent key={i} card={kpi} delay={i * 80} />
          ))}
        </div>

        {/* ── Business switcher ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 10, marginBottom: 16,
        }}>
          {[
            { href: "/luxury/dashboard", label: "ALL IN ONE LUXURY", sub: "Staging · Moving · Clients", icon: "🏠", accent: "#1a6eff" },
            { href: "/coach/dashboard", label: "ELITE SKILLZ LAB 🧪", sub: "D1 · Private Training", icon: "💪", accent: "#4a8fff" },
          ].map((b, i) => (
            <Link key={i} href={b.href} style={{ textDecoration: "none" }}>
              <div className="animate-fade-up glass"
                style={{ padding: "16px", animationDelay: `${300 + i * 80}ms`, opacity: 0 }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{b.icon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 11,
                  fontWeight: 700, color: b.accent, letterSpacing: "0.08em",
                  marginBottom: 3 }}>{b.label}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 11,
                  color: "rgba(255,255,255,0.3)" }}>{b.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── AI Daily Brief ── */}
        <div className="animate-fade-up delay-400" style={{ marginBottom: 16, opacity: 0 }}>
          <AIBriefPanel
            onGenerate={() => generate(dailyBriefPrompt(tasks, revenue))}
            loading={loading}
            result={result}
            error={error}
          />
        </div>

        {/* ── Priority Queue ── */}
        <div className="animate-fade-up delay-500" style={{
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20, padding: "20px",
          opacity: 0,
        }}>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 16,
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 11,
              fontWeight: 700, letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
              Today's Priority Queue
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 10,
              color: "#1a6eff", letterSpacing: "0.08em" }}>
              AI RANKED
            </div>
          </div>

          {tasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0",
              fontFamily: "var(--font-body)", fontSize: 13,
              color: "rgba(255,255,255,0.25)" }}>
              No urgent tasks. Run your AI brief above.
            </div>
          ) : (
            tasks.map((task, i) => (
              <PriorityItem key={i} task={task} index={i} />
            ))
          )}
        </div>

      </div>
    </main>
  );
}

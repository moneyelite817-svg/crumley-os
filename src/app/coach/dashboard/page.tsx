"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CoachDashboard() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [aiAction, setAiAction] = useState<string|null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem("ct_clients"); if (s) setAthletes(JSON.parse(s)); } catch {}
  }, []);

  const urgent = athletes.filter(a => a.status === "urgent");
  const inactive = athletes.filter(a => a.status === "inactive");
  const active = athletes.filter(a => a.status === "active");
  const totalSessions = athletes.reduce((a, b) => a + (b.sessions || 0), 0);
  const hasMaxes = athletes.filter(a => a.maxes && Object.values(a.maxes).some((v: any) => v)).length;

  const DASHBOARD_AI = [
    { id: "dailyBrief",  icon: "📋", label: "Today's Coaching Brief",   desc: "What to focus on across all athletes today" },
    { id: "weekPlan",    icon: "📅", label: "Weekly Training Plan",      desc: "Priority plan for all athletes this week" },
    { id: "revenueGoal", icon: "💵", label: "$800 Goal Check",           desc: `Status toward weekly revenue goal` },
    { id: "urgentPlan",  icon: "🔥", label: "Handle Urgent Athletes",    desc: `Plan for ${urgent.length} athletes needing renewal` },
    { id: "inactiveReach",icon:"🔁", label: "Re-Engage Inactive",        desc: `Strategy for ${inactive.length} inactive athletes` },
    { id: "growthMove",  icon: "📈", label: "Top Growth Move",           desc: "Biggest opportunity to grow Elite Skillz Lab this week" },
  ];

  async function generateAI(action: string) {
    setLoading(true); setResult(""); setError(""); setAiAction(action);
    const rosterSummary = athletes.map(a => `${a.name} (${a.sport}, ${a.sessions} sessions, ${a.status})`).join(" | ");
    const urgentList = urgent.map(a => `${a.name} - ${a.sessions} sessions left`).join(", ");

    const prompts: Record<string, string> = {
      dailyBrief: `You are the AI coaching brain for Coach T (Terrance Crumley) at Elite Skillz Lab 🧪, D1 Training Hulen Fort Worth. Today is ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}. ${[2,3].includes(new Date().getDay())?"D1 TRAINING IS LOCKED 5:45-7:45 PM TODAY.":"No D1 lock today."}\n\nRoster: ${rosterSummary}\nUrgent renewals: ${urgentList||"none"}\nTotal athletes: ${athletes.length} (${active.length} active, ${urgent.length} urgent, ${inactive.length} inactive)\n\nGenerate a sharp daily coaching brief. What are the top 3 actions for today? Who needs immediate attention? What session should Coach T prioritize? What's the one message to send right now? Sound like a high-level sports performance director.`,

      weekPlan: `COO AI for Elite Skillz Lab 🧪. D1 locked Tue/Wed 5:45-7:45 PM.\nRoster: ${rosterSummary}\nGenerate a complete weekly training priority plan. For each day Mon-Fri: which athletes to focus on, what training themes to run, any urgent business actions. $800/week goal. Be specific and actionable.`,

      revenueGoal: `Business brain for Elite Skillz Lab 🧪. Coach T earns $25/hr + 10% commission. Goal: $800/week.\nAthletes: ${athletes.length} total. Urgent renewals: ${urgentList||"none"}. Total active sessions in packages: ${totalSessions}.\nAnalyze the current revenue situation. How close is Coach T to $800/week? What are the top 3 actions to close the gap? Who should he call first? Be direct with numbers.`,

      urgentPlan: `Coach T needs to handle ${urgent.length} urgent athlete renewals: ${urgentList||"none listed"}. Each renewal = $25/hr. Generate a specific action plan: who to contact first, what to say, in what order. Include the exact message to send to the #1 priority renewal. Direct, no fluff.`,

      inactiveReach: `Coach T has ${inactive.length} inactive athletes: ${inactive.map(a=>`${a.name} (${a.notes||"no notes"})`).join(", ")||"none"}. Generate a specific re-engagement strategy. Who is most likely to return? What's the outreach order? Write the first message to send to the highest-probability inactive athlete.`,

      growthMove: `Business strategist for Elite Skillz Lab 🧪 at D1 Training Hulen Fort Worth. Current: ${athletes.length} athletes, ${urgent.length} urgent renewals, $800/week goal.\nWhat is the single highest-impact growth move for Elite Skillz Lab THIS WEEK? Consider: adding athletes, increasing frequency, D1 class promotions, referrals from current families, Instagram content. Give ONE specific action with exact steps. Not 5 things — the ONE best move.`,
    };

    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: prompts[action] }) });
      const data = await res.json();
      if (data.error) setError(data.message || data.error);
      else setResult(data.text);
    } catch { setError("Network error."); }
    setLoading(false);
  }

  function copy() { navigator.clipboard?.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  const today = new Date().getDay();
  const isD1 = today === 2 || today === 3;

  return (
    <main style={{ minHeight: "100vh", background: "#000", paddingBottom: 40, fontFamily: "system-ui" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(150deg,#001133,#000)", borderBottom: "3px solid #1a6eff", padding: "28px 16px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#1a6eff", fontWeight: 700 }}>D1 TRAINING · HULEN FORT WORTH</div>
          <Link href="/dashboard" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: 12 }}>⚡ Master</Link>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>ELITE SKILLZ<br /><span style={{ color: "#1a6eff" }}>LAB 🧪</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
          {[
            { l: "ATHLETES", v: athletes.length, c: "#1a6eff" },
            { l: "URGENT", v: urgent.length, c: "#ff4444" },
            { l: "SESSIONS", v: totalSessions, c: "#f0c040" },
            { l: "W/ MAXES", v: hasMaxes, c: "#00d084" },
          ].map((s, i) => (
            <div key={i} style={{ background: `${s.c}18`, border: `1px solid ${s.c}44`, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {/* D1 lock alert */}
        {isD1 && (
          <div style={{ background: "rgba(26,110,255,0.08)", border: "1px solid rgba(26,110,255,0.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a6eff" }}>D1 TRAINING LOCKED 5:45–7:45 PM</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Protected commitment — nothing books over this</div>
            </div>
          </div>
        )}

        {/* AI Dashboard Panel */}
        <div style={{ background: "rgba(26,110,255,0.04)", border: "1px solid rgba(26,110,255,0.2)", borderRadius: 16, padding: "16px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: result || loading ? 14 : 0 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#1a6eff" }}>⚡ AI COACHING BRAIN</div>
            {(result || loading) && <button onClick={() => { setResult(""); setError(""); setAiAction(null); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>← Back</button>}
          </div>

          {!result && !loading && (
            <div>
              {DASHBOARD_AI.map(a => (
                <div key={a.id} onClick={() => generateAI(a.id)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 12px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: "#1a6eff", marginBottom: 1 }}>{a.label}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{a.desc}</div></div>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
                </div>
              ))}
            </div>
          )}
          {loading && <div style={{ textAlign: "center", padding: "24px 0" }}><div style={{ fontSize: 32, marginBottom: 10 }}>⚙️</div><div style={{ fontSize: 14, fontWeight: 800, color: "#1a6eff", letterSpacing: "0.1em" }}>GENERATING...</div></div>}
          {error && <div style={{ background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 10, padding: "12px", color: "#ff8888", fontSize: 13 }}>{error}</div>}
          {result && (
            <div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px", fontSize: 13, lineHeight: 1.8, color: "#fff", whiteSpace: "pre-wrap", marginBottom: 12 }}>{result}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                <button onClick={() => { setResult(""); setError(""); if (aiAction) generateAI(aiAction); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #333", color: "rgba(255,255,255,0.4)", borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: 12 }}>🔄 Redo</button>
                <button onClick={copy} style={{ background: copied ? "#00d084" : "#1a6eff", border: "none", color: copied ? "#000" : "#fff", borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: 13, fontWeight: 900 }}>{copied ? "✓ COPIED!" : "📋 COPY"}</button>
              </div>
            </div>
          )}
        </div>

        {/* Nav grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { href: "/coach/roster",   icon: "👥", l: "ROSTER",   s: `${athletes.length} athletes`, c: "#1a6eff" },
            { href: "/coach/schedule", icon: "📅", l: "SCHEDULE", s: "Tue+Wed locked",              c: "#4a8fff" },
            { href: "/coach/agent",    icon: "⚡", l: "AI AGENT", s: `${Object.keys(SKILLS||{}).reduce((t,k) => t, 0)} skills ready`, c: "#1a6eff" },
            { href: "/coach/roster",   icon: "💰", l: "$800 GOAL",s: "D1 + commissions",            c: "#00d084" },
          ].map((c, i) => (
            <Link key={i} href={c.href} style={{ textDecoration: "none" }}>
              <div style={{ background: "#111", border: `1px solid ${c.c}33`, borderRadius: 14, padding: "16px" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: c.c, marginBottom: 3 }}>{c.l}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{c.s}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Urgent quick action */}
        {urgent.length > 0 && (
          <div style={{ marginTop: 14, background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 14, padding: "14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#ff4444", letterSpacing: "0.1em", marginBottom: 10 }}>🔥 URGENT RENEWALS</div>
            {urgent.map(a => (
              <Link key={a.id} href="/coach/agent" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,68,68,0.08)", cursor: "pointer" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: "#ff4444" }}>{a.sessions} left → ⚡ Renew</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* D1 locked blocks */}
        <div style={{ marginTop: 14, background: "rgba(26,110,255,0.04)", border: "1px solid rgba(26,110,255,0.15)", borderRadius: 14, padding: "14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#1a6eff", marginBottom: 10 }}>🔒 D1 LOCKED COMMITMENTS</div>
          {[{ d: "TUESDAY", t: "5:45 PM – 7:45 PM", s: "2 group classes" }, { d: "WEDNESDAY", t: "5:45 PM – 7:45 PM", s: "2 group classes" }].map((b, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 1 ? "1px solid rgba(26,110,255,0.08)" : "none" }}>
              <div><span style={{ fontSize: 11, fontWeight: 700, color: "#1a6eff" }}>{b.d}</span><span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>{b.s}</span></div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{b.t}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// Export MiniAIPanel for use in other pages
export { MiniAIPanel };

// Need to import SKILLS for the dashboard skill count
const SKILLS: Record<string, any[]> = {
  training: new Array(8), comms: new Array(7), assess: new Array(5),
  content: new Array(5), business: new Array(5), strategy: new Array(5)
};

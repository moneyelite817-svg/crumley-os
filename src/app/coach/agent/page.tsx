"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE = "ct_clients";

const ACTIONS = [
  { id:"workout", label:"WORKOUT PLAN", icon:"🏋️", desc:"Full 60-min session with exact sets, reps, and weights from maxes" },
  { id:"renewal", label:"RENEWAL PITCH", icon:"💰", desc:"Re-sign this athlete before sessions run out" },
  { id:"parent", label:"PARENT UPDATE", icon:"👨‍👩‍👦", desc:"Professional progress text to send to parent" },
  { id:"reengage", label:"RE-ENGAGE", icon:"🔁", desc:"Bring back an inactive or quiet athlete" },
  { id:"progress", label:"PROGRESS NOTE", icon:"📈", desc:"4-week development summary to parent" },
  { id:"instagram", label:"ATHLETE CONTENT", icon:"📱", desc:"Instagram post featuring this athlete's development" },
];

function buildPrompt(athlete: any, action: string, extra: string): string {
  const maxList = Object.entries(athlete.maxes || {})
    .filter(([, v]) => v)
    .map(([k, v]) => {
      const labels: Record<string, string> = {
        squat: "Squat 1RM", bench: "Bench 1RM", deadlift: "Deadlift 1RM",
        powerClean: "Power Clean", sprint40: "40-yard dash", vertical: "Vertical jump",
        broadJump: "Broad jump", agility: "Pro agility", pullups: "Pull-ups max",
        pushups: "Push-ups max", hangClean: "Hang Clean", customPR: "Custom PR"
      };
      return `${labels[k] || k}: ${v}`;
    })
    .join(", ");

  const athleteContext = `
ATHLETE: ${athlete.name}
Sport: ${athlete.sport || "General Athletics"}
Position: ${athlete.position || "N/A"}
Age: ${athlete.age || "Unknown"}
Weight: ${athlete.weight ? athlete.weight + " lbs" : "Unknown"}
Goal: ${athlete.goal || "Athletic development"}
Injuries/Limitations: ${athlete.injuries || "None"}
Sessions remaining: ${athlete.sessions}
Training frequency: ${athlete.freq}x per week
Recorded maxes/PRs: ${maxList || "None recorded yet"}
Parent: ${athlete.parentName || "N/A"}
Notes: ${athlete.notes || "None"}
${extra ? `\nSpecific instruction: ${extra}` : ""}`.trim();

  if (action === "workout") {
    return `You are Coach T, head trainer at Elite Skillz Lab 🧪 at D1 Training Hulen Fort Worth, TX. You train athletes using DUMBBELLS AND RESISTANCE BANDS ONLY — no barbells, no squat rack, no machines. Sessions are exactly 60 minutes.

${athleteContext}

Generate a complete, detailed 60-minute workout plan for today's session. 

CRITICAL RULES:
- Dumbbells and resistance bands ONLY
- If maxes are recorded, calculate dumbbell weights as a percentage (e.g. if squat max is 225lbs, use 35-40lb DBs for goblet squats)
- Include EXACT weights, sets, reps, and rest periods for every exercise
- Format for easy phone reading during the session

Use this exact format:

**${athlete.name.split(" ")[0].toUpperCase()} — SESSION PLAN**
*${new Date().toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric" })} · 60 min · DB + Bands*

**⚡ ACTIVATION (5 min)**
1. Exercise — sets x reps — coaching cue
2. Exercise — sets x reps — coaching cue
3. Exercise — sets x reps — coaching cue

**💥 POWER (12 min)**
1. Exercise — sets x reps @ weight — coaching cue
2. Exercise — sets x reps @ weight — coaching cue

**💪 STRENGTH BLOCK (25 min)**
A1. Exercise — sets x reps @ weight — rest 45s
A2. Superset exercise — sets x reps @ weight — rest 90s
B1. Exercise — sets x reps @ weight
B2. Superset exercise — sets x reps @ weight

**🔥 CONDITIONING (12 min)**
Circuit: X rounds, Y seconds on / Z seconds rest
1. Exercise
2. Exercise
3. Exercise

**🧊 COOLDOWN (6 min)**
1. Stretch/mobility

**🎯 COACH T CUE:**
[One specific motivational coaching note personalized to this athlete and their goal]

**📅 NEXT SESSION FOCUS:**
[What to build on next time]`;
  }

  if (action === "renewal") {
    return `You are Coach T at Elite Skillz Lab 🧪, D1 Training Hulen Fort Worth. You earn $25/hr + 10% commission. Your weekly revenue goal is $800.

${athleteContext}

This athlete has ${athlete.sessions} session${athlete.sessions !== 1 ? "s" : ""} remaining. Write a confident, warm renewal pitch directed at the parent (if youth athlete) or directly to the athlete. Reference their specific progress, what's coming next in their development, and make renewing feel like the natural next step. Sound like a coach who believes in this athlete — not a salesperson trying to close a deal. Under 5 sentences.`;
  }

  if (action === "parent") {
    return `You are Coach T at Elite Skillz Lab 🧪, D1 Training Hulen Fort Worth.

${athleteContext}

Write a professional, warm text message to ${athlete.parentName || "the parent"} about their athlete ${athlete.name}. Sound like a coach who genuinely invests in their athletes. Be specific to their sport and goals. Mention something they're working on and what's next. Under 5 sentences. Do NOT sound generic.`;
  }

  if (action === "reengage") {
    return `You are Coach T at Elite Skillz Lab 🧪, D1 Training Hulen Fort Worth.

${athleteContext}

This athlete has been inactive or quiet. Write a warm, genuine re-engagement message to ${athlete.parentName || "the parent/athlete"}. Sound like a coach who noticed they were missing and genuinely wants them back — not like a business chasing a lost client. Reference their sport/goal. End with a question about their availability. Under 4 sentences.`;
  }

  if (action === "progress") {
    return `You are Coach T at Elite Skillz Lab 🧪, D1 Training Hulen Fort Worth.

${athleteContext}

Write a 4-week progress update for the parent. Structure: 1 strength win, 1 movement/speed improvement, 1 character or attitude note, and what the next training focus will be. Sound specific, professional, and invested. Under 6 sentences.`;
  }

  if (action === "instagram") {
    return `You are the social media voice for Elite Skillz Lab 🧪 — Coach T's athlete development brand at D1 Training Hulen Fort Worth.

${athleteContext}

Write an Instagram caption featuring this athlete's development journey (do NOT use their real name — refer to them as "one of our athletes" or their position like "our QB" or "our receiver"). Highlight their sport, their grind, and their improvement. Tone: elite, authentic, proud coach energy. Under 8 sentences. End with 4-5 relevant hashtags including #EliteSkillzLab #D1Training #DFWAthletes.`;
  }

  return `Coach T at Elite Skillz Lab. ${athleteContext}. Help with: ${action}. ${extra}`;
}

export default function CoachAgentPage() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selAthlete, setSelAthlete] = useState<any>(null);
  const [selAction, setSelAction] = useState<string | null>(null);
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE);
      if (s) setAthletes(JSON.parse(s));
    } catch {}
  }, []);

  async function generate() {
    if (!selAthlete || !selAction) return;
    setLoading(true);
    setResult("");
    setError("");

    try {
      const prompt = buildPrompt(selAthlete, selAction, extra);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.message || data.error);
      } else {
        setResult(data.text);
      }
    } catch {
      setError("Network error. Check your connection and Anthropic credits.");
    }
    setLoading(false);
  }

  function copy() {
    navigator.clipboard?.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const urgent = athletes.filter(a => a.status === "urgent");

  // ── STEP 1: SELECT ATHLETE ──
  if (!selAthlete) return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", gap:12 }}>
        <Link href="/coach/dashboard" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"none", fontSize:20 }}>←</Link>
        <div>
          <div style={{ fontSize:16, fontWeight:800 }}>AI AGENT ⚡</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Elite Skillz Lab 🧪</div>
        </div>
      </div>
      <div style={{ padding:"16px" }}>
        {urgent.length > 0 && (
          <div style={{ background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:12, padding:"14px", marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:"#ff4444", marginBottom:10 }}>🔥 URGENT — ACT NOW</div>
            {urgent.map(a => (
              <div key={a.id} onClick={() => setSelAthlete(a)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,68,68,0.1)", cursor:"pointer" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{a.name}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{a.sport} · {a.sessions} session{a.sessions !== 1 ? "s" : ""} left</div>
                </div>
                <div style={{ fontSize:11, color:"#ff4444", fontWeight:700 }}>Renew now →</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize:11, letterSpacing:"0.12em", color:"rgba(255,255,255,0.3)", fontWeight:700, textTransform:"uppercase", marginBottom:12 }}>ALL ATHLETES</div>
        {athletes.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.3)", fontSize:13, lineHeight:1.7 }}>
            No athletes loaded.<br/>
            <Link href="/coach/roster" style={{ color:"#1a6eff", textDecoration:"none", fontWeight:700 }}>Go to Roster →</Link>
          </div>
        )}
        {athletes.map(a => {
          const colors: Record<string, string> = { urgent:"#ff4444", inactive:"rgba(255,255,255,0.25)", active:"#1a6eff" };
          const c = colors[a.status] || "#1a6eff";
          const hasMaxes = a.maxes && Object.values(a.maxes).some((v: any) => v);
          return (
            <div key={a.id} onClick={() => setSelAthlete(a)} style={{ background:"#111", border:"1px solid #222", borderLeft:`3px solid ${c}`, borderRadius:10, padding:"12px 14px", marginBottom:8, cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{a.name}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>
                    {a.sport}{a.position?` · ${a.position}`:""} · {a.sessions} sessions
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                  <div style={{ fontSize:9, padding:"3px 8px", background:`${c}22`, color:c, borderRadius:4, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>{a.status}</div>
                  {hasMaxes && <div style={{ fontSize:9, color:"rgba(26,110,255,0.7)" }}>📊 maxes</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );

  // ── STEP 2: SELECT ACTION ──
  if (!selAction) {
    const hasMaxes = selAthlete.maxes && Object.values(selAthlete.maxes).some((v: any) => v);
    return (
      <main style={{ minHeight:"100vh", background:"#000", paddingBottom:80, fontFamily:"system-ui" }}>
        <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={() => setSelAthlete(null)} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Athletes</button>
          <span style={{ fontSize:14, fontWeight:700 }}>{selAthlete.name}</span>
          <div style={{ width:60 }}/>
        </div>
        <div style={{ padding:"16px" }}>
          {/* Athlete summary */}
          <div style={{ background:"rgba(26,110,255,0.08)", border:"1px solid rgba(26,110,255,0.2)", borderRadius:12, padding:"14px", marginBottom:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:8 }}>
              {[{l:"SESSIONS",v:selAthlete.sessions},{l:"FREQ/WK",v:`${selAthlete.freq}x`},{l:"SPORT",v:selAthlete.sport||"Gen"}].map((s, i) => (
                <div key={i} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:15, fontWeight:900, color:"#1a6eff" }}>{s.v}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            {selAthlete.goal && <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>🎯 {selAthlete.goal}</div>}
            {selAthlete.injuries && <div style={{ fontSize:12, color:"#ff4444", marginTop:4 }}>⚠️ {selAthlete.injuries}</div>}
            {!hasMaxes && (
              <div style={{ marginTop:10, padding:"8px 10px", background:"rgba(240,192,64,0.08)", border:"1px solid rgba(240,192,64,0.2)", borderRadius:8, fontSize:11, color:"#f0c040" }}>
                ⚠️ No maxes recorded — workout plan will use general weights. <Link href="/coach/roster" style={{ color:"#1a6eff", textDecoration:"none", fontWeight:700 }}>Add maxes in Roster →</Link>
              </div>
            )}
          </div>

          <div style={{ fontSize:11, letterSpacing:"0.12em", color:"rgba(255,255,255,0.3)", fontWeight:700, textTransform:"uppercase", marginBottom:12 }}>SELECT ACTION</div>
          {ACTIONS.map(action => (
            <div key={action.id} onClick={() => setSelAction(action.id)} style={{ background:"#111", border:"1px solid #222", borderRadius:12, padding:"16px", marginBottom:10, cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ fontSize:28 }}>{action.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#1a6eff", marginBottom:3 }}>{action.label}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.4 }}>{action.desc}</div>
              </div>
              <span style={{ color:"rgba(255,255,255,0.2)", fontSize:18 }}>›</span>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // ── STEP 3: GENERATE ──
  const action = ACTIONS.find(a => a.id === selAction);
  return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={() => { setSelAction(null); setResult(""); setError(""); }} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Back</button>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:"#1a6eff" }}>{action?.icon} {action?.label}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{selAthlete.name}</div>
        </div>
      </div>

      <div style={{ padding:"16px" }}>
        {/* Optional instruction */}
        {!result && !loading && (
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:4 }}>
              💬 SPECIFIC INSTRUCTION (optional)
            </label>
            <textarea
              value={extra}
              onChange={e => setExtra(e.target.value)}
              placeholder={
                selAction === "workout" ? "e.g. Focus on explosiveness · Knee issue today · Short on time · Upper body emphasis" :
                selAction === "renewal" ? "e.g. Offer a package deal · He's been asking about speed training" :
                "Any specific notes or context..."
              }
              style={{ width:"100%", padding:"10px 12px", background:"#111", border:"1px solid #333", borderRadius:10, color:"#fff", fontFamily:"system-ui", fontSize:14, outline:"none", height:70, resize:"none", boxSizing:"border-box" }}
            />
            <button onClick={generate} style={{ width:"100%", background:"#1a6eff", border:"none", color:"#fff", borderRadius:12, padding:"16px", fontSize:16, fontWeight:900, cursor:"pointer", letterSpacing:"0.05em", marginTop:12 }}>
              ⚡ GENERATE
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:"50px 0" }}>
            <div style={{ fontSize:40, marginBottom:16 }}>⚙️</div>
            <div style={{ fontSize:16, fontWeight:800, color:"#1a6eff", letterSpacing:"0.1em", marginBottom:8 }}>
              {selAction === "workout" ? "BUILDING WORKOUT..." : "GENERATING..."}
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>
              {selAction === "workout" ? `Creating ${selAthlete.name.split(" ")[0]}'s personalized session plan` : "One moment..."}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:12, padding:"16px", fontSize:13, color:"#ff8888", lineHeight:1.6, marginBottom:14 }}>
            {error}
            {error.includes("credit") && (
              <div style={{ marginTop:10 }}>
                <a href="https://console.anthropic.com/settings/billing" target="_blank" style={{ color:"#1a6eff", fontWeight:700, textDecoration:"none", fontSize:12 }}>→ Add credits at console.anthropic.com</a>
              </div>
            )}
            <button onClick={() => { setError(""); }} style={{ marginTop:12, background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:12 }}>Try Again</button>
          </div>
        )}

        {/* Result */}
        {result && (
          <>
            <div style={{ background:"#111", border:"1px solid #222", borderRadius:14, padding:"18px", fontSize:14, lineHeight:1.85, color:"#fff", whiteSpace:"pre-wrap", marginBottom:14, fontFamily: selAction === "workout" ? "monospace" : "system-ui" }}>
              {result}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10, marginBottom:16 }}>
              <button onClick={() => { setResult(""); setError(""); }} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid #333", color:"rgba(255,255,255,0.4)", borderRadius:10, padding:"14px", cursor:"pointer", fontSize:13, fontWeight:700 }}>🔄 REDO</button>
              <button onClick={copy} style={{ background:copied?"#00d084":"#1a6eff", border:"none", color:copied?"#000":"#fff", borderRadius:10, padding:"14px", cursor:"pointer", fontSize:14, fontWeight:900 }}>
                {copied ? "✓ COPIED!" : "📋 COPY"}
              </button>
            </div>

            {/* Run another */}
            <div style={{ fontSize:11, letterSpacing:"0.1em", color:"rgba(255,255,255,0.25)", textTransform:"uppercase", marginBottom:10 }}>Run Another</div>
            {ACTIONS.filter(a => a.id !== selAction).map(a => (
              <div key={a.id} onClick={() => { setSelAction(a.id); setResult(""); setError(""); setExtra(""); }} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid #222", borderRadius:8, padding:"10px 14px", marginBottom:8, cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:18 }}>{a.icon}</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#1a6eff" }}>{a.label}</span>
                <span style={{ marginLeft:"auto", color:"rgba(255,255,255,0.2)" }}>›</span>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}

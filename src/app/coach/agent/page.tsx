"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE = "ct_clients";

const CATEGORIES = [
  { id:"training",  label:"🏋️ Training",     color:"#1a6eff" },
  { id:"comms",     label:"💬 Communication", color:"#00d084" },
  { id:"assess",    label:"📊 Assessment",    color:"#f0c040" },
  { id:"content",   label:"📱 Content",       color:"#9b59b6" },
  { id:"business",  label:"💰 Business",      color:"#e74c3c" },
  { id:"strategy",  label:"🎯 Strategy",      color:"#f39c12" },
];

const ALL_SKILLS: Record<string, {id:string;icon:string;label:string;desc:string}[]> = {
  training: [
    {id:"workout",     icon:"🏋️", label:"Full Session Plan",       desc:"Complete 60-min workout with exact weights from maxes"},
    {id:"speed",       icon:"⚡", label:"Speed & Agility Session",  desc:"Dedicated speed, agility and footwork block"},
    {id:"strength",    icon:"💪", label:"Strength Block",           desc:"Heavy compound movements with DB progressions"},
    {id:"warmup",      icon:"🔥", label:"Dynamic Warm-Up",         desc:"Sport-specific activation and movement prep"},
    {id:"conditioning",icon:"🫁", label:"Conditioning Circuit",    desc:"High-intensity conditioning finisher"},
    {id:"recovery",    icon:"🧊", label:"Recovery Protocol",       desc:"Active recovery for sore or injured athlete"},
    {id:"compPrep",    icon:"🏆", label:"Competition Prep",        desc:"Peak performance plan before game or combine"},
    {id:"program",     icon:"📋", label:"4-Week Program",          desc:"Full monthly training block with progression"},
  ],
  comms: [
    {id:"parentUpdate",   icon:"👨‍👩‍👦", label:"Parent Progress Update",  desc:"Professional progress text to parent"},
    {id:"athleteCheckIn", icon:"👋",    label:"Athlete Check-In",         desc:"Direct message to keep athlete engaged"},
    {id:"renewal",        icon:"💰",    label:"Renewal Pitch",            desc:"Re-sign athlete before sessions run out"},
    {id:"reEngage",       icon:"🔁",    label:"Re-Engage Inactive",       desc:"Bring back an athlete who has gone quiet"},
    {id:"milestone",      icon:"🎉",    label:"Milestone Celebration",    desc:"Celebrate a PR or breakthrough"},
    {id:"teamAnnounce",   icon:"📢",    label:"Team Announcement",        desc:"Message to send to all athletes"},
    {id:"sessionRecap",   icon:"📝",    label:"Session Recap",            desc:"Post-session summary to parent"},
  ],
  assess: [
    {id:"progressReport", icon:"📈", label:"Progress Report",       desc:"Detailed 4-week development summary"},
    {id:"prSummary",      icon:"🏅", label:"PR Summary",            desc:"Highlight all recent personal records"},
    {id:"devAnalysis",    icon:"🔬", label:"Development Analysis",  desc:"Honest strengths and gaps assessment"},
    {id:"combineReady",   icon:"🎯", label:"Combine Readiness",     desc:"Where athlete stands vs D1/D2 standards"},
    {id:"injuryPlan",     icon:"🩹", label:"Injury Modification",   desc:"Training plan around current injury"},
  ],
  content: [
    {id:"instaAthlete",  icon:"📸", label:"Athlete Spotlight Post", desc:"Instagram feature on athlete's journey"},
    {id:"instaPR",       icon:"🏆", label:"PR Celebration Post",    desc:"Post celebrating a new personal record"},
    {id:"programPromo",  icon:"📣", label:"Program Promo Post",     desc:"Promote Elite Skillz Lab program"},
    {id:"motivational",  icon:"🔥", label:"Motivational Post",      desc:"Fire coaching content for D1 brand"},
    {id:"d1Brand",       icon:"💎", label:"D1 Brand Content",       desc:"Premium positioning content"},
  ],
  business: [
    {id:"packageRec",  icon:"📦", label:"Package Recommendation", desc:"Best package for this athlete's goals"},
    {id:"upsell",      icon:"📈", label:"Upsell Message",         desc:"Pitch more sessions or higher frequency"},
    {id:"referralAsk", icon:"🤝", label:"Referral Request",       desc:"Ask parent to refer another athlete"},
    {id:"d1Pitch",     icon:"🏫", label:"D1 Class Pitch",         desc:"Get athlete into D1 group classes"},
    {id:"weeklyGoal",  icon:"💵", label:"Revenue Goal Check",     desc:"Progress toward $800/week goal"},
  ],
  strategy: [
    {id:"weekPlan",       icon:"📅", label:"Weekly Training Priority", desc:"Focus plan across all athletes this week"},
    {id:"athletePlan",    icon:"🗺", label:"6-Month Development Plan", desc:"Roadmap to reach athlete's goals"},
    {id:"d1Positioning",  icon:"🎓", label:"D1 College Positioning",   desc:"What athlete needs to reach D1"},
    {id:"offseasonPlan",  icon:"☀️", label:"Offseason Plan",           desc:"Maximize development during school break"},
    {id:"coachingTip",    icon:"💡", label:"Coaching Tip / Drill",     desc:"Sport-specific drill or technique cue"},
  ],
};

function buildPrompt(athlete: any, skillId: string, extra: string): string {
  const maxList = Object.entries(athlete?.maxes || {})
    .filter(([,v]) => v)
    .map(([k,v]) => {
      const n:Record<string,string> = {squat:"Squat 1RM",bench:"Bench 1RM",deadlift:"Deadlift 1RM",powerClean:"Power Clean",sprint40:"40yd dash",vertical:"Vertical",broadJump:"Broad Jump",agility:"Pro Agility",pullups:"Pull-ups max",pushups:"Push-ups max",hangClean:"Hang Clean",customPR:"Custom PR"};
      return `${n[k]||k}: ${v}`;
    }).join(" | ");

  const ctx = `COACH T — Elite Skillz Lab 🧪 | D1 Training Hulen Fort Worth TX | DB + Bands ONLY | 60 min sessions
ATHLETE: ${athlete?.name||"Athlete"} | Sport: ${athlete?.sport||"General"} | Position: ${athlete?.position||"N/A"} | Age: ${athlete?.age||"?"} | ${athlete?.weight||"?"}lbs
Goal: ${athlete?.goal||"Athletic development"} | Injuries: ${athlete?.injuries||"None"} | Sessions left: ${athlete?.sessions||"?"} | ${athlete?.freq||2}x/week
Maxes: ${maxList||"Not recorded — use intermediate weights"} | Parent: ${athlete?.parentName||"N/A"} | Notes: ${athlete?.notes||"None"}
${extra?`Context: ${extra}`:""}`;

  if(skillId==="workout") return `${ctx}

Generate a COMPLETE 60-minute session. DUMBBELLS AND BANDS ONLY — no barbells, no machines.
${maxList?`WEIGHT RULES: Use % of max (Power=65%, Strength=75-80%, Conditioning=55%). Prescribe exact DB weights.`:"Use RPE and give specific weight ranges (e.g. 25-30 lb DBs)."}
NEVER say "appropriate weight" — always give a number.

Format EXACTLY like this:

**${(athlete?.name||"ATHLETE").split(" ")[0].toUpperCase()} — SESSION PLAN**
📅 ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})} | ⏱ 60 Min | 🏋️ DB + Bands Only

━━━ ⚡ ACTIVATION (5 min) ━━━
1. [Exercise] — [reps] — [cue]
2. [Exercise] — [reps] — [cue]
3. [Exercise] — [reps] — [cue]

━━━ 💥 POWER (12 min) ━━━
1. [Exercise] — [sets]x[reps] @ [specific lbs] — [cue] | Rest [sec]
2. [Exercise] — [sets]x[reps] @ [specific lbs] — [cue] | Rest [sec]

━━━ 💪 STRENGTH A (12 min) ━━━
A1. [Exercise] — [sets]x[reps] @ [lbs] — [cue]
A2. [Exercise] — [sets]x[reps] @ [lbs] — [cue]
Rest 90 sec | [X] rounds

━━━ 💪 STRENGTH B (10 min) ━━━
B1. [Exercise] — [sets]x[reps] @ [lbs] — [cue]
B2. [Exercise] — [sets]x[reps] @ [lbs] — [cue]
Rest 60 sec | [X] rounds

━━━ 🔥 CONDITIONING (15 min) ━━━
[X] rounds | [work]s on / [rest]s off
1. [Exercise]
2. [Exercise]
3. [Exercise]
4. [Exercise]

━━━ 🧊 COOLDOWN (6 min) ━━━
1. [Stretch — hold time]
2. [Stretch — hold time]
3. [Stretch — hold time]

━━━ 🎯 COACH T CUE ━━━
[Specific coaching note for THIS athlete]

━━━ 📅 NEXT SESSION ━━━
[What to build on next time]`;

  if(skillId==="speed") return `${ctx}\n\nDesign a 60-min SPEED & AGILITY session for ${athlete?.sport||"general athletics"}. DB and bands only. Include: movement prep, acceleration work, change of direction, sport-specific footwork, band resistance drills, conditioning finisher. Give exact distances, reps, rest periods. Format like a real speed coach's plan.`;
  if(skillId==="strength") return `${ctx}\n\nBuild a STRENGTH-FOCUSED 60-min session. DB and bands ONLY. Emphasize compound movements (push, pull, hinge, squat, carry). ${maxList?`Prescribe exact weights from these maxes: ${maxList}`:"Use bodyweight and RPE."} Give exact sets, reps, weights, rest periods. Explain the strength adaptation goal.`;
  if(skillId==="warmup") return `${ctx}\n\nDesign a 12-minute DYNAMIC WARM-UP for ${athlete?.sport||"athletics"} — ${athlete?.position||"athlete"}. No equipment. Include: foam rolling cues, joint mobilization, dynamic stretching, neural activation, sport movement patterns. Exact reps and coaching cues for each movement.`;
  if(skillId==="conditioning") return `${ctx}\n\nDesign a brutal 20-min CONDITIONING CIRCUIT. DB and bands only. Work:rest ratios, weights, rounds, coach's challenge. Sport-specific to ${athlete?.sport||"athletics"}. Explain the energy system being trained.`;
  if(skillId==="recovery") return `${ctx}\n\nDesign a 45-min ACTIVE RECOVERY session. Low intensity, blood flow focused. Include: breathing protocol, foam rolling, mobility flows, light band work, mental reset. No heavy lifting. Day after a tough training block.`;
  if(skillId==="compPrep") return `${ctx}\n\nCreate a COMPETITION PREP plan for the 5 days leading up to a game or combine. Day-by-day schedule, taper strategy, activation work, mental prep, pre-game morning routine. Elite sports performance level.`;
  if(skillId==="program") return `${ctx}\n\nDesign a complete 4-WEEK PROGRAM. Week 1: Foundations. Week 2: Volume. Week 3: Intensity. Week 4: Peak/Test. Weekly themes, main lifts, key benchmarks. Expected gains at end of 4 weeks. DB and bands only.`;
  if(skillId==="parentUpdate") return `${ctx}\n\nProfessional parent progress text to ${athlete?.parentName||"the parent"} about ${athlete?.name||"their athlete"}. Include: 1 strength win, 1 movement improvement, 1 character note, next focus. Specific, not generic. Under 6 sentences.`;
  if(skillId==="athleteCheckIn") return `${ctx}\n\nDirect check-in text FROM Coach T TO ${athlete?.name?.split(" ")[0]||"the athlete"}. Keep them engaged between sessions. Reference their sport or goal. Real coach energy. Under 3 sentences.`;
  if(skillId==="renewal") return `${ctx}\n\n${athlete?.sessions} sessions remaining. Confident renewal pitch to ${athlete?.parentName||"the parent/athlete"}. Reference specific progress. Make renewing feel obvious. Coach — not salesperson. Under 5 sentences.`;
  if(skillId==="reEngage") return `${ctx}\n\nWarm re-engagement text to ${athlete?.parentName||"the parent/athlete"}. Athlete has been inactive. Sound like a coach who noticed they were missing. Reference their goals. End with easy availability question. Under 4 sentences.`;
  if(skillId==="milestone") return `${ctx}\n\nCelebration message to ${athlete?.parentName||"the parent/athlete"} — athlete just hit a major milestone. Be specific, enthusiastic, build momentum for what's next. Under 4 sentences.`;
  if(skillId==="teamAnnounce") return `${ctx}\n\nTeam-wide announcement from Coach T at Elite Skillz Lab 🧪. Context: ${extra||"training update"}. Professional, energetic, coach voice. Under 5 sentences.`;
  if(skillId==="sessionRecap") return `${ctx}\n\nSession recap text to ${athlete?.parentName||"the parent"} after training with ${athlete?.name?.split(" ")[0]||"their athlete"} today. What was worked on, what stood out, one thing to focus on before next session. Under 4 sentences.`;
  if(skillId==="progressReport") return `${ctx}\n\nDetailed 4-week progress report. Strength development, speed changes, mental/attitude notes, improvements, areas needing work. ${maxList?`Benchmarks: ${maxList}.`:""} Professional enough to share with school coach.`;
  if(skillId==="prSummary") return `${ctx}\n\nPR Summary for ${athlete?.name||"the athlete"}. Recorded maxes: ${maxList||"none yet"}. Compare to age/position standards. Top 2 strengths, top 2 gaps. Simple score out of 10 for overall athletic development.`;
  if(skillId==="devAnalysis") return `${ctx}\n\nHonest development analysis of ${athlete?.name||"this athlete"}. Current athletic level? Top 2 strengths? Top 2 limiters? #1 thing that would most improve performance in 90 days? Sound like a pro scout. No cheerleading.`;
  if(skillId==="combineReady") return `${ctx}\n\nEvaluate combine readiness for ${athlete?.sport||"their sport"} — ${athlete?.position||"position"}. Maxes: ${maxList||"not recorded"}. Compare to D1/D2/D3 standards. Current level? What's needed for next tier? Honest timeline.`;
  if(skillId==="injuryPlan") return `${ctx}\n\nModified training plan working AROUND: ${athlete?.injuries||extra||"describe injury"}. DB and bands only. Maintain fitness where possible. What to avoid, what to modify, what can improve during recovery. Certified strength coach level.`;
  if(skillId==="instaAthlete") return `${ctx}\n\nInstagram athlete spotlight. Don't use last name. Sport: ${athlete?.sport}. Reference their grind and improvement. Coach T perspective. Under 8 sentences. End with: #EliteSkillzLab #D1Training #DFWAthletes + 2 sport-specific hashtags.`;
  if(skillId==="instaPR") return `${ctx}\n\nInstagram PR celebration post. New personal record. Hype the achievement, talk about work behind it, inspire others. Fire energy. Under 6 sentences. 5 hashtags.`;
  if(skillId==="programPromo") return `${ctx}\n\nInstagram promo for Elite Skillz Lab 🧪 at D1 Training Hulen Fort Worth. Pitch to DFW parents and athletes. D1 facility, Coach T expertise, real results, limited spots. CTA included. Under 8 sentences. 5 hashtags.`;
  if(skillId==="motivational") return `${ctx}\n\nFire motivational post from Coach T. Theme: ${extra||"elite mindset, outwork everyone"}. Short, powerful, real coach voice. Not generic. Under 5 sentences. 4 hashtags.`;
  if(skillId==="d1Brand") return `${ctx}\n\nPremium brand content for Elite Skillz Lab 🧪. Position as premier DFW athlete development program. Show what makes it elite. Professional and aspirational.`;
  if(skillId==="packageRec") return `${ctx}\n\nBest training package for ${athlete?.name||"this athlete"}. Goals: ${athlete?.goal||"development"}. Current: ${athlete?.freq||2}x/week. Coach T charges $25/hr. Specific package recommendation with rationale and expected outcomes.`;
  if(skillId==="upsell") return `${ctx}\n\nUpsell text to ${athlete?.parentName||"the parent/athlete"} pitching more sessions or larger package. Frame around athletic development, not money. Show what's possible. Confident, not pushy. Under 4 sentences.`;
  if(skillId==="referralAsk") return `${ctx}\n\nReferral request text to ${athlete?.parentName||"the parent/athlete"}. Natural and easy. Reference positive experience. Mention limited spots. Under 3 sentences.`;
  if(skillId==="d1Pitch") return `${ctx}\n\nPitch to get ${athlete?.name?.split(" ")[0]||"this athlete"} into D1 group classes (Tue/Wed 5:45-7:45 PM). Competitive environment that will accelerate development. Reference other athletes training there. Under 4 sentences.`;
  if(skillId==="weeklyGoal") return `Coach T business brain — Elite Skillz Lab 🧪. Goal: $800/week. Earns $25/hr + 10% commission.\nRoster: ${[].length} athletes total. Give a specific revenue action plan for THIS week. What sessions are locked? What renewals needed? Gap to $800? #1 money move today?`;
  if(skillId==="weekPlan") return `${ctx}\n\nWeekly training priority plan. D1 locked Tue/Wed 5:45-7:45 PM. Consider: urgent renewals, development needs, upcoming seasons, recovery. Daily priority list Mon-Fri. COO-level coaching plan.`;
  if(skillId==="athletePlan") return `${ctx}\n\n6-MONTH DEVELOPMENT ROADMAP for ${athlete?.name||"this athlete"}. Goal: ${athlete?.goal||"college-level athlete"}. Monthly milestones, key benchmarks, training phase progression. Success at 3 months and 6 months. Present-quality document.`;
  if(skillId==="d1Positioning") return `${ctx}\n\nWhat does ${athlete?.name||"this athlete"} need to reach D1 for ${athlete?.position||"their position"} in ${athlete?.sport||"their sport"}? Maxes: ${maxList||"not recorded"}. 3 biggest gaps. Minimum performance thresholds. Realistic timeline. Brutal honesty.`;
  if(skillId==="offseasonPlan") return `${ctx}\n\nOFFSEASON TRAINING PLAN for school break. Weekly schedule, training blocks, benchmarks, performance goal by end of offseason. Aggressive but sustainable.`;
  if(skillId==="coachingTip") return `${ctx}\n\nSpecific advanced coaching tip or drill for ${athlete?.sport||"general athletics"} — ${athlete?.position||"athlete"}. Addresses goal: ${athlete?.goal||"athletic development"}. Drill name, setup, reps, coaching cue, athletic quality developed. Something Coach T can run tomorrow.`;
  return `${ctx}\n\n${skillId}: ${extra}`;
}

export default function CoachAgentPage() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [sel, setSel] = useState<any>(null);
  const [cat, setCat] = useState("training");
  const [skillId, setSkillId] = useState<string|null>(null);
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAthletes(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load athletes:", e);
    }
  }, []);

  async function generate() {
    if (!sel || !skillId) return;
    setLoading(true); setResult(""); setError("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt(sel, skillId, extra) }),
      });
      const data = await res.json();
      if (data.error) setError(data.message || data.error);
      else setResult(data.text);
    } catch { setError("Network error. Check connection."); }
    setLoading(false);
  }

  function copy() { navigator.clipboard?.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  function reset() { setSkillId(null); setResult(""); setError(""); setExtra(""); }
  function resetAthlete() { setSel(null); reset(); }

  const catColor = CATEGORIES.find(c => c.id === cat)?.color || "#1a6eff";
  const catSkills = ALL_SKILLS[cat] || [];
  const currentSkill = catSkills.find(s => s.id === skillId);
  const urgent = athletes.filter(a => a.status === "urgent");
  const shown = athletes.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()));

  const inp: any = { width:"100%", padding:"10px 12px", background:"#111", border:"1px solid #333", borderRadius:10, color:"#fff", fontFamily:"system-ui", fontSize:14, outline:"none", boxSizing:"border-box" };

  // ── NOT MOUNTED YET ──
  if (!mounted) return (
    <main style={{ minHeight:"100vh", background:"#000", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚡</div>
        <div style={{ fontSize:14, color:"rgba(255,255,255,0.4)" }}>Loading...</div>
      </div>
    </main>
  );

  // ── STEP 1: SELECT ATHLETE ──
  if (!sel) return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
          <Link href="/coach/dashboard" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"none", fontSize:20 }}>←</Link>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:900 }}>AI AGENT ⚡</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Elite Skillz Lab 🧪 · {athletes.length} athletes · {Object.values(ALL_SKILLS).flat().length} skills</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:10 }}>
          {CATEGORIES.map(c => (
            <div key={c.id} style={{ fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:100, background:`${c.color}15`, border:`1px solid ${c.color}33`, color:c.color, whiteSpace:"nowrap" }}>{c.label}</div>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search athlete..." style={inp} />
      </div>

      <div style={{ padding:"14px 16px" }}>
        {athletes.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ fontSize:40, marginBottom:16 }}>🏃</div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>No athletes found</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:20 }}>Visit the Roster page first to load your athletes, then come back here.</div>
            <Link href="/coach/roster" style={{ textDecoration:"none" }}>
              <div style={{ background:"#1a6eff", borderRadius:12, padding:"14px 24px", fontSize:14, fontWeight:700, color:"#fff", display:"inline-block" }}>Go to Roster →</div>
            </Link>
          </div>
        ) : (
          <>
            {urgent.length > 0 && (
              <div style={{ background:"rgba(255,68,68,0.06)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:14, padding:"14px", marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:"#ff4444", marginBottom:10 }}>🔥 URGENT — RENEW NOW</div>
                {urgent.map((a:any) => (
                  <div key={a.id} onClick={() => setSel(a)} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,68,68,0.1)", cursor:"pointer" }}>
                    <div><div style={{ fontSize:14, fontWeight:700 }}>{a.name}</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{a.sport} · {a.sessions} sessions left</div></div>
                    <div style={{ fontSize:11, color:"#ff4444", fontWeight:700 }}>Tap →</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:12 }}>SELECT ATHLETE</div>
            {shown.map((a:any) => {
              const c = a.status==="urgent"?"#ff4444":a.status==="inactive"?"rgba(255,255,255,0.25)":"#1a6eff";
              const hasMaxes = a.maxes && Object.values(a.maxes).some((v:any) => v);
              return (
                <div key={a.id} onClick={() => setSel(a)} style={{ background:"#111", border:"1px solid #222", borderLeft:`4px solid ${c}`, borderRadius:12, padding:"14px", marginBottom:8, cursor:"pointer" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div><div style={{ fontSize:15, fontWeight:700, marginBottom:3 }}>{a.name}</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{a.sport}{a.position?` · ${a.position}`:""} · {a.sessions} sessions · {a.freq}x/wk</div></div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                      <div style={{ fontSize:9, padding:"3px 8px", background:`${c}22`, color:c, borderRadius:4, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>{a.status}</div>
                      {hasMaxes && <div style={{ fontSize:9, color:"rgba(26,110,255,0.7)" }}>📊 maxes</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </main>
  );

  // ── STEP 2: SELECT SKILL CATEGORY & SKILL ──
  if (!skillId) return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <button onClick={resetAthlete} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Athletes</button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:700 }}>{sel.name}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{sel.sport}{sel.position?` · ${sel.position}`:""}</div>
          </div>
          <div style={{ width:70 }} />
        </div>
        {/* Athlete summary */}
        <div style={{ background:"rgba(26,110,255,0.08)", border:"1px solid rgba(26,110,255,0.2)", borderRadius:10, padding:"10px 12px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[{l:"SESSIONS",v:sel.sessions},{l:"FREQ/WK",v:`${sel.freq}x`},{l:"STATUS",v:(sel.status||"active").toUpperCase()}].map((s,i) => (
            <div key={i} style={{ textAlign:"center" }}><div style={{ fontSize:15, fontWeight:900, color:"#1a6eff" }}>{s.v}</div><div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", marginTop:1 }}>{s.l}</div></div>
          ))}
        </div>
      </div>

      <div style={{ padding:"14px 16px" }}>
        {/* Category tabs */}
        <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:14 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{ padding:"7px 14px", borderRadius:100, background:cat===c.id?c.color:"rgba(255,255,255,0.04)", border:`1px solid ${cat===c.id?c.color:"rgba(255,255,255,0.08)"}`, color:cat===c.id?"#fff":"rgba(255,255,255,0.5)", fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
              {c.label}
            </button>
          ))}
        </div>
        {/* Skills */}
        {catSkills.map(s => (
          <div key={s.id} onClick={() => setSkillId(s.id)} style={{ background:"#111", border:"1px solid #222", borderRadius:12, padding:"14px", marginBottom:8, cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:26 }}>{s.icon}</span>
            <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:700, color:catColor, marginBottom:2 }}>{s.label}</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{s.desc}</div></div>
            <span style={{ color:"rgba(255,255,255,0.2)", fontSize:18 }}>›</span>
          </div>
        ))}
      </div>
    </main>
  );

  // ── STEP 3: GENERATE ──
  return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={reset} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Skills</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:catColor }}>{currentSkill?.icon} {currentSkill?.label}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{sel.name}</div>
        </div>
      </div>

      <div style={{ padding:"16px" }}>
        {!result && !loading && (
          <div>
            <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase" as const, marginBottom:6 }}>
              SPECIFIC INSTRUCTIONS (optional)
            </label>
            <textarea value={extra} onChange={e => setExtra(e.target.value)}
              placeholder={skillId==="workout"?"e.g. Focus on explosiveness · Knee sore · Upper body only · Short on time":skillId==="renewal"?"e.g. Offer a deal · He asked about speed work":"Any specific notes..."}
              style={{ ...inp, height:70, resize:"none" as const, marginBottom:14 }} />
            <button onClick={generate} style={{ width:"100%", background:catColor, border:"none", color:"#fff", borderRadius:12, padding:"16px", fontSize:16, fontWeight:900, cursor:"pointer", letterSpacing:"0.05em" }}>
              ⚡ GENERATE
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign:"center", padding:"50px 0" }}>
            <div style={{ fontSize:44, marginBottom:16 }}>⚙️</div>
            <div style={{ fontSize:16, fontWeight:900, color:catColor, letterSpacing:"0.1em", marginBottom:8 }}>
              {skillId==="workout"?"BUILDING SESSION PLAN...":skillId==="program"?"BUILDING 4-WEEK PROGRAM...":"GENERATING..."}
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>
              {skillId==="workout"?`Creating ${sel.name.split(" ")[0]}'s workout with exact weights`:"One moment..."}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:12, padding:"16px", color:"#ff8888", fontSize:13, lineHeight:1.6 }}>
            {error}
            {(error.includes("credit")||error.includes("billing")) && (
              <div style={{ marginTop:10 }}>
                <a href="https://console.anthropic.com/settings/billing" target="_blank" style={{ color:"#1a6eff", fontWeight:700, textDecoration:"none", fontSize:12 }}>→ Add credits at console.anthropic.com</a>
              </div>
            )}
            <button onClick={() => setError("")} style={{ marginTop:12, background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:12 }}>Try Again</button>
          </div>
        )}

        {result && (
          <div>
            <div style={{ background:"#0d0d0d", border:"1px solid #222", borderRadius:14, padding:"18px", fontSize:13, lineHeight:1.85, color:"#fff", whiteSpace:"pre-wrap", marginBottom:14, fontFamily:["workout","speed","strength","program"].includes(skillId||"")?"'Courier New',monospace":"system-ui" }}>
              {result}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10, marginBottom:16 }}>
              <button onClick={() => { setResult(""); setError(""); }} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid #333", color:"rgba(255,255,255,0.4)", borderRadius:10, padding:"14px", cursor:"pointer", fontSize:13, fontWeight:700 }}>🔄 Redo</button>
              <button onClick={copy} style={{ background:copied?"#00d084":catColor, border:"none", color:copied?"#000":"#fff", borderRadius:10, padding:"14px", cursor:"pointer", fontSize:15, fontWeight:900 }}>{copied?"✓ COPIED!":"📋 COPY"}</button>
            </div>
            {/* Quick run more */}
            <div style={{ fontSize:10, letterSpacing:"0.1em", color:"rgba(255,255,255,0.25)", textTransform:"uppercase", marginBottom:8 }}>Run another</div>
            {catSkills.filter(s => s.id !== skillId).slice(0,3).map(s => (
              <div key={s.id} onClick={() => { setSkillId(s.id); setResult(""); setError(""); setExtra(""); }} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid #222", borderRadius:8, padding:"10px 14px", marginBottom:6, cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
                <span>{s.icon}</span>
                <span style={{ fontSize:13, fontWeight:700, color:catColor }}>{s.label}</span>
                <span style={{ marginLeft:"auto", color:"rgba(255,255,255,0.2)" }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

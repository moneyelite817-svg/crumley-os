"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_ATHLETES = "ct_clients";
const STORAGE_PROGRAMS = "ct_programs_v1";

const PROGRAM_TYPES = [
  { id:"single",    label:"📋 Single Session",    desc:"One complete workout today",    icon:"📋" },
  { id:"week",      label:"📅 1-Week Block",       desc:"5-day training week",           icon:"📅" },
  { id:"4week",     label:"🗓 4-Week Program",     desc:"Progressive monthly block",     icon:"🗓" },
  { id:"8week",     label:"📆 8-Week Program",     desc:"Full performance cycle",        icon:"📆" },
];

const SESSION_TYPES = [
  { id:"full",      label:"⚡ Full Performance",   desc:"Complete 60-min D1 session" },
  { id:"speed",     label:"🏃 Speed & Agility",    desc:"40yd, COD, first step, footwork" },
  { id:"strength",  label:"💪 Strength & Power",   desc:"DB compound movements, explosive" },
  { id:"mobility",  label:"🧘 Mobility & Recovery",desc:"Flexibility, activation, recovery" },
  { id:"football",  label:"🏈 Football Specific",  desc:"WR/DB routes, press coverage, tracking" },
  { id:"soccer",    label:"⚽ Soccer Speed/COD",   desc:"Ball control, field COD, explosiveness" },
  { id:"youth",     label:"👦 Youth Development",  desc:"Age-appropriate, fun, fundamentals" },
  { id:"injury",    label:"🩹 Return From Injury",  desc:"Modified, protected, progressive" },
  { id:"combine",   label:"🎯 Combine/Testing Prep",desc:"NFL/NCAA combine standards" },
  { id:"conditioning",label:"🫁 Conditioning",    desc:"Metabolic, lactate threshold, cardio" },
];

interface SavedProgram {
  id: string;
  athleteId: string;
  athleteName: string;
  programType: string;
  sessionType: string;
  content: string;
  createdAt: string;
}

function buildWorkoutPrompt(athlete: any, programType: string, sessionType: string, extra: string): string {
  const maxes = Object.entries(athlete?.maxes || {}).filter(([,v])=>v).map(([k,v])=>`${k}:${v}`).join(" | ");
  const ctx = `You are Coach T — an elite D1 performance coach at Elite Skillz Lab 🧪, D1 Training Hulen Fort Worth TX.

ATHLETE PROFILE:
Name: ${athlete?.name || "Athlete"}
Sport: ${athlete?.sport || "General Athletics"}
Position: ${athlete?.position || "N/A"}
Age: ${athlete?.age || "Unknown"}
Weight: ${athlete?.weight ? athlete.weight + " lbs" : "Unknown"}
Goal: ${athlete?.goal || "D1-level athletic development"}
Injuries/Limitations: ${athlete?.injuries || "None"}
Training Frequency: ${athlete?.freq || 2}x per week
Sessions Remaining: ${athlete?.sessions || "Active"}
Recorded Maxes/PRs: ${maxes || "Not yet recorded"}
Notes: ${athlete?.notes || "None"}
${extra ? `Coach's Note: ${extra}` : ""}

EQUIPMENT: Dumbbells and resistance bands ONLY. No barbells, no squat rack, no machines.
FACILITY: D1 Training Hulen Fort Worth`;

  const workoutFormat = `
For each exercise include:
- Exercise name
- Sets × Reps @ specific weight (calculate from maxes if available, never say "appropriate weight")
- Rest period
- 1 coaching cue
- Progression option (make it harder)
- Regression option (make it easier)

Add at the top:
- Total time estimate
- Equipment needed (specific DB weights and band resistances)
- Safety notes for this athlete
- Energy system focus`;

  if (sessionType === "full") return `${ctx}

Generate a COMPLETE 60-minute D1 Performance Session. Every section must be fully detailed.

${workoutFormat}

FORMAT:

━━━━━━━━━━━━━━━━━━━━━━━━━━━
${(athlete?.name || "ATHLETE").split(" ")[0].toUpperCase()} — FULL SESSION
📅 ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
⏱ 60 min | 🏋️ DB + Bands | 🎯 ${sessionType.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 SESSION OVERVIEW
• Time: 60 min
• Equipment: [List specific DBs and bands]
• Focus: [Energy system + movement quality goal]
• Safety: [Any specific notes for this athlete]

⚡ ACTIVATION & WARM-UP (8 min)
[3-4 movements, no equipment, get CNS firing]

🦵 MOBILITY BLOCK (4 min)
[Sport-specific mobility, 3-4 movements]

💥 NEURAL ACTIVATION (3 min)
[Explosive primer, 2 movements]

🏃 SPEED / AGILITY BLOCK (12 min)
[Sport-relevant movement patterns with DB/bands]

💪 STRENGTH BLOCK A — PUSH (10 min)
[2 exercises, superset, exact weights]

💪 STRENGTH BLOCK B — PULL/HINGE (10 min)
[2 exercises, superset, exact weights]

🔥 CONDITIONING BLOCK (8 min)
[Circuit, work:rest ratio, metabolic]

🧠 CORE & STABILITY (3 min)
[2-3 core movements]

🧊 COOLDOWN & RECOVERY (2 min)
[Reset nervous system, release key muscles]

━━━ 🎯 COACH T PROGRAMMING NOTES ━━━
What we developed today:
What to watch next session:
One cue this athlete must own:`;

  if (sessionType === "speed") return `${ctx}

Build a COMPLETE SPEED & AGILITY session. Heavy focus on first-step explosiveness, change of direction, and sport-specific movement patterns for ${athlete?.sport || "athletics"}.

${workoutFormat}

Include:
- Linear speed mechanics (A-march, A-skip, B-skip, acceleration runs)
- Change of direction (5-10-5, T-drill, L-drill variations with bands)
- Sport-specific footwork patterns for ${athlete?.sport || "general athletics"}
- Contrast method: heavy band resist → free acceleration
- Reaction drills if applicable

Format with same structure as full session. Time: 45-50 min.`;

  if (sessionType === "strength") return `${ctx}

Build a STRENGTH & POWER session focused on developing maximal force production and explosive power using ONLY dumbbells and resistance bands.

${maxes ? `Use these to prescribe exact loading percentages: ${maxes}` : "Prescribe specific weight ranges based on bodyweight and training age."}

${workoutFormat}

Include:
- Heavy compound DB movements (RDL, goblet squat, DB press, rows)
- Explosive power development (DB hang clean, jump series, band-resisted power)
- Posterior chain emphasis (critical for athletic performance)
- Structural balance (push/pull ratio 1:1)

Format with full sections. Time: 55-60 min.`;

  if (sessionType === "mobility") return `${ctx}

Build a MOBILITY & RECOVERY session for optimal athletic performance and injury prevention. This is active recovery — no heavy loading.

Include:
- Full-body joint mobility circuit
- Sport-specific flexibility focus for ${athlete?.sport || "athletics"}
- Neural release techniques
- Soft tissue self-care (foam rolling protocol)
- Breathing and recovery activation
- Return-to-baseline CNS regulation

Format: 40-45 min. Include hold times, breath cues, and coaching notes for each movement.`;

  if (sessionType === "football") return `${ctx}

Build a FOOTBALL PERFORMANCE session specifically for a ${athlete?.position || "football"} player. Include real football skill integration.

Include:
- Position-specific explosive movements
- Route running mechanics / defensive back footwork
- Tracking and reaction drills
- Jump training for contested catches/coverage
- Lateral explosion and hip mobility
- Hand-eye coordination finisher

All exercises with DB/bands. Time: 55 min. Format with full sections.`;

  if (sessionType === "soccer") return `${ctx}

Build a SOCCER SPEED & COD session for elite field performance.

Include:
- Linear and curvilinear speed development
- Soccer-specific change of direction (edging, cutting, spin moves)
- Field COD patterns (45°, 90°, 180° cuts)
- Explosive first step off the ball
- Ball-adjacent training concepts (without ball)
- Lactate threshold conditioning

All DB/bands. Time: 50 min. Full format with sections.`;

  if (sessionType === "youth") return `${ctx}

Build a YOUTH DEVELOPMENT session that is age-appropriate, skill-building, confidence-boosting, and FUN.

IMPORTANT: Age-appropriate loading, no maximal lifting, focus on movement quality and coordination. Safety first.

Include:
- Fun warm-up game or movement challenge
- Fundamental movement skills (jump, land, sprint, stop, cut)
- Basic strength patterns (bodyweight emphasis)
- Coordination and balance challenges
- Competitive element (race, challenge, score)
- Cool down with positive reinforcement

Time: 45 min. Keep energy HIGH and instructions SIMPLE.`;

  if (sessionType === "injury") return `${ctx}

Build a RETURN-FROM-INJURY modified session working AROUND: ${athlete?.injuries || "current injury/limitation"}.

CRITICAL RULES:
- Protect the injured area completely
- Maintain fitness and strength everywhere else
- Build tissue capacity gradually
- No pain — work around, not through
- Include what IMPROVES during recovery

${workoutFormat}

Include:
- Modified warm-up that avoids the injury
- Alternative exercises for each body region that avoid stress on injury site
- What to watch for (pain signals, compensation patterns)
- 2-week progression plan
- When to progress each exercise

Time: 50 min. Safety notes for EVERY exercise.`;

  if (sessionType === "combine") return `${ctx}

Build a COMBINE PREP session targeting NFL/NCAA combine testing standards.

Maxes on file: ${maxes || "not recorded — assess during session"}

Include:
- 40-yard dash technique drills (start, acceleration, max velocity)
- Vertical jump and broad jump training
- Pro agility (5-10-5) and 3-cone drill
- 225 bench rep test simulation (modified for DB)
- Position-specific drills
- Testing strategy and mental preparation

Compare athlete's current numbers to D1/D2/D3 standards. Give specific gaps and timeline to close them. Time: 50 min.`;

  if (sessionType === "conditioning") return `${ctx}

Build a HIGH-INTENSITY CONDITIONING session for sport-specific energy system development.

Include:
- Alactic (0-10s power), Lactic (10-60s), and Aerobic (60s+) work
- Work:rest ratios matched to ${athlete?.sport || "the sport's"} demands
- Metabolic circuit with DB/bands
- Sport-specific conditioning patterns
- Heart rate zone targets
- Mental toughness component

Time: 40-50 min. Format with all sections. Include expected heart rate zones and recovery times.`;

  // 4-week program
  if (programType === "4week") return `${ctx}

Design a complete 4-WEEK TRAINING PROGRAM for ${athlete?.name || "this athlete"}.

PROGRAM GOAL: ${athlete?.goal || "Comprehensive athletic development"}

WEEK STRUCTURE:
Week 1 — Foundation: establish movement patterns, baseline loading, assess technique
Week 2 — Volume: increase training volume, more sets, same relative intensity
Week 3 — Intensity: reduce volume, increase load/difficulty, peak performance
Week 4 — Peak & Test: deload + test PRs, evaluate 4-week gains

For each week provide:
- Training focus and theme
- Key lifts/movements with loading scheme
- Speed/agility emphasis
- Conditioning protocol
- Expected adaptations

For each session type (Mon/Wed/Fri split recommended):
- Full exercise list with sets, reps, weights
- Session duration
- Key coaching cues

End with:
- Benchmark tests at end of Week 4
- Expected performance improvements
- How to progress into the next 4-week block`;

  if (programType === "8week") return `${ctx}

Design a complete 8-WEEK PERFORMANCE PROGRAM for ${athlete?.name || "this athlete"} targeting: ${athlete?.goal || "athletic excellence"}.

PERIODIZATION MODEL:
Weeks 1-2: Anatomical Adaptation (higher reps, lower intensity, establish base)
Weeks 3-4: Hypertrophy/Volume (8-12 reps, accumulate volume)
Weeks 5-6: Strength (4-6 reps, higher intensity, neural drive)
Weeks 7-8: Power & Peak (explosive work, test PRs, sport-specific)

Provide:
- Week-by-week theme and primary focus
- Loading percentages for each phase
- How to progress each week
- Key performance indicators per phase
- Benchmark testing protocol at weeks 4 and 8
- Expected performance gains at end of 8 weeks

Include sample workouts for each phase. All DB and bands only.`;

  if (programType === "week") return `${ctx}

Design a complete 1-WEEK TRAINING BLOCK (5 days, Mon-Fri) for ${athlete?.name || "this athlete"}.

Daily structure:
Monday: Speed + Lower Body
Tuesday: Upper Body Push + Conditioning  
Wednesday: Active Recovery / Mobility (or rest)
Thursday: Full Body Strength
Friday: Sport-Specific + COD

For each day:
- Complete exercise list with sets/reps/weights
- Total time
- Primary training focus
- Key coaching cue of the day
- Energy level required (High/Medium/Low)

End with weekly volume summary and what to progress week 2.`;

  return `${ctx}\n\nGenerate: ${programType} — ${sessionType}. ${extra}`;
}

export default function ProgramPage() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [programs, setPrograms] = useState<SavedProgram[]>([]);
  const [step, setStep] = useState<"select_athlete"|"select_type"|"generate"|"result"|"saved">("select_athlete");
  const [selAthlete, setSelAthlete] = useState<any>(null);
  const [programType, setProgramType] = useState("single");
  const [sessionType, setSessionType] = useState("full");
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [viewTab, setViewTab] = useState<"build"|"library">("build");

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_ATHLETES); if(s) setAthletes(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem(STORAGE_PROGRAMS); if(s) setPrograms(JSON.parse(s)); } catch {}
  }, []);

  function persistPrograms(data: SavedProgram[]) {
    setPrograms(data);
    try { localStorage.setItem(STORAGE_PROGRAMS, JSON.stringify(data)); } catch {}
  }

  async function generate() {
    setLoading(true); setResult(""); setError("");
    try {
      const prompt = buildWorkoutPrompt(selAthlete, programType, sessionType, extra);
      const res = await fetch("/api/ai", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ prompt }) });
      const data = await res.json();
      if(data.error) setError(data.message || data.error);
      else { setResult(data.text); setStep("result"); }
    } catch { setError("Network error. Check connection."); }
    setLoading(false);
  }

  function saveProgram() {
    const prog: SavedProgram = {
      id: Date.now().toString(),
      athleteId: selAthlete?.id?.toString() || "",
      athleteName: selAthlete?.name || "Unknown",
      programType,
      sessionType,
      content: result,
      createdAt: new Date().toISOString(),
    };
    persistPrograms([prog, ...programs]);
    setSaved(true);
  }

  function copy() { navigator.clipboard?.writeText(result); setCopied(true); setTimeout(()=>setCopied(false),2000); }

  const shown = athletes.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()));
  const urgent = athletes.filter(a => a.status === "urgent");
  const inp2: any = { width:"100%", padding:"10px 12px", background:"#111", border:"1px solid #333", borderRadius:10, color:"#fff", fontFamily:"system-ui", fontSize:14, outline:"none", boxSizing:"border-box" };

  // ── SAVED PROGRAMS LIBRARY ──
  if (viewTab === "library") return (
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <Link href="/coach/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
          <div style={{flex:1}}><div style={{fontSize:16,fontWeight:800}}>PROGRAM LIBRARY</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{programs.length} saved programs</div></div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {["build","library"].map(t=>(
            <button key={t} onClick={()=>setViewTab(t as any)} style={{flex:1,padding:"8px",borderRadius:10,background:viewTab===t?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${viewTab===t?"#1a6eff":"#333"}`,color:viewTab===t?"#fff":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,fontWeight:700,textTransform:"capitalize" as const}}>
              {t==="build"?"⚡ Build":"📚 Library"}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {programs.length===0&&<div style={{textAlign:"center",padding:"50px 0",color:"rgba(255,255,255,0.3)",fontSize:13}}>No saved programs yet.<br/>Generate one and save it here.</div>}
        {programs.map(p=>(
          <div key={p.id} style={{background:"#111",border:"1px solid #222",borderRadius:12,padding:"14px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div><div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{p.athleteName}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{SESSION_TYPES.find(s=>s.id===p.sessionType)?.label||p.sessionType} · {PROGRAM_TYPES.find(t=>t.id===p.programType)?.label||p.programType}</div></div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>{new Date(p.createdAt).toLocaleDateString()}</div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={()=>{setResult(p.content);setSelAthlete(athletes.find(a=>a.id?.toString()===p.athleteId)||{name:p.athleteName});setProgramType(p.programType);setSessionType(p.sessionType);setStep("result");setViewTab("build");}} style={{flex:1,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:700}}>👁 View</button>
              <button onClick={()=>{navigator.clipboard?.writeText(p.content);}} style={{flex:1,background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.2)",color:"#00d084",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:700}}>📋 Copy</button>
              <button onClick={()=>{if(!confirm("Delete?"))return;persistPrograms(programs.filter(x=>x.id!==p.id));}} style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12}}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );

  // ── BUILD VIEW ──
  return (
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <Link href="/coach/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800}}>PROGRAMMING AGENT ⚡</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Elite Skillz Lab 🧪 · {athletes.length} athletes · {PROGRAM_TYPES.length} program types · {SESSION_TYPES.length} session types</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {["build","library"].map(t=>(
            <button key={t} onClick={()=>setViewTab(t as any)} style={{flex:1,padding:"8px",borderRadius:10,background:viewTab===t?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${viewTab===t?"#1a6eff":"#333"}`,color:viewTab===t?"#fff":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,fontWeight:700}}>
              {t==="build"?"⚡ Build New":`📚 Library (${programs.length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"16px"}}>

        {/* STEP 1: SELECT ATHLETE */}
        {step === "select_athlete" && (
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:14}}>STEP 1 — SELECT ATHLETE</div>

            {urgent.length > 0 && (
              <div style={{background:"rgba(255,68,68,0.06)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:14,padding:"14px",marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:"#ff4444",marginBottom:10}}>🔥 URGENT — NEED PROGRAMS</div>
                {urgent.map(a=>(
                  <div key={a.id} onClick={()=>{setSelAthlete(a);setStep("select_type");}} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,68,68,0.1)",cursor:"pointer"}}>
                    <div><div style={{fontSize:14,fontWeight:700}}>{a.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{a.sport} · {a.sessions} sessions left</div></div>
                    <div style={{fontSize:11,color:"#ff4444",fontWeight:700}}>Build plan →</div>
                  </div>
                ))}
              </div>
            )}

            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search athlete..." style={{...inp2,marginBottom:14}}/>
            {athletes.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.3)",fontSize:13}}>No athletes.<br/><Link href="/coach/roster" style={{color:"#1a6eff",textDecoration:"none"}}>Go to Roster →</Link></div>}
            {shown.map(a=>{
              const SC: Record<string,string> = {urgent:"#ff4444",inactive:"rgba(255,255,255,0.25)",active:"#1a6eff"};
              const c=SC[a.status]||"#1a6eff";
              const hasMaxes=a.maxes&&Object.values(a.maxes).some((v:any)=>v);
              return(
                <div key={a.id} onClick={()=>{setSelAthlete(a);setStep("select_type");}} style={{background:"#111",border:"1px solid #222",borderLeft:`4px solid ${c}`,borderRadius:12,padding:"14px",marginBottom:8,cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{a.name}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{a.sport}{a.position?` · ${a.position}`:""} · {a.sessions} sessions</div></div>
                    <div style={{display:"flex",flexDirection:"column" as const,alignItems:"flex-end",gap:3}}>
                      <div style={{fontSize:9,padding:"3px 8px",background:`${c}22`,color:c,borderRadius:4,fontWeight:700,textTransform:"uppercase" as const}}>{a.status}</div>
                      {hasMaxes&&<div style={{fontSize:9,color:"rgba(26,110,255,0.7)"}}>📊 maxes</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 2: SELECT PROGRAM TYPE */}
        {step === "select_type" && selAthlete && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <button onClick={()=>setStep("select_athlete")} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Back</button>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{selAthlete.name}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{selAthlete.sport} · {selAthlete.sessions} sessions</div>
              </div>
            </div>

            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:12}}>STEP 2 — PROGRAM TYPE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
              {PROGRAM_TYPES.map(pt=>(
                <div key={pt.id} onClick={()=>setProgramType(pt.id)} style={{background:programType===pt.id?"rgba(26,110,255,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${programType===pt.id?"rgba(26,110,255,0.4)":"#222"}`,borderRadius:12,padding:"14px 10px",cursor:"pointer",textAlign:"center" as const}}>
                  <div style={{fontSize:24,marginBottom:6}}>{pt.icon}</div>
                  <div style={{fontSize:12,fontWeight:700,color:programType===pt.id?"#1a6eff":"rgba(255,255,255,0.7)",marginBottom:2}}>{pt.label.split(" ").slice(1).join(" ")}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{pt.desc}</div>
                </div>
              ))}
            </div>

            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:12}}>STEP 3 — SESSION TYPE</div>
            {SESSION_TYPES.map(st=>(
              <div key={st.id} onClick={()=>setSessionType(st.id)} style={{background:sessionType===st.id?"rgba(26,110,255,0.12)":"rgba(255,255,255,0.02)",border:`1px solid ${sessionType===st.id?"rgba(26,110,255,0.4)":"#222"}`,borderRadius:12,padding:"13px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:20}}>{st.label.split(" ")[0]}</span>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:sessionType===st.id?"#1a6eff":"#fff",marginBottom:2}}>{st.label.split(" ").slice(1).join(" ")}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{st.desc}</div></div>
                {sessionType===st.id&&<span style={{color:"#1a6eff",fontWeight:700}}>✓</span>}
              </div>
            ))}

            <div style={{marginTop:14}}>
              <label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:6}}>COACH'S NOTE (optional)</label>
              <textarea value={extra} onChange={e=>setExtra(e.target.value)} placeholder="e.g. Knee sore today · Focus on explosiveness · First session back from break · Prepare for Friday game" style={{...inp2,height:65,resize:"none" as const,marginBottom:16}}/>
            </div>

            <button onClick={()=>{setStep("generate");generate();}} style={{width:"100%",background:"linear-gradient(135deg,#1a6eff,#0d4fd4)",border:"none",color:"#fff",borderRadius:14,padding:"18px",fontSize:17,fontWeight:900,cursor:"pointer",letterSpacing:"0.05em"}}>
              ⚡ GENERATE PROGRAM
            </button>
          </div>
        )}

        {/* GENERATING */}
        {step === "generate" && (
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:48,marginBottom:16}}>⚙️</div>
            <div style={{fontSize:17,fontWeight:900,color:"#1a6eff",letterSpacing:"0.1em",marginBottom:8}}>
              {programType==="4week"?"BUILDING 4-WEEK PROGRAM...":programType==="8week"?"BUILDING 8-WEEK CYCLE...":programType==="week"?"BUILDING WEEKLY BLOCK...":"BUILDING SESSION PLAN..."}
            </div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:4}}>
              {selAthlete?.name} · {SESSION_TYPES.find(s=>s.id===sessionType)?.label}
            </div>
            {loading && <div style={{fontSize:12,color:"rgba(255,255,255,0.25)",marginTop:8}}>Generating elite programming with exact weights and cues...</div>}
            {error && <div style={{marginTop:20,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:12,padding:"16px",color:"#ff8888",fontSize:13}}>{error}<br/><button onClick={()=>setStep("select_type")} style={{marginTop:12,background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:12}}>← Back</button></div>}
          </div>
        )}

        {/* RESULT */}
        {step === "result" && result && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <button onClick={()=>{setStep("select_type");setResult("");setSaved(false);}} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← New</button>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a6eff"}}>{selAthlete?.name} · {SESSION_TYPES.find(s=>s.id===sessionType)?.label}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{PROGRAM_TYPES.find(t=>t.id===programType)?.label}</div>
              </div>
            </div>

            <div style={{background:"#0d0d0d",border:"1px solid #222",borderRadius:14,padding:"18px",fontSize:13,lineHeight:1.9,color:"#fff",whiteSpace:"pre-wrap",marginBottom:14,fontFamily:"'Courier New',monospace",maxHeight:"60vh",overflowY:"auto"}}>
              {result}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <button onClick={copy} style={{background:copied?"#00d084":"#1a6eff",border:"none",color:copied?"#000":"#fff",borderRadius:12,padding:"16px",cursor:"pointer",fontSize:15,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
              <button onClick={saveProgram} style={{background:saved?"rgba(0,208,132,0.15)":"rgba(255,255,255,0.05)",border:`1px solid ${saved?"rgba(0,208,132,0.3)":"#333"}`,color:saved?"#00d084":"rgba(255,255,255,0.4)",borderRadius:12,padding:"16px",cursor:"pointer",fontSize:14,fontWeight:700}}>
                {saved?"✓ SAVED":"💾 Save"}
              </button>
            </div>

            {/* Quick rebuild options */}
            <div style={{fontSize:10,letterSpacing:"0.1em",color:"rgba(255,255,255,0.25)",textTransform:"uppercase" as const,marginBottom:10}}>Build another session type</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {SESSION_TYPES.filter(s=>s.id!==sessionType).slice(0,4).map(s=>(
                <div key={s.id} onClick={()=>{setSessionType(s.id);setStep("select_type");setResult("");setSaved(false);}} style={{background:"rgba(255,255,255,0.03)",border:"1px solid #222",borderRadius:8,padding:"10px",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16}}>{s.label.split(" ")[0]}</span>
                  <span style={{fontSize:11,fontWeight:700,color:"#1a6eff"}}>{s.label.split(" ").slice(1).join(" ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const S_ATHLETES = "ct_clients";
const S_PROGRAMS  = "ct_programs_v1";
const S_COMPLETIONS = "ct_workout_completions";

const SESSION_TYPES = [
  {id:"full",icon:"⚡",label:"Full Performance",color:"#1a6eff"},
  {id:"speed",icon:"🏃",label:"Speed & Agility",color:"#00d084"},
  {id:"strength",icon:"💪",label:"Strength Block",color:"#f0c040"},
  {id:"conditioning",icon:"🫁",label:"Conditioning",color:"#e74c3c"},
  {id:"mobility",icon:"🧘",label:"Mobility",color:"#9b59b6"},
  {id:"football",icon:"🏈",label:"Football",color:"#f39c12"},
  {id:"soccer",icon:"⚽",label:"Soccer",color:"#00d084"},
  {id:"youth",icon:"👦",label:"Youth",color:"#1a6eff"},
  {id:"injury",icon:"🩹",label:"Return From Injury",color:"#e74c3c"},
  {id:"combine",icon:"🎯",label:"Combine Prep",color:"#f0c040"},
];

const PROGRAM_TYPES = [
  {id:"single",icon:"📋",label:"Single Session"},
  {id:"week",icon:"📅",label:"1-Week Block"},
  {id:"4week",icon:"🗓",label:"4-Week Program"},
  {id:"8week",icon:"📆",label:"8-Week Cycle"},
];

interface WorkoutSection { title: string; emoji: string; time: string; color: string; lines: string[]; }
interface SavedProgram { id:string;athleteId:string;athleteName:string;programType:string;sessionType:string;content:string;createdAt:string; }
interface Completion { id:string;athleteId:number;athleteName:string;workoutType:string;programType:string;completedAt:string;effort:number;readiness:number;soreness:number;coachNotes:string;skippedExercises:string;sessionId:string;sessionsDeducted:boolean; }

// ── PARSE workout text into section cards ──
function parseWorkout(text: string): WorkoutSection[] {
  if (!text) return [];
  const SECTION_MAP: Record<string, {color:string;emoji:string}> = {
    "ACTIVATION": {color:"#f39c12",emoji:"⚡"},
    "WARM":       {color:"#f39c12",emoji:"🔥"},
    "MOBILITY":   {color:"#9b59b6",emoji:"🧘"},
    "NEURAL":     {color:"#e74c3c",emoji:"💥"},
    "POWER":      {color:"#e74c3c",emoji:"💥"},
    "SPEED":      {color:"#00d084",emoji:"🏃"},
    "AGILITY":    {color:"#00d084",emoji:"🏃"},
    "STRENGTH A": {color:"#1a6eff",emoji:"💪"},
    "STRENGTH B": {color:"#1a6eff",emoji:"💪"},
    "STRENGTH":   {color:"#1a6eff",emoji:"💪"},
    "CONDITIONING":{color:"#e74c3c",emoji:"🔥"},
    "CORE":       {color:"#f0c040",emoji:"🧠"},
    "COOLDOWN":   {color:"#9b59b6",emoji:"🧊"},
    "RECOVERY":   {color:"#9b59b6",emoji:"🧊"},
    "OVERVIEW":   {color:"rgba(255,255,255,0.4)",emoji:"📋"},
    "SESSION":    {color:"#1a6eff",emoji:"📋"},
    "COACH":      {color:"#f0c040",emoji:"🎯"},
    "NEXT":       {color:"#00d084",emoji:"📅"},
  };

  const sections: WorkoutSection[] = [];
  const lines = text.split("\n");
  let current: WorkoutSection | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Detect section headers: ━━━ TITLE (time) ━━━  or  **TITLE**
    const headerMatch = line.match(/━+\s*(.+?)\s*━+/) || line.match(/\*\*([^*]+)\*\*/);
    if (headerMatch) {
      if (current) sections.push(current);
      const title = headerMatch[1].replace(/[*_]/g,"").trim();
      const timeMatch = title.match(/\((\d+\s*min)\)/i);
      const time = timeMatch ? timeMatch[1] : "";
      const cleanTitle = title.replace(/\(.*?\)/g,"").trim();
      // Find color
      let color = "#1a6eff", emoji = "📌";
      for (const [key, val] of Object.entries(SECTION_MAP)) {
        if (cleanTitle.toUpperCase().includes(key)) { color = val.color; emoji = val.emoji; break; }
      }
      current = { title: cleanTitle, emoji, time, color, lines: [] };
      continue;
    }

    if (current) {
      // Skip separator lines
      if (line.match(/^[━─=\-]{3,}$/)) continue;
      current.lines.push(line);
    } else {
      // Pre-section content (session overview)
      if (!sections.find(s => s.title === "SESSION OVERVIEW")) {
        current = { title:"SESSION OVERVIEW", emoji:"📋", time:"", color:"rgba(255,255,255,0.4)", lines:[] };
      }
      if (current) current.lines.push(line);
    }
  }
  if (current && current.lines.length > 0) sections.push(current);
  return sections;
}

// ── Render a single line item inside a section ──
function ExerciseLine({ line }: { line: string }) {
  // Detect exercise lines: start with number, letter+dot, A1/B2 etc
  const isExercise = /^[A-Z]?\d+[\.\):]|^\d+[\.\):]|^[A-Z]\d[\.\):]/.test(line);
  // Extract exercise name (before first —  or @)
  const parts = line.split(/\s+[@—–]\s+/);
  const name = parts[0].replace(/^[A-Z]?\d+[\.\):]\s*/, "").trim();
  const details = parts.slice(1).join(" | ");

  if (isExercise && name) return (
    <div style={{ marginBottom:14, paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:4, lineHeight:1.3 }}>{name}</div>
      {details && (
        <div style={{ display:"flex", flexWrap:"wrap" as const, gap:6 }}>
          {details.split("|").map((d,i) => {
            const t = d.trim();
            if (!t) return null;
            const isWeight = /\d+\s*(lb|lbs|kg)/i.test(t);
            const isRest = /rest/i.test(t);
            const isCue = t.length > 30;
            return (
              <span key={i} style={{
                fontSize:12, padding:"3px 10px", borderRadius:100,
                background: isWeight?"rgba(26,110,255,0.2)":isRest?"rgba(240,192,64,0.15)":isCue?"rgba(0,208,132,0.12)":"rgba(255,255,255,0.08)",
                color: isWeight?"#6699ff":isRest?"#f0c040":isCue?"#00d084":"rgba(255,255,255,0.7)",
                fontWeight: isWeight||isRest?700:400,
              }}>{t}</span>
            );
          })}
        </div>
      )}
    </div>
  );

  // Non-exercise lines
  const isBullet = line.startsWith("•") || line.startsWith("-");
  const isBold = line.startsWith("**") || line.includes(":");
  return (
    <div style={{ fontSize:13, color:"rgba(255,255,255,0.65)", lineHeight:1.7, marginBottom:4, paddingLeft: isBullet?8:0 }}>
      {isBullet ? "• " : ""}{line.replace(/^[•\-]\s*/,"").replace(/\*\*/g,"")}
    </div>
  );
}

// ── MARK COMPLETE SHEET ──
function MarkCompleteSheet({
  athletes, workout, sessionType, programType, athleteId,
  onSave, onClose
}: {
  athletes:any[]; workout:string; sessionType:string; programType:string; athleteId?:number;
  onSave:(data:Completion)=>void; onClose:()=>void;
}) {
  const [selAthlete, setSelAthlete] = useState<any>(athleteId?athletes.find(a=>a.id===athleteId)||null:null);
  const [effort, setEffort] = useState(7);
  const [readiness, setReadiness] = useState(7);
  const [soreness, setSoreness] = useState(3);
  const [notes, setNotes] = useState("");
  const [skipped, setSkipped] = useState("");
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"select"|"rate">(athleteId?"rate":"select");

  const shown = athletes.filter(a=>a.name.toLowerCase().includes(search.toLowerCase()));

  function save() {
    if (!selAthlete) return;
    const comp: Completion = {
      id:`wc-${Date.now()}`, athleteId:selAthlete.id, athleteName:selAthlete.name,
      workoutType:sessionType, programType, completedAt:new Date().toISOString(),
      effort, readiness, soreness, coachNotes:notes, skippedExercises:skipped,
      sessionId:"", sessionsDeducted:false,
    };
    onSave(comp);
  }

  const inp2:any={width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:13,outline:"none",boxSizing:"border-box"};

  return (
    <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)"}}/>
      <div style={{position:"relative",background:"#0a0a14",borderRadius:"20px 20px 0 0",border:"1px solid rgba(0,208,132,0.3)",padding:"20px 16px 50px",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:16,fontWeight:900,color:"#00d084"}}>✓ MARK COMPLETE</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>
              {SESSION_TYPES.find(s=>s.id===sessionType)?.label} · {PROGRAM_TYPES.find(p=>p.id===programType)?.label}
            </div>
          </div>
          <button onClick={()=>{if(step==="rate"&&!athleteId)setStep("select");else onClose();}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13}}>
            {step==="rate"&&!athleteId?"← Back":"✕"}
          </button>
        </div>

        {step==="select" && (
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:12}}>SELECT ATHLETE</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...inp2,marginBottom:12}}/>
            {shown.map(a=>{
              const c=a.status==="urgent"?"#ff4444":a.status==="inactive"?"rgba(255,255,255,0.3)":"#1a6eff";
              return(
                <div key={a.id} onClick={()=>{setSelAthlete(a);setStep("rate");}} style={{background:"rgba(255,255,255,0.03)",border:"1px solid #222",borderLeft:`4px solid ${c}`,borderRadius:10,padding:"12px",marginBottom:8,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:14,fontWeight:700}}>{a.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{a.sport} · {a.sessions} sessions left</div></div>
                  <span style={{color:"rgba(255,255,255,0.3)"}}>›</span>
                </div>
              );
            })}
          </div>
        )}

        {step==="rate" && selAthlete && (
          <div>
            {/* Athlete info */}
            <div style={{background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.2)",borderRadius:12,padding:"12px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:15,fontWeight:700}}>{selAthlete.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{selAthlete.sport} · {selAthlete.sessions} sessions remaining</div></div>
              {selAthlete.sessions<=3&&<div style={{fontSize:11,color:"#ff4444",fontWeight:700}}>⚠️ Low</div>}
            </div>

            {/* Ratings */}
            {[
              {l:"EFFORT",v:effort,set:setEffort,c:"#1a6eff",desc:["Rest","Easy","Moderate","Moderate","Hard","Hard","Very Hard","Very Hard","Max","Max"]},
              {l:"READINESS",v:readiness,set:setReadiness,c:"#00d084",desc:["Dead","Very Low","Low","Low","Okay","Okay","Good","Good","Great","Peak"]},
              {l:"SORENESS",v:soreness,set:setSoreness,c:"#f0c040",desc:["None","Minimal","Light","Light","Moderate","Moderate","Heavy","Heavy","Very Sore","Wrecked"]},
            ].map(r=>(
              <div key={r.l} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)"}}>{r.l}</div>
                  <div style={{fontSize:14,fontWeight:900,color:r.c}}>{r.v}/10 — {r.desc[r.v-1]}</div>
                </div>
                <div style={{display:"flex",gap:4}}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                    <div key={n} onClick={()=>r.set(n)} style={{flex:1,height:36,borderRadius:6,background:r.v>=n?r.c:"rgba(255,255,255,0.08)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:r.v>=n?"#fff":"rgba(255,255,255,0.3)",border:`1px solid ${r.v===n?r.c:"transparent"}`}}>
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Notes */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",marginBottom:6}}>EXERCISES SKIPPED</div>
              <input value={skipped} onChange={e=>setSkipped(e.target.value)} placeholder="Any exercises skipped and why..." style={inp2}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",marginBottom:6}}>COACH NOTES</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="How did they perform? What to focus on next session?" style={{...inp2,height:75,resize:"none" as const}}/>
            </div>

            {selAthlete.sessions<=3 && (
              <div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10,padding:"10px 12px",marginBottom:12,fontSize:12,color:"#ff8888"}}>
                ⚠️ {selAthlete.name} has {selAthlete.sessions} session{selAthlete.sessions!==1?"s":""} remaining. Completing this will deduct 1 — consider sending a renewal.
              </div>
            )}

            <button onClick={save} style={{width:"100%",background:"#00d084",border:"none",color:"#000",borderRadius:12,padding:"16px",fontSize:16,fontWeight:900,cursor:"pointer",letterSpacing:"0.05em"}}>
              ✓ MARK COMPLETE & SAVE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProgramPage() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [programs, setPrograms] = useState<SavedProgram[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [step, setStep] = useState<"athlete"|"type"|"generate"|"result"|"library">("athlete");
  const [selAthlete, setSelAthlete] = useState<any>(null);
  const [programType, setProgramType] = useState("single");
  const [sessionType, setSessionType] = useState("full");
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completeSaved, setCompleteSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [sections, setSections] = useState<WorkoutSection[]>([]);

  useEffect(() => {
    try { const s=localStorage.getItem(S_ATHLETES); if(s){const p=JSON.parse(s);if(Array.isArray(p))setAthletes(p);} } catch {}
    try { const s=localStorage.getItem(S_PROGRAMS); if(s)setPrograms(JSON.parse(s)); } catch {}
    try { const s=localStorage.getItem(S_COMPLETIONS); if(s)setCompletions(JSON.parse(s)); } catch {}
    // Check if pre-selected athlete from roster
    try { const pre=localStorage.getItem("cros_program_athlete"); if(pre){const a=JSON.parse(pre);setSelAthlete(a);setStep("type");localStorage.removeItem("cros_program_athlete");} } catch {}
  }, []);

  function persistPrograms(data:SavedProgram[]){setPrograms(data);try{localStorage.setItem(S_PROGRAMS,JSON.stringify(data));}catch{}}
  function persistCompletions(data:Completion[]){setCompletions(data);try{localStorage.setItem(S_COMPLETIONS,JSON.stringify(data));}catch{}}

  async function generate() {
    setStep("generate"); setResult(""); setError("");
    setLoading(true);
    const maxes = Object.entries(selAthlete?.maxes||{}).filter(([,v])=>v).map(([k,v])=>`${k}:${v}`).join("|");
    const ctx = `Coach T — Elite Skillz Lab 🧪 | D1 Hulen FTW | DB+Bands ONLY | 60min\nATHLETE: ${selAthlete?.name} | ${selAthlete?.sport||"General"} | Age:${selAthlete?.age||"?"} | ${selAthlete?.weight||"?"}lbs\nGoal:${selAthlete?.goal||"athletic development"} | Injuries:${selAthlete?.injuries||"none"} | Sessions:${selAthlete?.sessions} | ${selAthlete?.freq||2}x/wk\nMaxes:${maxes||"use intermediate weights"} | ${extra?`Coach note: ${extra}`:""}`;

    const SESSION_PROMPTS: Record<string,string> = {
      full:`${ctx}\n\nGenerate COMPLETE 60-min D1 Performance Session. DB and bands ONLY.\n${maxes?`Calculate exact DB weights from maxes (Power=65%, Strength=78%, Cond=55%).`:"Prescribe specific weight ranges."}\nNEVER say 'appropriate weight'.\n\nFormat EXACTLY with this structure:\n\n**${(selAthlete?.name||"ATHLETE").split(" ")[0].toUpperCase()} — SESSION PLAN**\n${new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})} | 60 Min | DB + Bands\n\n━━━ ⚡ ACTIVATION (5 min) ━━━\n1. [Exercise] — [reps] — [cue]\n2. [Exercise] — [reps] — [cue]\n3. [Exercise] — [reps] — [cue]\n\n━━━ 💥 POWER BLOCK (12 min) ━━━\n1. [Exercise] — [sets]x[reps] @ [EXACT lbs] — [cue] | Rest [sec]\n2. [Exercise] — [sets]x[reps] @ [EXACT lbs] — [cue] | Rest [sec]\n\n━━━ 💪 STRENGTH BLOCK A (12 min) ━━━\nA1. [Exercise] — [sets]x[reps] @ [lbs] — [cue]\nA2. [Exercise] — [sets]x[reps] @ [lbs] — [cue]\nRest 90sec | [X] rounds\n\n━━━ 💪 STRENGTH BLOCK B (10 min) ━━━\nB1. [Exercise] — [sets]x[reps] @ [lbs] — [cue]\nB2. [Exercise] — [sets]x[reps] @ [lbs] — [cue]\nRest 60sec | [X] rounds\n\n━━━ 🔥 CONDITIONING (15 min) ━━━\n[X] rounds | [work]s on / [rest]s off\n1. [Exercise]\n2. [Exercise]\n3. [Exercise]\n4. [Exercise]\n\n━━━ 🧠 CORE (3 min) ━━━\n1. [Exercise] — [sets]x[reps]\n\n━━━ 🧊 COOLDOWN (3 min) ━━━\n1. [Stretch — hold time]\n2. [Stretch — hold time]\n\n━━━ 🎯 COACH T CUE ━━━\n[Specific coaching note for THIS athlete]\n\n━━━ 📅 NEXT SESSION ━━━\n[What to build next time]`,
      speed:`${ctx}\n\n60-min SPEED & AGILITY session. DB+bands. Linear speed, COD, footwork, contrast method, sport-specific for ${selAthlete?.sport||"athletics"}. Same format as above with ━━━ section headers.`,
      strength:`${ctx}\n\n60-min STRENGTH session. DB+bands. Push/pull/hinge/squat/carry. ${maxes?`Prescribe exact % of max: ${maxes}`:"Use RPE"} Same format with ━━━ section headers.`,
      conditioning:`${ctx}\n\n50-min CONDITIONING. DB+bands. Sport-specific energy systems. Multiple circuits with exact work:rest. Same format.`,
      mobility:`${ctx}\n\n45-min MOBILITY & RECOVERY. No heavy loading. Foam rolling, joint mob, dynamic stretch, neural release. Same format.`,
      football:`${ctx}\n\n60-min FOOTBALL session for ${selAthlete?.position||"athlete"}. Position-specific explosive work, route mechanics or coverage footwork. Same format.`,
      soccer:`${ctx}\n\n55-min SOCCER SPEED & COD. Linear, curvilinear speed, soccer-specific cuts, explosive first step. Same format.`,
      youth:`${ctx}\n\n45-min YOUTH session. Age-appropriate, fun, fundamentals, movement skills. Same format.`,
      injury:`${ctx}\n\n50-min MODIFIED session around: ${selAthlete?.injuries||extra||"injury"}. Safe modifications for every movement. Same format.`,
      combine:`${ctx}\n\n50-min COMBINE PREP. 40-yard technique, vertical, broad jump, pro agility, position drills. Compare to D1 standards. Same format.`,
    };

    try {
      const prompt = SESSION_PROMPTS[sessionType] || SESSION_PROMPTS.full;
      const res = await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});
      const data = await res.json();
      if(data.error){setError(data.message||data.error);setLoading(false);return;}
      setResult(data.text);
      setSections(parseWorkout(data.text));
      setStep("result");
    } catch { setError("Network error."); }
    setLoading(false);
  }

  function saveProgram() {
    const p: SavedProgram = { id:`p-${Date.now()}`, athleteId:selAthlete?.id?.toString()||"", athleteName:selAthlete?.name||"", programType, sessionType, content:result, createdAt:new Date().toISOString() };
    persistPrograms([p,...programs]);
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  }

  function copy(){navigator.clipboard?.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);}

  function handleComplete(comp:Completion){
    // Deduct session
    const updated=athletes.map(a=>a.id===comp.athleteId?{...a,sessions:Math.max(0,a.sessions-1)}:a);
    try{localStorage.setItem(S_ATHLETES,JSON.stringify(updated));}catch{}
    setAthletes(updated);
    if(selAthlete?.id===comp.athleteId)setSelAthlete((p:any)=>({...p,sessions:Math.max(0,(p?.sessions||1)-1)}));
    comp.sessionsDeducted=true;
    persistCompletions([comp,...completions]);
    setShowComplete(false);
    setCompleteSaved(true);
    setTimeout(()=>setCompleteSaved(false),3000);
  }

  const shown=athletes.filter(a=>a.name?.toLowerCase().includes(search.toLowerCase()));
  const inp2:any={width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box"};

  // ── LIBRARY ──
  if(step==="library") return (
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setStep("athlete")} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Build</button>
        <span style={{fontSize:15,fontWeight:800}}>📚 PROGRAM LIBRARY</span>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{programs.length} saved</div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {programs.length===0&&<div style={{textAlign:"center",padding:"50px 0",color:"rgba(255,255,255,0.25)",fontSize:13}}>No saved programs yet.</div>}
        {programs.map(p=>(
          <div key={p.id} style={{background:"#111",border:"1px solid #222",borderRadius:12,padding:"14px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div><div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{p.athleteName}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{SESSION_TYPES.find(s=>s.id===p.sessionType)?.label} · {PROGRAM_TYPES.find(t=>t.id===p.programType)?.label}</div></div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>{new Date(p.createdAt).toLocaleDateString()}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setResult(p.content);setSections(parseWorkout(p.content));setSelAthlete(athletes.find(a=>a.id?.toString()===p.athleteId)||{name:p.athleteName});setProgramType(p.programType);setSessionType(p.sessionType);setStep("result");}} style={{flex:1,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:700}}>👁 View</button>
              <button onClick={()=>{navigator.clipboard?.writeText(p.content);}} style={{flex:1,background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.2)",color:"#00d084",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:700}}>📋 Copy</button>
              <button onClick={()=>persistPrograms(programs.filter(x=>x.id!==p.id))} style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12}}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );

  // ── SELECT ATHLETE ──
  if(step==="athlete") return (
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <Link href="/coach/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
          <div style={{flex:1}}><div style={{fontSize:16,fontWeight:800}}>PROGRAMMING ⚡</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Elite Skillz Lab 🧪</div></div>
          <button onClick={()=>setStep("library")} style={{background:"rgba(255,255,255,0.06)",border:"1px solid #333",color:"rgba(255,255,255,0.5)",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:12}}>📚 Library ({programs.length})</button>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search athlete..." style={inp2}/>
      </div>
      <div style={{padding:"14px 16px"}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase" as const,marginBottom:12}}>SELECT ATHLETE</div>
        {athletes.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.3)",fontSize:13}}>No athletes.<br/><Link href="/coach/roster" style={{color:"#1a6eff",textDecoration:"none"}}>Go to Roster →</Link></div>}
        {shown.map(a=>{
          const c=a.status==="urgent"?"#ff4444":a.status==="inactive"?"rgba(255,255,255,0.25)":"#1a6eff";
          const athleteCompletions=completions.filter(c=>c.athleteId===a.id);
          return(
            <div key={a.id} onClick={()=>{setSelAthlete(a);setStep("type");}} style={{background:"#111",border:"1px solid #222",borderLeft:`4px solid ${c}`,borderRadius:12,padding:"14px",marginBottom:8,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{a.name}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{a.sport}{a.position?` · ${a.position}`:""} · {a.sessions} sessions</div>
                </div>
                <div style={{textAlign:"right" as const}}>
                  <div style={{fontSize:9,padding:"3px 8px",background:`${c}22`,color:c,borderRadius:4,fontWeight:700,textTransform:"uppercase" as const,marginBottom:4}}>{a.status}</div>
                  {athleteCompletions.length>0&&<div style={{fontSize:9,color:"rgba(0,208,132,0.7)"}}>{athleteCompletions.length} sessions done</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );

  // ── SELECT TYPE ──
  if(step==="type") return (
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:100,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>setStep("athlete")} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Athletes</button>
        <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{selAthlete?.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{selAthlete?.sport} · {selAthlete?.sessions} sessions</div></div>
      </div>
      <div style={{padding:"16px"}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase" as const,marginBottom:12}}>PROGRAM FORMAT</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
          {PROGRAM_TYPES.map(pt=>(
            <div key={pt.id} onClick={()=>setProgramType(pt.id)} style={{background:programType===pt.id?"rgba(26,110,255,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${programType===pt.id?"rgba(26,110,255,0.4)":"#222"}`,borderRadius:12,padding:"14px 10px",cursor:"pointer",textAlign:"center" as const}}>
              <div style={{fontSize:24,marginBottom:6}}>{pt.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:programType===pt.id?"#1a6eff":"rgba(255,255,255,0.7)"}}>{pt.label}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase" as const,marginBottom:12}}>SESSION TYPE</div>
        {SESSION_TYPES.map(st=>(
          <div key={st.id} onClick={()=>setSessionType(st.id)} style={{background:sessionType===st.id?`${st.color}15`:"rgba(255,255,255,0.02)",border:`1px solid ${sessionType===st.id?st.color+"44":"#222"}`,borderRadius:12,padding:"13px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22}}>{st.icon}</span>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:sessionType===st.id?st.color:"#fff"}}>{st.label}</div></div>
            {sessionType===st.id&&<span style={{color:st.color,fontWeight:700}}>✓</span>}
          </div>
        ))}
        <div style={{marginTop:14}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase" as const,marginBottom:6}}>COACH'S NOTE (optional)</div>
          <textarea value={extra} onChange={e=>setExtra(e.target.value)} placeholder="Knee sore today · Focus on explosiveness · Game Friday..." style={{...inp2,height:60,resize:"none" as const,marginBottom:0}}/>
        </div>
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"14px 16px",background:"rgba(0,0,0,0.97)",borderTop:"1px solid #222"}}>
        <button onClick={generate} style={{width:"100%",background:"linear-gradient(135deg,#1a6eff,#0d4fd4)",border:"none",color:"#fff",borderRadius:14,padding:"18px",fontSize:17,fontWeight:900,cursor:"pointer"}}>⚡ GENERATE PROGRAM</button>
      </div>
    </main>
  );

  // ── GENERATING ──
  if(step==="generate") return (
    <main style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui",flexDirection:"column",padding:"40px 20px"}}>
      <div style={{fontSize:52,marginBottom:20}}>⚙️</div>
      <div style={{fontSize:18,fontWeight:900,color:"#1a6eff",letterSpacing:"0.1em",marginBottom:8,textAlign:"center"}}>
        {programType==="4week"?"BUILDING 4-WEEK PROGRAM...":programType==="8week"?"BUILDING 8-WEEK CYCLE...":"BUILDING SESSION PLAN..."}
      </div>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",textAlign:"center"}}>{selAthlete?.name} · {SESSION_TYPES.find(s=>s.id===sessionType)?.label}</div>
      {loading&&<div style={{marginTop:16,fontSize:12,color:"rgba(255,255,255,0.25)"}}>Generating elite programming with exact weights...</div>}
      {error&&(
        <div style={{marginTop:24,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:12,padding:"16px",color:"#ff8888",fontSize:13,textAlign:"center",maxWidth:360}}>
          {error}
          {(error.includes("credit")||error.includes("billing"))&&<div style={{marginTop:10}}><a href="https://console.anthropic.com/settings/billing" target="_blank" style={{color:"#1a6eff",fontWeight:700,textDecoration:"none"}}>→ Add credits</a></div>}
          <button onClick={()=>setStep("type")} style={{marginTop:12,background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:12}}>← Back</button>
        </div>
      )}
    </main>
  );

  // ── RESULT — PREMIUM CARD DISPLAY ──
  if(step==="result") {
    const typeInfo = SESSION_TYPES.find(s=>s.id===sessionType);
    return(
      <main style={{minHeight:"100vh",background:"#000",paddingBottom:120,fontFamily:"system-ui"}}>
        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${typeInfo?.color||"#1a6eff"}22,#000)`,borderBottom:"1px solid #222",padding:"16px 16px 12px",position:"sticky",top:0,zIndex:50,backdropFilter:"blur(20px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
            <button onClick={()=>setStep("type")} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.5)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← New</button>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:typeInfo?.color||"#1a6eff"}}>{typeInfo?.icon} {typeInfo?.label}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{selAthlete?.name} · {PROGRAM_TYPES.find(p=>p.id===programType)?.label}</div>
            </div>
          </div>
          {completeSaved&&<div style={{background:"rgba(0,208,132,0.15)",border:"1px solid rgba(0,208,132,0.3)",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#00d084",fontWeight:700}}>✓ Session marked complete! 1 session deducted.</div>}
        </div>

        {/* Section cards */}
        <div style={{padding:"14px 16px"}}>
          {sections.length > 0 ? sections.map((sec,i) => (
            <div key={i} style={{background:"#0d0d14",border:`1px solid ${sec.color}33`,borderRadius:16,marginBottom:16,overflow:"hidden"}}>
              {/* Section header */}
              <div style={{background:`${sec.color}18`,borderBottom:`1px solid ${sec.color}22`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>{sec.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:900,color:sec.color}}>{sec.title}</div>
                  {sec.time&&<div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:1}}>⏱ {sec.time}</div>}
                </div>
              </div>
              {/* Section content */}
              <div style={{padding:"14px 16px"}}>
                {sec.lines.map((line,j) => <ExerciseLine key={j} line={line}/>)}
              </div>
            </div>
          )) : (
            // Fallback: raw text if parsing fails
            <div style={{background:"#0d0d14",border:"1px solid #222",borderRadius:16,padding:"20px",fontSize:14,lineHeight:1.9,color:"rgba(255,255,255,0.85)",whiteSpace:"pre-wrap",fontFamily:"monospace"}}>
              {result}
            </div>
          )}
        </div>

        {/* Sticky action bar */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"12px 16px",background:"rgba(0,0,0,0.97)",borderTop:"1px solid #222",backdropFilter:"blur(20px)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 2fr",gap:8}}>
            <button onClick={saveProgram} style={{background:saved?"rgba(0,208,132,0.15)":"rgba(255,255,255,0.06)",border:`1px solid ${saved?"rgba(0,208,132,0.3)":"rgba(255,255,255,0.1)"}`,color:saved?"#00d084":"rgba(255,255,255,0.5)",borderRadius:12,padding:"14px 6px",cursor:"pointer",fontSize:13,fontWeight:700}}>
              {saved?"✓ Saved":"💾 Save"}
            </button>
            <button onClick={copy} style={{background:copied?"rgba(26,110,255,0.2)":"rgba(26,110,255,0.1)",border:`1px solid ${copied?"#1a6eff":"rgba(26,110,255,0.3)"}`,color:"#1a6eff",borderRadius:12,padding:"14px 6px",cursor:"pointer",fontSize:13,fontWeight:700}}>
              {copied?"✓ Copied":"📋 Copy"}
            </button>
            <button onClick={()=>setShowComplete(true)} style={{background:"#00d084",border:"none",color:"#000",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:15,fontWeight:900}}>
              ✓ MARK COMPLETE
            </button>
          </div>
        </div>

        {showComplete&&(
          <MarkCompleteSheet
            athletes={athletes} workout={result} sessionType={sessionType} programType={programType}
            athleteId={selAthlete?.id}
            onSave={handleComplete} onClose={()=>setShowComplete(false)}
          />
        )}
      </main>
    );
  }

  return null;
}

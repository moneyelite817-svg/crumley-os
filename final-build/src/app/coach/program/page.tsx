"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { WorkoutDisplay, parseWorkout } from "../_components/WorkoutDisplay";

const S_ATHLETES    = "ct_clients";
const S_PROGRAMS    = "ct_programs_v1";
const S_COMPLETIONS = "ct_workout_completions";

const SESSION_TYPES=[
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
const PROGRAM_TYPES=[
  {id:"single",icon:"📋",label:"Single Session",desc:"60-min workout today"},
  {id:"week",icon:"📅",label:"1-Week Block",desc:"5-day training week"},
  {id:"4week",icon:"🗓",label:"4-Week Program",desc:"Progressive monthly block"},
  {id:"8week",icon:"📆",label:"8-Week Cycle",desc:"Full performance cycle"},
];

interface SavedProgram{id:string;athleteId:string;athleteName:string;programType:string;sessionType:string;content:string;createdAt:string;}

function buildContext(a:any){
  const mx=Object.entries(a?.maxes||{}).filter(([,v])=>v).map(([k,v])=>`${k}:${v}`).join("|");
  return `Coach T — Elite Skillz Lab 🧪 | D1 Training Hulen Fort Worth TX | DB+Bands ONLY
ATHLETE: ${a?.name||"Athlete"} | ${a?.sport||"General"} | ${a?.position||"N/A"} | Age:${a?.age||"?"} | ${a?.weight||"?"}lbs
Goal:${a?.goal||"athletic development"} | Injuries:${a?.injuries||"none"} | Sessions:${a?.sessions} | ${a?.freq||2}x/wk
Maxes:${mx||"not recorded — use intermediate weights"}`;
}

const BASE_FORMAT=`Format with ━━━ TITLE (X min) ━━━ headers for each section:

**[ATHLETE NAME] — SESSION PLAN**
[Day, Month Date] | 60 Min | DB + Bands

━━━ ⚡ ACTIVATION (5 min) ━━━
1. [Exercise] — [reps] — [cue]
2. [Exercise] — [reps] — [cue]

━━━ 💥 POWER BLOCK (12 min) ━━━
1. [Exercise] — [sets]x[reps] @ [EXACT lbs] — [cue] | Rest [sec]
2. [Exercise] — [sets]x[reps] @ [EXACT lbs] — [cue] | Rest [sec]

━━━ 💪 STRENGTH BLOCK A (12 min) ━━━
A1. [Exercise] — [sets]x[reps] @ [lbs] — [cue]
A2. [Exercise] — [sets]x[reps] @ [lbs] — [cue]
Rest 90sec | [X] rounds

━━━ 💪 STRENGTH BLOCK B (10 min) ━━━
B1. [Exercise] — [sets]x[reps] @ [lbs] — [cue]
Rest 60sec | [X] rounds

━━━ 🔥 CONDITIONING (15 min) ━━━
[X] rounds | [work]s on / [rest]s off
1. [Exercise]  2. [Exercise]  3. [Exercise]  4. [Exercise]

━━━ 🧠 CORE (3 min) ━━━
1. [Exercise] — [sets]x[reps]

━━━ 🧊 COOLDOWN (3 min) ━━━
1. [Stretch — hold time]  2. [Stretch — hold time]

━━━ 🎯 COACH T CUE ━━━
[One specific coaching note for THIS athlete]

━━━ 📅 NEXT SESSION FOCUS ━━━
[What to build on next]`;

function buildPrompt(athlete:any,sessionType:string,programType:string,extra:string):string{
  const ctx=buildContext(athlete);
  const mx=Object.entries(athlete?.maxes||{}).filter(([,v])=>v).map(([k,v])=>`${k}:${v}`).join("|");
  const weightNote=mx?`Use % of max (Power=65%, Strength=78%). Give EXACT DB weights — never say "appropriate weight".`:`Give specific weight ranges — never say "appropriate weight".`;
  const today=new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});
  const startDate=new Date();
  const freq=athlete?.freq||3;

  if(programType==="4week"){
    const getDates=(weeks:number,dpw:number)=>{const DAYS=[1,2,3,4,5];const dates:string[]=[];let d=new Date(startDate);let w=0,di=0;while(w<weeks){while(d.getDay()===0||d.getDay()===6)d.setDate(d.getDate()+1);if(DAYS.includes(d.getDay())){dates.push(d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}));di++;if(di>=dpw){w++;di=0;}}d.setDate(d.getDate()+1);}return dates;};
    const dates=getDates(4,Math.min(freq,5));
    return `${ctx}\n${extra?`Coach note: ${extra}\n`:""}\nBuild a complete 4-WEEK TRAINING PROGRAM. DB+bands. ${freq}x/week. ${weightNote}\n\nPROGRAM START: ${startDate.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}\nTRAINING DATES: ${dates.join(" | ")}\n\nFor EACH WEEK use ━━━ WEEK N: THEME ━━━ format:\n━━━ WEEK 1: FOUNDATION ━━━\nFocus: [adaptation goal]\nFor each training day:\nDay [N] — [Date]: [session focus]\nMain: [Exercise] — [sets]x[reps] @ [%/weight] — [cue]\nSpeed: [Drill] — [volume]\nConditioning: [Circuit] — [work:rest]\nCoach Cue: [technical point]\n\n━━━ WEEK 2: VOLUME ━━━\n[Same format, progress from Week 1]\n\n━━━ WEEK 3: INTENSITY ━━━\n[Same format, heavier/more intense]\n\n━━━ WEEK 4: PEAK & TEST ━━━\n[Same format, PR attempts + benchmark tests]\n\n━━━ BENCHMARK TESTS (Week 4 Final Day) ━━━\nTest 1: [movement] — expected vs Week 1\nTest 2: [movement] — expected gain\n\n━━━ WEEK 5 RECOMMENDATION ━━━\n[What program to run next]`;
  }
  if(programType==="8week"){
    return `${ctx}\n${extra?`Coach note: ${extra}\n`:""}\nBuild a complete 8-WEEK PERFORMANCE CYCLE. DB+bands. ${freq}x/week. Goal: ${athlete?.goal||"athletic excellence"}.\n\nPERIODIZATION:\nWeeks 1-2: ANATOMICAL ADAPTATION | Weeks 3-4: VOLUME | Weeks 5-6: STRENGTH | Weeks 7-8: POWER & PEAK\n\nFor each 2-week phase use ━━━ WEEKS N-N: PHASE ━━━:\n━━━ WEEKS 1-2: ANATOMICAL ADAPTATION ━━━\nAdaptation Goal: [what body adapts to]\nLoading: [sets, reps, intensity %]\nMain Lifts: [4-5 exercises with loading]\nSpeed Work: [what footwork/speed this phase]\nConditioning: [energy system + protocol]\nWeek-over-Week Progression: [how to add load]\nEnd-of-Phase Benchmark: [how to measure improvement]\n\n[Same structure for Weeks 3-4, 5-6, 7-8]\n\n━━━ PERFORMANCE PROJECTIONS ━━━\nBy Week 4: [expected improvements]\nBy Week 8: [expected improvements]\n\n━━━ TESTING PROTOCOL ━━━\nWeek 1 Baseline: [tests]\nWeek 4 Retest: [tests]\nWeek 8 Final: [tests]`;
  }
  if(programType==="week"){
    return `${ctx}\n${extra?`Coach note: ${extra}\n`:""}\nBuild a 1-WEEK TRAINING BLOCK (${freq} days). DB+bands. ${weightNote}\n\nFor each day use ━━━ DAY N — Date: Focus ━━━:\n[Full session for that day with exercises, sets/reps/weights]\nInclude: training focus, main lifts, speed work, conditioning, recovery notes.`;
  }

  // Single session
  const PROMPTS:Record<string,string>={
    full:`${ctx}\n${extra?`Coach note: ${extra}\n`:""}\nGenerate COMPLETE 60-min D1 Performance Session. DB+Bands ONLY. ${weightNote}\n\n${BASE_FORMAT}`,
    speed:`${ctx}\n${extra?`Coach note: ${extra}\n`:""}\n60-min SPEED & AGILITY. Linear speed, COD, first-step, footwork, contrast method. Sport: ${athlete?.sport}. DB+bands.\n\n${BASE_FORMAT}`,
    strength:`${ctx}\n${extra?`Coach note: ${extra}\n`:""}\nSTRENGTH 60-min. Push/pull/hinge/squat/carry. DB+bands. ${weightNote}\n\n${BASE_FORMAT}`,
    conditioning:`${ctx}\n${extra?`Coach note: ${extra}\n`:""}\n50-min CONDITIONING. Sport energy systems. Multiple circuits, exact work:rest. DB+bands.\n\n${BASE_FORMAT}`,
    mobility:`${ctx}\n${extra?`Coach note: ${extra}\n`:""}\n45-min MOBILITY & RECOVERY. Foam rolling, joint mob, dynamic stretch, neural release. Use ━━━ section format.`,
    football:`${ctx}\n${extra?`Coach note: ${extra}\n`:""}\n60-min FOOTBALL session for ${athlete?.position||"athlete"}. Position-specific explosive work. DB+bands.\n\n${BASE_FORMAT}`,
    soccer:`${ctx}\n${extra?`Coach note: ${extra}\n`:""}\n55-min SOCCER SPEED & COD. Curvilinear runs, cuts, explosive first step. DB+bands.\n\n${BASE_FORMAT}`,
    youth:`${ctx}\n${extra?`Coach note: ${extra}\n`:""}\n45-min YOUTH session. Age-appropriate, fun, fundamentals. Use ━━━ section format.`,
    injury:`${ctx}\n${extra?`Coach note: ${extra}\n`:""}\n50-min MODIFIED session around: ${athlete?.injuries||extra||"limitation"}. Safe modifications. Use ━━━ section format.`,
    combine:`${ctx}\n${extra?`Coach note: ${extra}\n`:""}\n50-min COMBINE PREP. 40-yard, vertical, broad jump, pro agility. Compare to D1 standards. Use ━━━ section format.`,
  };
  return PROMPTS[sessionType]||PROMPTS.full;
}

function MarkCompleteSheet({athlete,sessionType,programType,onSave,onClose}:{athlete:any;sessionType:string;programType:string;onSave:(d:any)=>void;onClose:()=>void;}){
  const [effort,setEffort]=useState(7);const[readiness,setReadiness]=useState(7);const[soreness,setSoreness]=useState(3);const[notes,setNotes]=useState("");const[skipped,setSkipped]=useState("");
  const inp2:any={width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:13,outline:"none",boxSizing:"border-box"};
  return(
    <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)"}}/>
      <div style={{position:"relative",background:"#0a0a14",borderRadius:"20px 20px 0 0",border:"1px solid rgba(0,208,132,0.3)",padding:"20px 16px 50px",maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><div style={{fontSize:16,fontWeight:900,color:"#00d084"}}>✓ MARK COMPLETE</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{athlete?.name}</div></div>
          <button onClick={()=>onSave({id:`wc-${Date.now()}`,athleteId:athlete.id,athleteName:athlete.name,workoutType:sessionType,programType,completedAt:new Date().toISOString(),effort,readiness,soreness,coachNotes:notes,skippedExercises:skipped,sessionsDeducted:true})} style={{background:"#00d084",border:"none",color:"#000",borderRadius:10,padding:"10px 18px",cursor:"pointer",fontSize:14,fontWeight:900}}>SAVE ✓</button>
        </div>
        <div style={{background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.2)",borderRadius:12,padding:"12px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:15,fontWeight:700}}>{athlete?.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{athlete?.sport} · {athlete?.sessions} sessions</div></div>
          {athlete?.sessions<=3&&<div style={{fontSize:11,color:"#ff4444",fontWeight:700}}>⚠️ Low sessions</div>}
        </div>
        {[{l:"EFFORT",v:effort,set:setEffort,c:"#1a6eff",d:["Rest","Easy","Moderate","Moderate","Hard","Hard","Very Hard","Very Hard","Max","Max"]},{l:"READINESS",v:readiness,set:setReadiness,c:"#00d084",d:["Dead","Very Low","Low","Low","Okay","Okay","Good","Good","Great","Peak"]},{l:"SORENESS",v:soreness,set:setSoreness,c:"#f0c040",d:["None","Minimal","Light","Light","Moderate","Moderate","Heavy","Heavy","Very Sore","Wrecked"]}].map(r=>(
          <div key={r.l} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)"}}>{r.l}</div><div style={{fontSize:14,fontWeight:900,color:r.c}}>{r.v}/10 — {r.d[r.v-1]}</div></div>
            <div style={{display:"flex",gap:4}}>{[1,2,3,4,5,6,7,8,9,10].map(n=><div key={n} onClick={()=>r.set(n)} style={{flex:1,height:36,borderRadius:6,background:r.v>=n?r.c:"rgba(255,255,255,0.08)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:r.v>=n?"#fff":"rgba(255,255,255,0.3)",border:`1px solid ${r.v===n?r.c:"transparent"}`}}>{n}</div>)}</div>
          </div>
        ))}
        <div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",marginBottom:6}}>EXERCISES SKIPPED</div><input value={skipped} onChange={e=>setSkipped(e.target.value)} placeholder="Any skipped…" style={inp2}/></div>
        <div><div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",marginBottom:6}}>COACH NOTES</div><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Performance notes, next focus…" style={{...inp2,height:70,resize:"none"}}/></div>
        {athlete?.sessions<=3&&<div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10,padding:"10px 12px",marginTop:12,fontSize:12,color:"#ff8888"}}>⚠️ After this session: {Math.max(0,athlete.sessions-1)} session(s) remaining. Consider renewal.</div>}
      </div>
    </div>
  );
}

export default function ProgramPage(){
  const [athletes,setAthletes]=useState<any[]>([]);
  const [programs,setPrograms]=useState<SavedProgram[]>([]);
  const [completions,setCompletions]=useState<any[]>([]);
  const [step,setStep]=useState<"athlete"|"type"|"generate"|"result"|"library">("athlete");
  const [sel,setSel]=useState<any>(null);
  const [programType,setProgramType]=useState("single");
  const [sessionType,setSessionType]=useState("full");
  const [extra,setExtra]=useState("");
  const [result,setResult]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [copied,setCopied]=useState(false);
  const [saved,setSaved]=useState(false);
  const [showComplete,setShowComplete]=useState(false);
  const [completeSaved,setCompleteSaved]=useState(false);
  const [search,setSearch]=useState("");

  useEffect(()=>{
    try{const s=localStorage.getItem(S_ATHLETES);if(s){const p=JSON.parse(s);if(Array.isArray(p))setAthletes(p);}}catch{}
    try{const s=localStorage.getItem(S_PROGRAMS);if(s)setPrograms(JSON.parse(s));}catch{}
    try{const s=localStorage.getItem(S_COMPLETIONS);if(s)setCompletions(JSON.parse(s));}catch{}
    try{const pre=localStorage.getItem("cros_program_athlete");if(pre){const a=JSON.parse(pre);setSel(a);setStep("type");localStorage.removeItem("cros_program_athlete");}}catch{}
  },[]);

  function persistPrograms(d:SavedProgram[]){setPrograms(d);try{localStorage.setItem(S_PROGRAMS,JSON.stringify(d));}catch{}}
  function persistCompletions(d:any[]){setCompletions(d);try{localStorage.setItem(S_COMPLETIONS,JSON.stringify(d));}catch{}}

  async function generate(){
    setStep("generate");setResult("");setError("");setLoading(true);
    const prompt=buildPrompt(sel,sessionType,programType,extra);
    try{const res=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});const data=await res.json();if(data.error){setError(data.message||data.error);setLoading(false);return;}setResult(data.text);setStep("result");}
    catch{setError("Network error.");}
    setLoading(false);
  }

  function saveProgram(){const p:SavedProgram={id:`p-${Date.now()}`,athleteId:sel?.id?.toString()||"",athleteName:sel?.name||"",programType,sessionType,content:result,createdAt:new Date().toISOString()};persistPrograms([p,...programs]);setSaved(true);setTimeout(()=>setSaved(false),2000);}
  function copy(){navigator.clipboard?.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);}

  function handleComplete(comp:any){
    const ua=athletes.map(a=>a.id===comp.athleteId?{...a,sessions:Math.max(0,a.sessions-1)}:a);
    try{localStorage.setItem(S_ATHLETES,JSON.stringify(ua));}catch{}
    setAthletes(ua);
    if(sel?.id===comp.athleteId)setSel((p:any)=>({...p,sessions:Math.max(0,(p?.sessions||1)-1)}));
    persistCompletions([comp,...completions]);
    setShowComplete(false);setCompleteSaved(true);setTimeout(()=>setCompleteSaved(false),3000);
  }

  const typeInfo=SESSION_TYPES.find(s=>s.id===sessionType);
  const shown=athletes.filter(a=>a.name?.toLowerCase().includes(search.toLowerCase()));
  const inp2:any={width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box"};

  if(step==="library")return(
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
              <button onClick={()=>{setResult(p.content);const a=athletes.find(x=>x.id?.toString()===p.athleteId)||{name:p.athleteName};setSel(a);setProgramType(p.programType);setSessionType(p.sessionType);setStep("result");}} style={{flex:1,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:700}}>👁 View</button>
              <button onClick={()=>{navigator.clipboard?.writeText(p.content);}} style={{flex:1,background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.2)",color:"#00d084",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:700}}>📋 Copy</button>
              <button onClick={()=>persistPrograms(programs.filter(x=>x.id!==p.id))} style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12}}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );

  if(step==="athlete")return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <Link href="/coach/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
          <div style={{flex:1}}><div style={{fontSize:16,fontWeight:800}}>PROGRAMMING AGENT ⚡</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Elite Skillz Lab 🧪 — unified workout builder</div></div>
          <button onClick={()=>setStep("library")} style={{background:"rgba(255,255,255,0.06)",border:"1px solid #333",color:"rgba(255,255,255,0.5)",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:12}}>📚 ({programs.length})</button>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search athlete…" style={inp2}/>
      </div>
      <div style={{padding:"14px 16px"}}>
        {athletes.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.3)",fontSize:13}}>No athletes. <Link href="/coach/roster" style={{color:"#1a6eff",textDecoration:"none"}}>Go to Roster →</Link></div>}
        {shown.map(a=>{const c=a.status==="urgent"?"#ff4444":a.status==="inactive"?"rgba(255,255,255,0.25)":"#1a6eff";return(
          <div key={a.id} onClick={()=>{setSel(a);setStep("type");}} style={{background:"#111",border:"1px solid #222",borderLeft:`4px solid ${c}`,borderRadius:12,padding:"14px",marginBottom:8,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{a.name}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{a.sport}{a.position?` · ${a.position}`:""} · {a.sessions} sessions</div></div>
              <div style={{fontSize:9,padding:"3px 8px",background:`${c}22`,color:c,borderRadius:4,fontWeight:700,textTransform:"uppercase"}}>{a.status}</div>
            </div>
          </div>
        );})}
      </div>
    </main>
  );

  if(step==="type")return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:100,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>setStep("athlete")} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Athletes</button>
        <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{sel?.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{sel?.sport} · {sel?.sessions} sessions · {sel?.freq}x/wk</div></div>
      </div>
      <div style={{padding:"16px"}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase",marginBottom:12}}>PROGRAM FORMAT</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
          {PROGRAM_TYPES.map(pt=><div key={pt.id} onClick={()=>setProgramType(pt.id)} style={{background:programType===pt.id?"rgba(26,110,255,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${programType===pt.id?"rgba(26,110,255,0.4)":"#222"}`,borderRadius:12,padding:"14px 10px",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:24,marginBottom:6}}>{pt.icon}</div><div style={{fontSize:13,fontWeight:700,color:programType===pt.id?"#1a6eff":"rgba(255,255,255,0.7)",marginBottom:2}}>{pt.label}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{pt.desc}</div></div>)}
        </div>
        {(programType==="single"||programType==="week")&&(
          <>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase",marginBottom:12}}>SESSION TYPE</div>
            {SESSION_TYPES.map(st=><div key={st.id} onClick={()=>setSessionType(st.id)} style={{background:sessionType===st.id?`${st.color}12`:"rgba(255,255,255,0.02)",border:`1px solid ${sessionType===st.id?st.color+"44":"#222"}`,borderRadius:12,padding:"13px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:22}}>{st.icon}</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:sessionType===st.id?st.color:"#fff"}}>{st.label}</div></div>{sessionType===st.id&&<span style={{color:st.color,fontWeight:700}}>✓</span>}</div>)}
          </>
        )}
        <div style={{marginTop:14,marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase",marginBottom:6}}>COACH'S NOTE (optional)</div>
          <textarea value={extra} onChange={e=>setExtra(e.target.value)} placeholder={programType==="4week"?"Training focus, upcoming events, current level…":"Knee sore · Focus on explosiveness · Game Friday…"} style={{...inp2,height:55,resize:"none"}}/>
        </div>
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"14px 16px",background:"rgba(0,0,0,0.97)",borderTop:"1px solid #222"}}>
        <button onClick={generate} style={{width:"100%",background:"linear-gradient(135deg,#1a6eff,#0d4fd4)",border:"none",color:"#fff",borderRadius:14,padding:"18px",fontSize:17,fontWeight:900,cursor:"pointer"}}>
          ⚡ GENERATE {programType==="4week"?"4-WEEK PROGRAM":programType==="8week"?"8-WEEK CYCLE":programType==="week"?"WEEKLY BLOCK":"SESSION PLAN"}
        </button>
      </div>
    </main>
  );

  if(step==="generate")return(
    <main style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui",flexDirection:"column",padding:"40px 20px"}}>
      <div style={{fontSize:52,marginBottom:20}}>⚙️</div>
      <div style={{fontSize:18,fontWeight:900,color:"#1a6eff",letterSpacing:"0.1em",marginBottom:8,textAlign:"center"}}>{programType==="4week"?"BUILDING 4-WEEK PROGRAM…":programType==="8week"?"BUILDING 8-WEEK CYCLE…":programType==="week"?"BUILDING WEEKLY BLOCK…":"BUILDING SESSION PLAN…"}</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",textAlign:"center"}}>{sel?.name} · {SESSION_TYPES.find(s=>s.id===sessionType)?.label}</div>
      {error&&<div style={{marginTop:24,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:12,padding:"16px",color:"#ff8888",fontSize:13,textAlign:"center",maxWidth:360}}>{error}<br/><button onClick={()=>setStep("type")} style={{marginTop:12,background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:12}}>← Back</button></div>}
    </main>
  );

  if(step==="result")return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:100,fontFamily:"system-ui"}}>
      <div style={{background:`linear-gradient(135deg,${typeInfo?.color||"#1a6eff"}22,#000)`,borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:completeSaved?10:0}}>
          <button onClick={()=>setStep("type")} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.5)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← New</button>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:typeInfo?.color||"#1a6eff"}}>{typeInfo?.icon} {PROGRAM_TYPES.find(p=>p.id===programType)?.label} — {typeInfo?.label}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{sel?.name}</div>
          </div>
        </div>
        {completeSaved&&<div style={{background:"rgba(0,208,132,0.12)",border:"1px solid rgba(0,208,132,0.3)",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#00d084",fontWeight:700}}>✓ Session logged! 1 session deducted from {sel?.name}.</div>}
      </div>

      {/* ── UNIFIED WORKOUT CARD DISPLAY ── */}
      <div style={{padding:"14px 16px"}}>
        <WorkoutDisplay text={result}/>
      </div>

      {/* Sticky actions */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"12px 16px",background:"rgba(0,0,0,0.97)",borderTop:"1px solid #222",backdropFilter:"blur(20px)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 2fr",gap:8}}>
          <button onClick={saveProgram} style={{background:saved?"rgba(0,208,132,0.15)":"rgba(255,255,255,0.06)",border:`1px solid ${saved?"rgba(0,208,132,0.3)":"rgba(255,255,255,0.1)"}`,color:saved?"#00d084":"rgba(255,255,255,0.5)",borderRadius:12,padding:"14px 6px",cursor:"pointer",fontSize:13,fontWeight:700}}>{saved?"✓ Saved":"💾 Save"}</button>
          <button onClick={copy} style={{background:copied?"rgba(26,110,255,0.2)":"rgba(26,110,255,0.1)",border:`1px solid ${copied?"#1a6eff":"rgba(26,110,255,0.3)"}`,color:"#1a6eff",borderRadius:12,padding:"14px 6px",cursor:"pointer",fontSize:13,fontWeight:700}}>{copied?"✓ Copied":"📋 Copy"}</button>
          {(programType==="single"||programType==="week")?<button onClick={()=>setShowComplete(true)} style={{background:"#00d084",border:"none",color:"#000",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:15,fontWeight:900}}>✓ MARK COMPLETE</button>:<button onClick={()=>setStep("library")} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:14,fontWeight:700}}>📚 View Library</button>}
        </div>
      </div>
      {showComplete&&sel&&<MarkCompleteSheet athlete={sel} sessionType={sessionType} programType={programType} onSave={handleComplete} onClose={()=>setShowComplete(false)}/>}
    </main>
  );
  return null;
}

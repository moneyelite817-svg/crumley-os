"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ══════════════════════════════════════════════════════
// STORAGE KEYS — same as schedule page
// ══════════════════════════════════════════════════════
const S_ATHLETES    = "ct_clients";
const S_SESSIONS    = "ct_sessions_v2";
const S_BOOKINGS    = "ct_bookings_v1";
const S_COMPLETIONS = "ct_workout_completions";
const S_PROGRAMS    = "ct_programs_v1";

// ══════════════════════════════════════════════════════
// DEFAULT ATHLETES
// ══════════════════════════════════════════════════════
const BM = {squat:"",bench:"",deadlift:"",powerClean:"",sprint40:"",vertical:"",broadJump:"",agility:"",pullups:"",pushups:"",hangClean:"",customPR:""};
const DEF_ATHLETES = [
  {id:1,name:"Levi Smith",sport:"General",freq:2,sessions:1,value:378,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:2,name:"Donovan Edwards",sport:"General",freq:2,sessions:33,value:2835,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:3,name:"Travis Cheyne",sport:"General",freq:2,sessions:48,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:4,name:"Rex Hayes",sport:"General",freq:2,sessions:26,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:5,name:"Emiliano Ortiz",sport:"Football",freq:4,sessions:20,value:0,status:"inactive",notes:"Mom: Anna Ortiz",age:"",weight:"",position:"WR",goal:"",injuries:"",parentName:"Anna Ortiz",parentPhone:""},
  {id:6,name:"Mateo Ortiz",sport:"Football",freq:4,sessions:20,value:0,status:"inactive",notes:"Brother of Emiliano",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:7,name:"Noah Langdon",sport:"General",freq:1,sessions:4,value:367,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:8,name:"Sam Stacy",sport:"General",freq:1,sessions:4,value:1575,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:9,name:"Cruz Mar",sport:"General",freq:1,sessions:13,value:1134,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:10,name:"Joaquin Chavez",sport:"General",freq:2,sessions:12,value:1071,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:11,name:"Lilianna Chavez",sport:"General",freq:2,sessions:12,value:1071,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:12,name:"Breelan",sport:"General",freq:2,sessions:8,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:13,name:"Granger",sport:"General",freq:2,sessions:8,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:14,name:"Cody Bevan",sport:"General",freq:1,sessions:1,value:0,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:15,name:"Joshua Chavis",sport:"General",freq:2,sessions:2,value:0,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:16,name:"Daniel Chapman",sport:"General",freq:2,sessions:2,value:0,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:17,name:"Axton Mondragon",sport:"General",freq:1,sessions:4,value:1575,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:18,name:"Aaliyah Jauregui",sport:"General",freq:2,sessions:2,value:0,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:19,name:"Jaxson Bowling",sport:"General",freq:9,sessions:12,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:20,name:"Jacob Robledo",sport:"General",freq:1,sessions:3,value:210,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},
  {id:21,name:"Quenton Jean",sport:"General",freq:2,sessions:0,value:0,status:"inactive",notes:"Contact Kevin (dad)",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"Kevin Jean",parentPhone:""},
].map(a => ({...a, maxes:{...BM}, progressLog:[]}));

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════
const D1_DAYS = [2, 3]; // Tue, Wed
const D1_START = "17:45";
const D1_END   = "19:45";
function toMin(t:string){const[h,m]=t.split(":").map(Number);return h*60+m;}
function overlaps(s1:string,e1:string,s2:string,e2:string){return toMin(s1)<toMin(e2)&&toMin(e1)>toMin(s2);}
function to12(t:string){if(!t)return"";const[h,m]=t.split(":").map(Number);return`${h%12||12}:${m.toString().padStart(2,"0")} ${h>=12?"PM":"AM"}`;}
function todayStr(){return new Date().toISOString().split("T")[0];}
function fmtDate(d:string){if(!d)return"—";return new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});}

const SC: Record<string,{c:string;bg:string;l:string}> = {
  active:{c:"#1a6eff",bg:"rgba(26,110,255,0.1)",l:"ACTIVE"},
  urgent:{c:"#ff4444",bg:"rgba(255,68,68,0.1)",l:"URGENT"},
  inactive:{c:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)",l:"INACTIVE"},
};
const inp:any={width:"100%",padding:"10px 12px",background:"#111",border:"1px solid #333",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10};
const lbl:any={display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:4};

// ══════════════════════════════════════════════════════
// BOOK SESSION MODAL
// ══════════════════════════════════════════════════════
function BookSessionModal({athlete, existingSessions, onSave, onClose}: {
  athlete:any; existingSessions:any[]; onSave:(sess:any,booking:any)=>void; onClose:()=>void;
}) {
  const [sessionType, setSessionType] = useState("private");
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [location, setLocation] = useState("D1 Training Hulen Fort Worth");
  const [notes, setNotes] = useState("");
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [saved, setSaved] = useState(false);

  const SESSION_TYPES = [
    {id:"private",     icon:"👤", label:"Private Training",   max:1},
    {id:"group_small", icon:"👥", label:"Small Group (2-4)",  max:4},
    {id:"assessment",  icon:"📊", label:"Assessment/Testing", max:2},
    {id:"program_review",icon:"📋",label:"Program Review",    max:2},
  ];

  function check() {
    const c:string[] = [];
    const eventDate = new Date(date+"T12:00:00");
    const day = eventDate.getDay();
    if(D1_DAYS.includes(day) && overlaps(startTime,endTime,D1_START,D1_END))
      c.push("🔒 D1 Training LOCKED 5:45–7:45 PM — pick a different time.");
    existingSessions.forEach(s => {
      if(s.date===date && overlaps(startTime,endTime,s.startTime,s.endTime))
        c.push(`⚠️ "${s.title}" already booked ${to12(s.startTime)}–${to12(s.endTime)}.`);
    });
    setConflicts(c);
    setChecked(true);
    return c;
  }

  function save() {
    const c = check();
    if(c.filter(x=>x.includes("🔒")||x.includes("⚠️")).length) return;
    const sessId = `s-${Date.now()}`;
    const session = {
      id: sessId,
      sessionType,
      title: `${athlete.name} — ${SESSION_TYPES.find(t=>t.id===sessionType)?.label||"Training"}`,
      date, startTime, endTime,
      maxAthletes: SESSION_TYPES.find(t=>t.id===sessionType)?.max||1,
      location,
      price: 25,
      notes,
      isLocked: false, isCompleted: false, coachNotes: "",
      createdAt: new Date().toISOString(),
    };
    const booking = {
      id: `b-${Date.now()}-${athlete.id}`,
      sessionId: sessId,
      athleteId: athlete.id,
      athleteName: athlete.name,
      athleteSport: athlete.sport,
      athleteStatus: athlete.status,
      sessionsRemaining: athlete.sessions,
      bookingStatus: "booked",
      attendanceStatus: "pending",
      effortScore: 0, readinessScore: 0, sorenessScore: 0,
      coachNotes: "", workoutNotes: "",
      sessionsDeducted: false,
      bookedAt: new Date().toISOString(),
      completedAt: "",
    };
    onSave(session, booking);
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  }

  const inp2:any={width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box"};

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)"}}/>
      <div style={{position:"relative",background:"#0a0a14",borderRadius:"20px 20px 0 0",border:"1px solid rgba(26,110,255,0.3)",padding:"20px 16px 50px",maxHeight:"92vh",overflowY:"auto"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:16,fontWeight:900,color:"#1a6eff"}}>📅 BOOK SESSION</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>Elite Skillz Lab 🧪</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>✕ Cancel</button>
        </div>

        {/* ATHLETE — locked in */}
        <div style={{background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",borderRadius:12,padding:"14px",marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"#1a6eff",marginBottom:8}}>🏃 ATHLETE (LOCKED)</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:17,fontWeight:900}}>{athlete.name}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2}}>
                {athlete.sport}{athlete.position?` · ${athlete.position}`:""}{athlete.age?` · Age ${athlete.age}`:""}
              </div>
              {athlete.injuries&&<div style={{fontSize:11,color:"#f0c040",marginTop:3}}>⚠️ {athlete.injuries}</div>}
            </div>
            <div style={{textAlign:"center" as const}}>
              <div style={{fontSize:22,fontWeight:900,color:athlete.sessions<=2?"#ff4444":athlete.sessions<=5?"#f0c040":"#1a6eff"}}>{athlete.sessions}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em"}}>SESSIONS LEFT</div>
            </div>
          </div>
        </div>

        {/* Conflicts */}
        {checked && conflicts.length > 0 && (
          <div style={{marginBottom:12}}>
            {conflicts.map((c,i)=>(
              <div key={i} style={{background:"rgba(255,68,68,0.1)",border:"1px solid rgba(255,68,68,0.25)",borderRadius:10,padding:"10px 12px",marginBottom:6,fontSize:13,color:"#ff8888"}}>{c}</div>
            ))}
          </div>
        )}
        {checked && conflicts.length===0 && (
          <div style={{background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.25)",borderRadius:10,padding:"10px 12px",marginBottom:12,fontSize:13,color:"#00d084",fontWeight:700}}>✅ No conflicts — time is available!</div>
        )}

        {/* Session type */}
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:8}}>SESSION TYPE</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {SESSION_TYPES.map(t=>(
            <div key={t.id} onClick={()=>{setSessionType(t.id);setChecked(false);}} style={{background:sessionType===t.id?"rgba(26,110,255,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${sessionType===t.id?"rgba(26,110,255,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:10,padding:"12px 10px",cursor:"pointer",textAlign:"center" as const}}>
              <div style={{fontSize:20,marginBottom:4}}>{t.icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:sessionType===t.id?"#1a6eff":"rgba(255,255,255,0.7)"}}>{t.label}</div>
            </div>
          ))}
        </div>

        {/* Date & Time */}
        <div style={{marginBottom:14}}>
          <label style={lbl}>DATE</label>
          <input type="date" value={date} onChange={e=>{setDate(e.target.value);setChecked(false);}} style={inp2}/>
          {D1_DAYS.includes(new Date(date+"T12:00:00").getDay())&&(
            <div style={{fontSize:11,color:"#1a6eff",marginTop:4,fontWeight:700}}>🔒 D1 locked 5:45–7:45 PM on this day — plan around it</div>
          )}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div>
            <label style={lbl}>START TIME</label>
            <input type="time" value={startTime} onChange={e=>{setStartTime(e.target.value);setChecked(false);}} style={inp2}/>
          </div>
          <div>
            <label style={lbl}>END TIME</label>
            <input type="time" value={endTime} onChange={e=>{setEndTime(e.target.value);setChecked(false);}} style={inp2}/>
          </div>
        </div>

        {/* Location */}
        <div style={{marginBottom:14}}>
          <label style={lbl}>LOCATION</label>
          <input value={location} onChange={e=>setLocation(e.target.value)} style={inp2}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={lbl}>NOTES</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any notes for this session..." style={{...inp2,height:55,resize:"none" as const}}/>
        </div>

        {/* Action buttons */}
        <button
          onClick={save}
          style={{width:"100%",background:saved?"#00d084":"#1a6eff",border:"none",color:saved?"#000":"#fff",borderRadius:14,padding:"17px",fontSize:16,fontWeight:900,cursor:"pointer",letterSpacing:"0.04em"}}
        >
          {saved?"✓ SESSION BOOKED!":"📅 CHECK & BOOK SESSION"}
        </button>
        <div style={{textAlign:"center" as const,marginTop:8,fontSize:11,color:"rgba(255,255,255,0.25)"}}>
          Session will appear on your Schedule calendar
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// AI PANEL — 35 skills bottom sheet
// ══════════════════════════════════════════════════════
function AISheet({athlete,onClose}:{athlete:any;onClose:()=>void}) {
  const [cat,setCat]=useState("training");
  const [sid,setSid]=useState<string|null>(null);
  const [ex,setEx]=useState("");
  const [res,setRes]=useState("");
  const [load,setLoad]=useState(false);
  const [err,setErr]=useState("");
  const [copied,setCopied]=useState(false);

  const CATS=[{id:"training",l:"🏋️ Training",c:"#1a6eff"},{id:"comms",l:"💬 Comms",c:"#00d084"},{id:"assess",l:"📊 Assess",c:"#f0c040"},{id:"content",l:"📱 Content",c:"#9b59b6"},{id:"business",l:"💰 Business",c:"#e74c3c"}];
  const SK:Record<string,{id:string;icon:string;label:string}[]>={
    training:[{id:"workout",icon:"🏋️",label:"Full Session Plan"},{id:"speed",icon:"⚡",label:"Speed & Agility"},{id:"strength",icon:"💪",label:"Strength Block"},{id:"conditioning",icon:"🫁",label:"Conditioning"},{id:"warmup",icon:"🔥",label:"Dynamic Warm-Up"},{id:"compPrep",icon:"🏆",label:"Competition Prep"},{id:"recovery",icon:"🧊",label:"Recovery"},{id:"program",icon:"📋",label:"4-Week Program"}],
    comms:[{id:"renewal",icon:"💰",label:"Renewal Pitch"},{id:"parentUpdate",icon:"👨‍👩‍👦",label:"Parent Update"},{id:"athleteCheckIn",icon:"👋",label:"Athlete Check-In"},{id:"reEngage",icon:"🔁",label:"Re-Engage"},{id:"milestone",icon:"🎉",label:"Milestone"},{id:"sessionRecap",icon:"📝",label:"Session Recap"}],
    assess:[{id:"progressReport",icon:"📈",label:"Progress Report"},{id:"prSummary",icon:"🏅",label:"PR Summary"},{id:"devAnalysis",icon:"🔬",label:"Dev Analysis"},{id:"combineReady",icon:"🎯",label:"Combine Readiness"},{id:"injuryPlan",icon:"🩹",label:"Injury Plan"}],
    content:[{id:"instaAthlete",icon:"📸",label:"Athlete Spotlight"},{id:"instaPR",icon:"🏆",label:"PR Post"},{id:"programPromo",icon:"📣",label:"Program Promo"},{id:"motivational",icon:"🔥",label:"Motivational Post"}],
    business:[{id:"packageRec",icon:"📦",label:"Package Rec"},{id:"upsell",icon:"📈",label:"Upsell"},{id:"referralAsk",icon:"🤝",label:"Referral Ask"},{id:"d1Pitch",icon:"🏫",label:"D1 Pitch"}],
  };
  const cc=CATS.find(c=>c.id===cat)?.c||"#1a6eff";
  const mx=Object.entries(athlete?.maxes||{}).filter(([,v])=>v).map(([k,v])=>`${k}:${v}`).join("|");
  const ctx=`Coach T — Elite Skillz Lab 🧪 | D1 DB+Bands | ATHLETE: ${athlete?.name} | ${athlete?.sport||"General"} | ${athlete?.position||""} | Sessions:${athlete?.sessions} | ${athlete?.freq||2}x/wk | Maxes:${mx||"not recorded"} | Goal:${athlete?.goal||"athletic development"} | Injuries:${athlete?.injuries||"none"}`;

  const PROMPTS:Record<string,string>={
    workout:`${ctx}\nComplete 60-min DB+Bands session. ${mx?`Exact weights from maxes (Power=65%,Strength=78%).`:"Prescribe specific weight ranges."}\n\nFormat EXACTLY:\n**${(athlete?.name||"ATHLETE").split(" ")[0].toUpperCase()} — SESSION PLAN**\n${new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})} | 60 Min | DB + Bands\n\n━━━ ⚡ ACTIVATION (5 min) ━━━\n1. [Exercise] — [reps] — [cue]\n\n━━━ 💥 POWER (12 min) ━━━\n1. [Exercise] — [sets]x[reps] @ [EXACT lbs] — [cue] | Rest [sec]\n\n━━━ 💪 STRENGTH A (12 min) ━━━\nA1. [Exercise] — [sets]x[reps] @ [lbs] — [cue]\nA2. [Exercise] — [sets]x[reps] @ [lbs]\nRest 90sec | [X] rounds\n\n━━━ 💪 STRENGTH B (10 min) ━━━\nB1. [Exercise] — [sets]x[reps] @ [lbs] — [cue]\nRest 60sec | [X] rounds\n\n━━━ 🔥 CONDITIONING (15 min) ━━━\n[X] rounds | [work]s / [rest]s\n1. [Exercise] 2. [Exercise] 3. [Exercise]\n\n━━━ 🧊 COOLDOWN (3 min) ━━━\n1. [Stretch — hold]\n\n━━━ 🎯 COACH T CUE ━━━\n[Personal note for this athlete]\n\n━━━ 📅 NEXT SESSION ━━━\n[What to progress]`,
    speed:`${ctx}\n60-min speed & agility. DB+bands. Linear, COD, footwork, contrast method. Sport-specific for ${athlete?.sport}. Use same ━━━ section format.`,
    strength:`${ctx}\nStrength 60-min. DB+bands. ${mx?`Weights from maxes:${mx}`:"RPE+specific ranges"}. Same ━━━ format.`,
    conditioning:`${ctx}\n50-min conditioning. DB+bands. Work:rest ratios. Sport:${athlete?.sport}. Same ━━━ format.`,
    warmup:`${ctx}\n12-min dynamic warm-up for ${athlete?.sport}. No equipment. Foam roll, joint mob, activation.`,
    compPrep:`${ctx}\n5-day comp/combine prep plan. Day-by-day, taper, activation, mental, morning routine.`,
    recovery:`${ctx}\n45-min active recovery. Low intensity, blood flow, foam rolling, mobility, light bands.`,
    program:`${ctx}\n4-WEEK PROGRAM. Week1:Foundation, Week2:Volume, Week3:Intensity, Week4:Peak. DB+bands.`,
    renewal:`${ctx}\n${athlete?.sessions} sessions left. Confident renewal pitch to ${athlete?.parentName||"parent/athlete"}. Coach not salesman. Under 5 sentences.`,
    parentUpdate:`${ctx}\nParent text to ${athlete?.parentName||"parent"}. 1 strength win, 1 movement improvement, 1 character note, next focus. Under 6 sentences.`,
    athleteCheckIn:`${ctx}\nCheck-in text FROM Coach T TO ${athlete?.name?.split(" ")[0]}. Coach energy. Under 3 sentences.`,
    reEngage:`${ctx}\nRe-engagement to ${athlete?.parentName||"parent/athlete"}. Noticed absence. End with availability question. Under 4 sentences.`,
    milestone:`${ctx}\nCelebration message — athlete hit a milestone. Enthusiastic, build momentum. Under 4 sentences.`,
    sessionRecap:`${ctx}\nSession recap to ${athlete?.parentName||"parent"}. What worked, what stood out, one focus. Under 4 sentences.`,
    progressReport:`${ctx}\n4-week progress report. Strength, speed, attitude, improvements, gaps. Professional enough for school coach.`,
    prSummary:`${ctx}\nPR Summary. Maxes:${mx||"none"}. Compare to standards. Top 2 strengths, top 2 gaps. Score /10.`,
    devAnalysis:`${ctx}\nDevelopment analysis. Level, strengths, limiters, #1 improvement in 90 days. Pro scout tone.`,
    combineReady:`${ctx}\nCombine readiness ${athlete?.sport} — ${athlete?.position}. D1/D2/D3 comparison. Current tier. Honest timeline.`,
    injuryPlan:`${ctx}\nModified plan around: ${athlete?.injuries||ex||"injury"}. DB+bands. What to avoid/modify/improve.`,
    instaAthlete:`${ctx}\nIG athlete spotlight. No last name. Sport:${athlete?.sport}. Grind+improvement. #EliteSkillzLab #D1Training #DFWAthletes`,
    instaPR:`${ctx}\nIG PR celebration. New record. Hype, work, inspire. 5 hashtags.`,
    programPromo:`${ctx}\nIG promo Elite Skillz Lab 🧪. D1 facility, results, limited spots. CTA. 5 hashtags.`,
    motivational:`${ctx}\nFire motivational post. Elite mindset. Short, powerful. 4 hashtags.`,
    packageRec:`${ctx}\nBest package recommendation. Goal:${athlete?.goal||"development"}. $25/hr. Specific rec + rationale.`,
    upsell:`${ctx}\nUpsell — more sessions. Frame development. Confident, not pushy. Under 4 sentences.`,
    referralAsk:`${ctx}\nReferral request. Natural, easy. Limited spots. Under 3 sentences.`,
    d1Pitch:`${ctx}\nPitch ${athlete?.name?.split(" ")[0]} into D1 Tue/Wed 5:45-7:45PM. Competitive environment. Under 4 sentences.`,
  };

  async function gen(){
    if(!sid)return;setLoad(true);setRes("");setErr("");
    const prompt=(PROMPTS[sid]||ctx)+"\n"+(ex||"");
    try{const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});const d=await r.json();if(d.error)setErr(d.message||d.error);else setRes(d.text);}catch{setErr("Network error.");}
    setLoad(false);
  }
  function copy(){navigator.clipboard?.writeText(res);setCopied(true);setTimeout(()=>setCopied(false),2000);}
  const inp3:any={...inp,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",marginBottom:0};

  return(
    <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)"}}/>
      <div style={{position:"relative",background:"#0a0a14",borderRadius:"20px 20px 0 0",border:"1px solid rgba(26,110,255,0.3)",padding:"20px 16px 50px",maxHeight:"93vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><div style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>⚡ AI AGENT</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{athlete?.name}</div></div>
          <button onClick={()=>{if(sid){setSid(null);setRes("");setErr("");}else onClose();}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>
            {sid?"← Back":"✕"}
          </button>
        </div>
        <div style={{background:"rgba(26,110,255,0.08)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:10,padding:"10px",marginBottom:14,display:"flex",gap:10}}>
          {[{l:"SESSIONS",v:athlete?.sessions},{l:"FREQ",v:`${athlete?.freq||2}x`},{l:"STATUS",v:(athlete?.status||"active").toUpperCase()},{l:"SPORT",v:athlete?.sport||"General"}].map((s,i)=>(
            <div key={i} style={{flex:1,textAlign:"center" as const}}><div style={{fontSize:13,fontWeight:900,color:"#1a6eff"}}>{s.v}</div><div style={{fontSize:8,color:"rgba(255,255,255,0.3)",marginTop:1}}>{s.l}</div></div>
          ))}
        </div>
        {!sid&&(
          <div>
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14}}>
              {CATS.map(c=><button key={c.id} onClick={()=>setCat(c.id)} style={{padding:"7px 12px",borderRadius:100,background:cat===c.id?c.c:"rgba(255,255,255,0.04)",border:`1px solid ${cat===c.id?c.c:"rgba(255,255,255,0.08)"}`,color:cat===c.id?"#fff":"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" as const}}>{c.l}</button>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {(SK[cat]||[]).map(s=><div key={s.id} onClick={()=>setSid(s.id)} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${cc}22`,borderRadius:12,padding:"13px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>{s.icon}</span><div style={{fontSize:12,fontWeight:700,color:cc,lineHeight:1.3}}>{s.label}</div></div>)}
            </div>
          </div>
        )}
        {sid&&!res&&!load&&(
          <div>
            <div style={{background:`${cc}15`,border:`1px solid ${cc}33`,borderRadius:10,padding:"10px 14px",marginBottom:14}}><div style={{fontSize:14,fontWeight:700,color:cc}}>{(SK[cat]||[]).find(s=>s.id===sid)?.icon} {(SK[cat]||[]).find(s=>s.id===sid)?.label}</div></div>
            <label style={lbl}>ADD CONTEXT (optional)</label>
            <textarea value={ex} onChange={e=>setEx(e.target.value)} placeholder="Knee sore · Focus area · Game Friday..." style={{...inp3,height:60,resize:"none" as const,marginBottom:14}}/>
            <button onClick={gen} style={{width:"100%",background:cc,border:"none",color:"#fff",borderRadius:12,padding:"16px",fontSize:16,fontWeight:900,cursor:"pointer"}}>⚡ GENERATE</button>
          </div>
        )}
        {load&&<div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:44,marginBottom:12}}>⚙️</div><div style={{fontSize:15,fontWeight:900,color:cc,letterSpacing:"0.1em"}}>GENERATING...</div></div>}
        {err&&<div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:12,padding:"14px",color:"#ff8888",fontSize:13}}>{err}</div>}
        {res&&(
          <div>
            <div style={{background:"#0d0d0d",border:"1px solid #222",borderRadius:14,padding:"16px",fontSize:13,lineHeight:1.85,color:"#fff",whiteSpace:"pre-wrap",marginBottom:12,maxHeight:"50vh",overflowY:"auto"}}>{res}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
              <button onClick={()=>{setRes("");setErr("");}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🔄 Redo</button>
              <button onClick={copy} style={{background:copied?"#00d084":cc,border:"none",color:copied?"#000":"#fff",borderRadius:10,padding:"14px",cursor:"pointer",fontSize:15,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN ROSTER PAGE
// ══════════════════════════════════════════════════════
export default function RosterPage() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [view, setView] = useState<"list"|"detail"|"edit"|"maxes"|"progress">("list");
  const [sel, setSel] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newLog, setNewLog] = useState("");
  const [showBook, setShowBook] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [activeTab, setActiveTab] = useState<"info"|"sessions"|"workouts">("info");
  const [bookSaved, setBookSaved] = useState(false);

  useEffect(()=>{
    try{const r=localStorage.getItem(S_ATHLETES);const d=r?JSON.parse(r):DEF_ATHLETES;setAthletes(d.map((a:any)=>({...a,maxes:{...BM,...(a.maxes||{})},progressLog:a.progressLog||[],parentName:a.parentName||"",parentPhone:a.parentPhone||""})));}catch{setAthletes(DEF_ATHLETES.map(a=>({...a,maxes:{...BM},progressLog:[]})));}
    try{const r=localStorage.getItem(S_SESSIONS);if(r)setSessions(JSON.parse(r));}catch{}
    try{const r=localStorage.getItem(S_BOOKINGS);if(r)setBookings(JSON.parse(r));}catch{}
    try{const r=localStorage.getItem(S_COMPLETIONS);if(r)setCompletions(JSON.parse(r));}catch{}
  },[]);

  function persist(data:any[]){setAthletes(data);try{localStorage.setItem(S_ATHLETES,JSON.stringify(data));}catch{}}

  function saveBooking(session:any, booking:any){
    // Save session
    const newSessions=[...sessions,session];
    setSessions(newSessions);
    try{localStorage.setItem(S_SESSIONS,JSON.stringify(newSessions));}catch{}
    // Save booking
    const newBookings=[...bookings,booking];
    setBookings(newBookings);
    try{localStorage.setItem(S_BOOKINGS,JSON.stringify(newBookings));}catch{}
    setBookSaved(true);
    setTimeout(()=>setBookSaved(false),3000);
  }

  function f(k:string,v:any){setForm((p:any)=>({...p,[k]:v}));}
  function fm(k:string,v:any){setForm((p:any)=>({...p,maxes:{...p.maxes,[k]:v}}));}
  function saveEdit(){const u=athletes.map(a=>a.id===sel.id?{...a,...form}:a);persist(u);setSel({...sel,...form});setView("detail");}
  function addLog(){if(!newLog.trim()||!sel)return;const log={text:newLog,date:new Date().toLocaleDateString(),ts:Date.now()};const logs=[log,...(sel.progressLog||[])];const u=athletes.map(a=>a.id===sel.id?{...a,progressLog:logs}:a);persist(u);setSel({...sel,progressLog:logs});setNewLog("");}

  const shown=athletes.filter(a=>(filter==="all"||a.status===filter)&&a.name?.toLowerCase().includes(search.toLowerCase()));
  const urgentCount=athletes.filter(a=>a.status==="urgent").length;

  // Get athlete's sessions
  function getAthleteBookings(athleteId:number){return bookings.filter(b=>b.athleteId===athleteId);}
  function getAthleteUpcoming(athleteId:number){
    const today=todayStr();
    return getAthleteBookings(athleteId)
      .filter(b=>b.bookingStatus==="booked")
      .map(b=>({booking:b,session:sessions.find(s=>s.id===b.sessionId)}))
      .filter(x=>x.session&&x.session.date>=today)
      .sort((a,b)=>(a.session?.date||"").localeCompare(b.session?.date||""));
  }
  function getAthleteHistory(athleteId:number){
    return getAthleteBookings(athleteId)
      .filter(b=>["completed","missed","cancelled"].includes(b.bookingStatus))
      .map(b=>({booking:b,session:sessions.find(s=>s.id===b.sessionId)}))
      .sort((a,b)=>(b.booking.bookedAt||"").localeCompare(a.booking.bookedAt||""))
      .slice(0,10);
  }
  function getAthleteCompletions(athleteId:number){return completions.filter(c=>c.athleteId===athleteId).sort((a,b)=>b.completedAt.localeCompare(a.completedAt));}
  function attendanceRate(athleteId:number){
    const hist=bookings.filter(b=>b.athleteId===athleteId&&["completed","missed"].includes(b.bookingStatus));
    if(!hist.length)return null;
    return Math.round((hist.filter(b=>b.attendanceStatus==="present"||b.attendanceStatus==="late").length/hist.length)*100);
  }

  // ── MAXES ──
  if(view==="maxes"&&sel) return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:60,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setView("detail")} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Back</button>
        <span style={{fontSize:14,fontWeight:800,color:"#1a6eff"}}>📊 PRs & MAXES</span>
        <button onClick={saveEdit} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
      </div>
      <div style={{padding:"20px 16px"}}>
        <div style={{fontSize:18,fontWeight:900,marginBottom:16}}>{sel.name}</div>
        {[{title:"💪 STRENGTH (lbs)",fields:[{l:"Squat 1RM",k:"squat",p:"e.g. 225"},{l:"Bench 1RM",k:"bench",p:"e.g. 185"},{l:"Deadlift",k:"deadlift",p:"e.g. 275"},{l:"Power Clean",k:"powerClean",p:"e.g. 165"},{l:"Hang Clean",k:"hangClean",p:"e.g. 155"}]},{title:"⚡ SPEED & POWER",fields:[{l:"40-Yard Dash",k:"sprint40",p:"e.g. 4.72s"},{l:"Vertical",k:"vertical",p:"e.g. 28in"},{l:"Broad Jump",k:"broadJump",p:"e.g. 8ft 4in"},{l:"Pro Agility",k:"agility",p:"e.g. 4.35s"}]},{title:"🎯 BODYWEIGHT",fields:[{l:"Pull-Ups Max",k:"pullups",p:"e.g. 12"},{l:"Push-Ups Max",k:"pushups",p:"e.g. 35"},{l:"Custom PR",k:"customPR",p:"Any PR"}]}].map(section=>(
          <div key={section.title} style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",marginBottom:10}}>{section.title}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {section.fields.map(field=>(<div key={field.k}><label style={lbl}>{field.l}</label><input value={form.maxes?.[field.k]||""} onChange={e=>fm(field.k,e.target.value)} placeholder={field.p} style={inp}/></div>))}
            </div>
          </div>
        ))}
        <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:12,padding:"12px",fontSize:12,color:"rgba(255,255,255,0.5)"}}>💡 AI uses these for exact DB weights in workout plans.</div>
      </div>
    </main>
  );

  // ── PROGRESS LOG ──
  if(view==="progress"&&sel) return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:60,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setView("detail")} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Back</button>
        <span style={{fontSize:14,fontWeight:800,color:"#00d084"}}>📈 PROGRESS LOG</span>
        <div style={{width:60}}/>
      </div>
      <div style={{padding:"20px 16px"}}>
        <div style={{fontSize:18,fontWeight:900,marginBottom:16}}>{sel.name}</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <input value={newLog} onChange={e=>setNewLog(e.target.value)} placeholder="Add progress note..." style={{...inp,flex:1,marginBottom:0}}/>
          <button onClick={addLog} style={{background:"#00d084",border:"none",color:"#000",borderRadius:10,padding:"0 16px",cursor:"pointer",fontWeight:900,fontSize:13}}>ADD</button>
        </div>
        {(!sel.progressLog||sel.progressLog.length===0)&&<div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.25)",fontSize:13}}>No notes yet.</div>}
        {sel.progressLog?.map((log:any,i:number)=>(<div key={i} style={{background:"#111",border:"1px solid #222",borderRadius:12,padding:"14px",marginBottom:8}}><div style={{fontSize:13,color:"#fff",lineHeight:1.5,marginBottom:4}}>{log.text}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>{log.date}</div></div>))}
      </div>
    </main>
  );

  // ── EDIT ──
  if(view==="edit"&&sel) return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:60,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>{setView("detail");setForm({});}} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Cancel</button>
        <span style={{fontSize:14,fontWeight:800}}>EDIT ATHLETE</span>
        <button onClick={saveEdit} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
      </div>
      <div style={{padding:"20px 16px"}}>
        {[{l:"Name",k:"name"},{l:"Sport",k:"sport"},{l:"Position",k:"position"},{l:"Goal",k:"goal"},{l:"Injuries",k:"injuries"}].map(field=>(<div key={field.k}><label style={lbl}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} style={inp}/></div>))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={lbl}>AGE</label><input value={form.age||""} onChange={e=>f("age",e.target.value)} style={inp}/></div><div><label style={lbl}>WEIGHT (lbs)</label><input value={form.weight||""} onChange={e=>f("weight",e.target.value)} style={inp}/></div></div>
        <label style={lbl}>PARENT NAME</label><input value={form.parentName||""} onChange={e=>f("parentName",e.target.value)} style={inp}/>
        <label style={lbl}>PARENT PHONE</label><input value={form.parentPhone||""} onChange={e=>f("parentPhone",e.target.value)} style={inp}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><div><label style={lbl}>SESSIONS</label><input type="number" value={form.sessions||0} onChange={e=>f("sessions",parseInt(e.target.value)||0)} style={inp}/></div><div><label style={lbl}>FREQ/WK</label><input type="number" value={form.freq||2} onChange={e=>f("freq",parseInt(e.target.value)||2)} style={inp}/></div><div><label style={lbl}>VALUE $</label><input type="number" value={form.value||0} onChange={e=>f("value",parseFloat(e.target.value)||0)} style={inp}/></div></div>
        <label style={lbl}>STATUS</label>
        <select value={form.status||"active"} onChange={e=>f("status",e.target.value)} style={{...inp,marginBottom:12}}>{["active","urgent","inactive"].map(s=><option key={s} value={s}>{s}</option>)}</select>
        <label style={lbl}>NOTES</label><textarea value={form.notes||""} onChange={e=>f("notes",e.target.value)} style={{...inp,height:70,resize:"none" as const}}/>
        <button onClick={()=>setView("maxes")} style={{width:"100%",background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:14,fontWeight:700}}>📊 Edit PRs & Maxes →</button>
      </div>
    </main>
  );

  // ── DETAIL ──
  if(view==="detail"&&sel){
    const s=SC[sel.status]||SC.active;
    const mx=Object.entries(sel.maxes||{}).filter(([,v])=>v);
    const upcoming=getAthleteUpcoming(sel.id);
    const history=getAthleteHistory(sel.id);
    const athleteCompletions=getAthleteCompletions(sel.id);
    const rate=attendanceRate(sel.id);

    return(
      <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Roster</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowAI(true)} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...sel});setView("edit");}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid #333",color:"#fff",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13}}>✏️</button>
          </div>
        </div>

        <div style={{padding:"16px 16px 0"}}>
          {/* Athlete header card */}
          <div style={{background:s.bg,borderLeft:`4px solid ${s.c}`,border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"18px",marginBottom:12}}>
            <div style={{fontSize:24,fontWeight:900,marginBottom:4}}>{sel.name}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{sel.sport}{sel.position?` · ${sel.position}`:""}{sel.age?` · Age ${sel.age}`:""}{sel.weight?` · ${sel.weight}lbs`:""}</div>
            {sel.goal&&<div style={{fontSize:13,color:"#1a6eff",marginTop:4}}>🎯 {sel.goal}</div>}
            {sel.injuries&&<div style={{fontSize:12,color:"#ff4444",marginTop:3}}>⚠️ {sel.injuries}</div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginTop:14}}>
              {[{l:"SESSIONS",v:sel.sessions,c:sel.sessions<=2?"#ff4444":sel.sessions<=5?"#f0c040":"#1a6eff"},{l:"FREQ/WK",v:`${sel.freq}x`,c:"#fff"},{l:"COMPLETED",v:athleteCompletions.length,c:"#00d084"},{l:"ATTEND",v:rate!==null?`${rate}%`:"—",c:rate!==null?(rate>=80?"#00d084":rate>=60?"#f0c040":"#ff4444"):"rgba(255,255,255,0.4)"}].map((item,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:900,color:item.c}}>{item.v}</div>
                  <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginTop:2}}>{item.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── BOOK SESSION BUTTON — PROMINENT ── */}
          {bookSaved&&<div style={{background:"rgba(0,208,132,0.12)",border:"1px solid rgba(0,208,132,0.3)",borderRadius:12,padding:"10px 14px",marginBottom:10,fontSize:13,color:"#00d084",fontWeight:700}}>✅ Session booked! Check Schedule to view.</div>}
          <button
            onClick={()=>setShowBook(true)}
            style={{width:"100%",background:"linear-gradient(135deg,#1a6eff,#0d4fd4)",border:"none",color:"#fff",borderRadius:14,padding:"18px",fontSize:17,fontWeight:900,cursor:"pointer",letterSpacing:"0.04em",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
          >
            <span style={{fontSize:22}}>📅</span>
            BOOK SESSION FOR {sel.name.split(" ")[0].toUpperCase()}
          </button>

          {/* Tabs */}
          <div style={{display:"flex",gap:8,marginBottom:0}}>
            {[{id:"info",l:"📋 Info"},{id:"sessions",l:"📅 Sessions"},{id:"workouts",l:"💪 Workouts"}].map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id as any)} style={{flex:1,padding:"9px 4px",borderRadius:10,background:activeTab===t.id?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${activeTab===t.id?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:activeTab===t.id?"#fff":"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:12,fontWeight:700}}>
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {/* ── INFO TAB ── */}
        {activeTab==="info"&&(
          <div style={{padding:"14px 16px"}}>
            {/* PRs & Maxes */}
            <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:12,padding:"14px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#1a6eff"}}>📊 PRs & MAXES</div>
                <button onClick={()=>{setForm({...sel});setView("maxes");}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>{mx.length>0?"UPDATE":"+ ADD MAXES"}</button>
              </div>
              {mx.length>0?(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{mx.map(([k,v]:any)=>(<div key={k} style={{background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:14,fontWeight:900,color:"#1a6eff"}}>{v}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginTop:2}}>{({squat:"Squat",bench:"Bench",deadlift:"Deadlift",powerClean:"Power Clean",sprint40:"40 Yard",vertical:"Vertical",broadJump:"Broad Jump",agility:"Agility",pullups:"Pull-Ups",pushups:"Push-Ups",hangClean:"Hang Clean",customPR:"Custom PR"} as any)[k]||k}</div></div>))}</div>):(<div style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontStyle:"italic"}}>No maxes yet. Tap ADD MAXES — AI uses these for exact workout weights.</div>)}
            </div>
            {/* Progress Log */}
            <div style={{background:"rgba(0,208,132,0.04)",border:"1px solid rgba(0,208,132,0.15)",borderRadius:12,padding:"14px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#00d084"}}>📈 PROGRESS LOG</div>
                <button onClick={()=>setView("progress")} style={{background:"rgba(0,208,132,0.1)",border:"1px solid rgba(0,208,132,0.25)",color:"#00d084",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>VIEW ALL ({sel.progressLog?.length||0})</button>
              </div>
              {sel.progressLog?.length>0?<div style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.5}}>{sel.progressLog[0].text}</div>:<div style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontStyle:"italic"}}>No notes yet.</div>}
            </div>
            {/* Parent */}
            {(sel.parentName||sel.parentPhone)&&<div style={{background:"#111",border:"1px solid #222",borderRadius:12,padding:"14px",marginBottom:10}}>{sel.parentName&&<div style={{fontSize:14,fontWeight:700}}>{sel.parentName}</div>}{sel.parentPhone&&<div style={{fontSize:13,color:"#1a6eff",marginTop:2}}>{sel.parentPhone}</div>}</div>}
          </div>
        )}

        {/* ── SESSIONS TAB ── */}
        {activeTab==="sessions"&&(
          <div style={{padding:"14px 16px"}}>
            {upcoming.length>0&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"#1a6eff",marginBottom:10}}>📅 UPCOMING ({upcoming.length})</div>
                {upcoming.map(({booking,session})=>session&&(
                  <div key={booking.id} style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.15)",borderRadius:12,padding:"12px",marginBottom:8}}>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{session.title}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{fmtDate(session.date)} · {to12(session.startTime)}–{to12(session.endTime)}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>{session.location}</div>
                  </div>
                ))}
              </div>
            )}
            {history.length>0&&(
              <div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",marginBottom:10}}>🕐 PAST SESSIONS</div>
                {history.map(({booking,session})=>(
                  <div key={booking.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid #222",borderRadius:12,padding:"12px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div><div style={{fontSize:13,fontWeight:700}}>{session?.title||"Session"}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{session?fmtDate(session.date):booking.bookedAt?.split("T")[0]}</div></div>
                      <div style={{display:"flex",gap:4}}>
                        <span style={{fontSize:9,padding:"2px 7px",background:booking.bookingStatus==="completed"?"rgba(0,208,132,0.12)":"rgba(255,68,68,0.1)",color:booking.bookingStatus==="completed"?"#00d084":"#ff8888",borderRadius:4,fontWeight:700,textTransform:"uppercase" as const}}>{booking.bookingStatus}</span>
                      </div>
                    </div>
                    {booking.workoutNotes&&<div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:6,fontStyle:"italic"}}>{booking.workoutNotes}</div>}
                  </div>
                ))}
              </div>
            )}
            {upcoming.length===0&&history.length===0&&(
              <div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.25)",fontSize:13,lineHeight:1.8}}>
                No sessions booked yet.<br/>
                <button onClick={()=>setShowBook(true)} style={{marginTop:14,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13,fontWeight:700}}>📅 Book First Session</button>
              </div>
            )}
          </div>
        )}

        {/* ── WORKOUTS TAB ── */}
        {activeTab==="workouts"&&(
          <div style={{padding:"14px 16px"}}>
            {athleteCompletions.length>0?(
              <div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",marginBottom:12}}>COMPLETED WORKOUTS ({athleteCompletions.length})</div>
                {athleteCompletions.map((c:any,i:number)=>(
                  <div key={i} style={{background:"rgba(0,208,132,0.04)",border:"1px solid rgba(0,208,132,0.12)",borderRadius:12,padding:"14px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{c.workoutType?.toUpperCase()||"WORKOUT"}</div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{c.completedAt?new Date(c.completedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):""}</div>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        {c.effortScore>0&&<span style={{fontSize:10,padding:"2px 7px",background:"rgba(26,110,255,0.12)",color:"#1a6eff",borderRadius:4}}>E:{c.effortScore}</span>}
                        {c.readinessScore>0&&<span style={{fontSize:10,padding:"2px 7px",background:"rgba(0,208,132,0.12)",color:"#00d084",borderRadius:4}}>R:{c.readinessScore}</span>}
                        {c.sorenessScore>0&&<span style={{fontSize:10,padding:"2px 7px",background:"rgba(240,192,64,0.12)",color:"#f0c040",borderRadius:4}}>S:{c.sorenessScore}</span>}
                      </div>
                    </div>
                    {c.coachNotes&&<div style={{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.5}}>{c.coachNotes}</div>}
                    {c.skippedExercises&&<div style={{fontSize:11,color:"#f0c040",marginTop:4}}>Skipped: {c.skippedExercises}</div>}
                  </div>
                ))}
              </div>
            ):(
              <div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.25)",fontSize:13,lineHeight:1.8}}>
                No completed workouts yet.<br/>
                Generate a workout plan and mark it complete<br/>to track this athlete's progress.
                <br/>
                <Link href="/coach/program" style={{textDecoration:"none"}}>
                  <div style={{marginTop:14,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",display:"inline-block",fontSize:13,fontWeight:700}}>📋 Build Workout</div>
                </Link>
              </div>
            )}
          </div>
        )}

        {showBook&&<BookSessionModal athlete={sel} existingSessions={sessions} onSave={saveBooking} onClose={()=>setShowBook(false)}/>}
        {showAI&&<AISheet athlete={sel} onClose={()=>setShowAI(false)}/>}
      </main>
    );
  }

  // ── LIST ──
  return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Link href="/coach/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
            <div><div style={{fontSize:16,fontWeight:800}}>ATHLETE ROSTER</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{athletes.length} athletes{urgentCount>0?` · ${urgentCount} URGENT`:""}</div></div>
          </div>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search athlete..." style={{...inp,marginBottom:10}}/>
        <div style={{display:"flex",gap:8,overflowX:"auto"}}>
          {["all","urgent","active","inactive"].map(fv=>(<button key={fv} onClick={()=>setFilter(fv)} style={{padding:"5px 12px",borderRadius:100,background:filter===fv?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${filter===fv?"#1a6eff":"#333"}`,color:filter===fv?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:"0.08em",cursor:"pointer",whiteSpace:"nowrap" as const,textTransform:"uppercase" as const}}>{fv}</button>))}
        </div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {shown.map(a=>{
          const s=SC[a.status]||SC.active;
          const hasMaxes=a.maxes&&Object.values(a.maxes).some((v:any)=>v);
          const upcoming=getAthleteUpcoming(a.id);
          const comps=getAthleteCompletions(a.id);
          return(
            <div key={a.id} style={{background:"#111",border:"1px solid #222",borderLeft:`4px solid ${s.c}`,borderRadius:12,padding:"14px",marginBottom:8}}>
              <div onClick={()=>{setSel(a);setView("detail");setActiveTab("info");}} style={{cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,marginBottom:2}}>{a.name}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{a.sport}{a.position?` · ${a.position}`:""} · {a.freq}x/wk · {a.sessions} sessions</div>
                  </div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",padding:"3px 8px",background:s.bg,color:s.c,borderRadius:4,textTransform:"uppercase" as const}}>{s.l}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {hasMaxes&&<span style={{fontSize:10,background:"rgba(26,110,255,0.1)",borderRadius:6,padding:"2px 7px",color:"#1a6eff"}}>📊 Maxes</span>}
                {upcoming.length>0&&<span style={{fontSize:10,background:"rgba(0,208,132,0.08)",borderRadius:6,padding:"2px 7px",color:"#00d084"}}>📅 {upcoming.length} upcoming</span>}
                {comps.length>0&&<span style={{fontSize:10,background:"rgba(0,208,132,0.06)",borderRadius:6,padding:"2px 7px",color:"#00d084"}}>💪 {comps.length} done</span>}
                {/* BOOK SESSION button on every card */}
                <button
                  onClick={e=>{e.stopPropagation();setSel(a);setView("detail");setActiveTab("sessions");setTimeout(()=>setShowBook(true),100);}}
                  style={{marginLeft:"auto",fontSize:10,background:"linear-gradient(135deg,rgba(26,110,255,0.2),rgba(26,110,255,0.1))",borderRadius:100,padding:"4px 12px",color:"#1a6eff",fontWeight:700,border:"1px solid rgba(26,110,255,0.35)",cursor:"pointer"}}
                >
                  📅 Book
                </button>
                <button
                  onClick={e=>{e.stopPropagation();setSel(a);setView("detail");setActiveTab("info");setTimeout(()=>setShowAI(true),100);}}
                  style={{fontSize:10,background:"rgba(26,110,255,0.1)",borderRadius:100,padding:"4px 10px",color:"#1a6eff",fontWeight:700,border:"1px solid rgba(26,110,255,0.25)",cursor:"pointer"}}
                >
                  ⚡ AI
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

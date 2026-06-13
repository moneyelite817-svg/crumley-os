"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkoutDisplay, isWorkoutContent } from "../_components/WorkoutDisplay";

// ══════════════════════════════════════════════════════
// STORAGE
// ══════════════════════════════════════════════════════
const S_ATHLETES    = "ct_clients";
const S_SESSIONS    = "ct_sessions_v2";
const S_BOOKINGS    = "ct_bookings_v1";
const S_COMPLETIONS = "ct_workout_completions";

// ══════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════
interface Athlete {
  id: number; name: string; sport: string; position: string; age: string;
  weight: string; phone: string; status: "active"|"urgent"|"inactive";
  sessions: number; freq: number; value: number; goal: string;
  injuries: string; parentName: string; parentPhone: string;
  notes: string; maxes: Record<string,string>; progressLog: any[];
  createdAt?: string;
}

const BLANK_MAXES = {squat:"",bench:"",deadlift:"",powerClean:"",sprint40:"",vertical:"",broadJump:"",agility:"",pullups:"",pushups:"",hangClean:"",customPR:""};

const DEFAULT_ATHLETES: Athlete[] = [
  {id:1,name:"Levi Smith",sport:"General",position:"",age:"",weight:"",phone:"",status:"urgent",sessions:1,freq:2,value:378,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:2,name:"Donovan Edwards",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:33,freq:2,value:2835,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:3,name:"Travis Cheyne",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:48,freq:2,value:0,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:4,name:"Rex Hayes",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:26,freq:2,value:0,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:5,name:"Emiliano Ortiz",sport:"Football",position:"WR",age:"",weight:"",phone:"",status:"inactive",sessions:20,freq:4,value:0,goal:"",injuries:"",parentName:"Anna Ortiz",parentPhone:"",notes:"Mom: Anna Ortiz",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:6,name:"Mateo Ortiz",sport:"Football",position:"",age:"",weight:"",phone:"",status:"inactive",sessions:20,freq:4,value:0,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"Brother of Emiliano",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:7,name:"Noah Langdon",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:4,freq:1,value:367,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:8,name:"Sam Stacy",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:4,freq:1,value:1575,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:9,name:"Cruz Mar",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:13,freq:1,value:1134,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:10,name:"Joaquin Chavez",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:12,freq:2,value:1071,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:11,name:"Lilianna Chavez",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:12,freq:2,value:1071,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:12,name:"Breelan",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:8,freq:2,value:0,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:13,name:"Granger",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:8,freq:2,value:0,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:14,name:"Cody Bevan",sport:"General",position:"",age:"",weight:"",phone:"",status:"urgent",sessions:1,freq:1,value:0,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:15,name:"Joshua Chavis",sport:"General",position:"",age:"",weight:"",phone:"",status:"urgent",sessions:2,freq:2,value:0,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:16,name:"Daniel Chapman",sport:"General",position:"",age:"",weight:"",phone:"",status:"urgent",sessions:2,freq:2,value:0,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:17,name:"Axton Mondragon",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:4,freq:1,value:1575,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:18,name:"Aaliyah Jauregui",sport:"General",position:"",age:"",weight:"",phone:"",status:"urgent",sessions:2,freq:2,value:0,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:19,name:"Jaxson Bowling",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:12,freq:9,value:0,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:20,name:"Jacob Robledo",sport:"General",position:"",age:"",weight:"",phone:"",status:"active",sessions:3,freq:1,value:210,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:21,name:"Quenton Jean",sport:"General",position:"",age:"",weight:"",phone:"",status:"inactive",sessions:0,freq:2,value:0,goal:"",injuries:"",parentName:"Kevin Jean",parentPhone:"",notes:"Contact Kevin (dad)",maxes:{...BLANK_MAXES},progressLog:[]},
];

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════
const D1_DAYS = [2, 3];
const D1_START = "17:45"; const D1_END = "19:45";
function toMin(t:string){const[h,m]=t.split(":").map(Number);return h*60+m;}
function overlaps(s1:string,e1:string,s2:string,e2:string){return toMin(s1)<toMin(e2)&&toMin(e1)>toMin(s2);}
function to12(t:string){if(!t)return"";const[h,m]=t.split(":").map(Number);return`${h%12||12}:${m.toString().padStart(2,"0")} ${h>=12?"PM":"AM"}`;}
function todayStr(){return new Date().toISOString().split("T")[0];}
function fmtDate(d:string){if(!d)return"—";return new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});}
function nextId(athletes:Athlete[]):number{return athletes.length?Math.max(...athletes.map(a=>a.id))+1:1;}

const SC: Record<string,{c:string;bg:string;l:string}> = {
  active:{c:"#1a6eff",bg:"rgba(26,110,255,0.1)",l:"ACTIVE"},
  urgent:{c:"#ff4444",bg:"rgba(255,68,68,0.1)",l:"URGENT"},
  inactive:{c:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)",l:"INACTIVE"},
};

const inp:any={width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10};
const lbl:any={display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:4};
const cardStyle:any={background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px",marginBottom:10};

// ══════════════════════════════════════════════════════
// ADD / EDIT ATHLETE MODAL
// ══════════════════════════════════════════════════════
function AthleteFormModal({initial,onSave,onClose}:{initial?:Partial<Athlete>;onSave:(data:any)=>void;onClose:()=>void;}){
  const isEdit=!!initial?.id;
  const [form,setForm]=useState({name:"",sport:"General",position:"",age:"",weight:"",phone:"",status:"active" as "active"|"urgent"|"inactive",sessions:10,freq:2,value:0,goal:"",injuries:"",parentName:"",parentPhone:"",notes:"",...(initial||{})});
  function f(k:string,v:any){setForm(p=>({...p,[k]:v}));}
  return(
    <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)"}}/>
      <div style={{position:"relative",background:"#0a0a14",borderRadius:"20px 20px 0 0",border:"1px solid rgba(26,110,255,0.3)",padding:"20px 16px 50px",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:900,color:"#1a6eff"}}>{isEdit?"✏️ EDIT ATHLETE":"+ ADD ATHLETE"}</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.5)",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13}}>Cancel</button>
            <button onClick={()=>{if(!form.name.trim()){alert("Name required");return;}onSave(form);}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
          <div><label style={lbl}>NAME *</label><input value={form.name} onChange={e=>f("name",e.target.value)} placeholder="Full name" style={inp}/></div>
          <div><label style={lbl}>STATUS</label><select value={form.status} onChange={e=>f("status",e.target.value)} style={{...inp,marginBottom:0}}>{["active","urgent","inactive"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={lbl}>SPORT</label><select value={form.sport} onChange={e=>f("sport",e.target.value)} style={{...inp,marginBottom:0}}>{["General","Football","Soccer","Basketball","Baseball","Track","Volleyball","Wrestling","Other"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
          <div><label style={lbl}>POSITION</label><input value={form.position} onChange={e=>f("position",e.target.value)} placeholder="WR, QB…" style={{...inp,marginBottom:0}}/></div>
        </div>
        <div style={{height:10}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <div><label style={lbl}>AGE</label><input value={form.age} onChange={e=>f("age",e.target.value)} placeholder="16" style={inp}/></div>
          <div><label style={lbl}>WEIGHT (lbs)</label><input value={form.weight} onChange={e=>f("weight",e.target.value)} placeholder="175" style={inp}/></div>
          <div><label style={lbl}>PHONE</label><input value={form.phone||""} onChange={e=>f("phone",e.target.value)} placeholder="(214)…" style={inp}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <div><label style={lbl}>SESSIONS LEFT</label><input type="number" value={form.sessions} onChange={e=>f("sessions",parseInt(e.target.value)||0)} style={inp}/></div>
          <div><label style={lbl}>FREQ/WEEK</label><input type="number" value={form.freq} onChange={e=>f("freq",parseInt(e.target.value)||1)} style={inp}/></div>
          <div><label style={lbl}>VALUE $</label><input type="number" value={form.value} onChange={e=>f("value",parseFloat(e.target.value)||0)} style={inp}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={lbl}>PARENT NAME</label><input value={form.parentName} onChange={e=>f("parentName",e.target.value)} placeholder="Parent name" style={inp}/></div>
          <div><label style={lbl}>PARENT PHONE</label><input value={form.parentPhone} onChange={e=>f("parentPhone",e.target.value)} placeholder="(214)…" style={inp}/></div>
        </div>
        <label style={lbl}>GOAL</label><input value={form.goal} onChange={e=>f("goal",e.target.value)} placeholder="D1 scholarship, speed improvement…" style={inp}/>
        <label style={lbl}>INJURIES / LIMITATIONS</label><input value={form.injuries} onChange={e=>f("injuries",e.target.value)} placeholder="Any injuries or restrictions…" style={inp}/>
        <label style={lbl}>NOTES</label><textarea value={form.notes} onChange={e=>f("notes",e.target.value)} placeholder="Anything else…" style={{...inp,height:60,resize:"none" as const,marginBottom:0}}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// BOOK SESSION MODAL
// ══════════════════════════════════════════════════════
function BookSessionModal({athlete,existingSessions,onSave,onClose}:{athlete:Athlete;existingSessions:any[];onSave:(s:any,b:any)=>void;onClose:()=>void;}){
  const ST=[{id:"private",icon:"👤",label:"Private Training",max:1},{id:"group_small",icon:"👥",label:"Small Group",max:4},{id:"assessment",icon:"📊",label:"Assessment",max:2},{id:"program_review",icon:"📋",label:"Program Review",max:2}];
  const [type,setType]=useState("private");
  const [date,setDate]=useState(todayStr());
  const [start,setStart]=useState("10:00");
  const [end,setEnd]=useState("11:00");
  const [location,setLocation]=useState("D1 Training Hulen Fort Worth");
  const [notes,setNotes]=useState("");
  const [conflicts,setConflicts]=useState<string[]>([]);
  const [checked,setChecked]=useState(false);
  const [booked,setBooked]=useState(false);
  const inp2:any={width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box"};

  function check(){const c:string[]=[];const day=new Date(date+"T12:00:00").getDay();if(D1_DAYS.includes(day)&&overlaps(start,end,D1_START,D1_END))c.push("🔒 D1 Training LOCKED 5:45–7:45 PM — pick another time.");existingSessions.forEach(s=>{if(s.date===date&&overlaps(start,end,s.startTime,s.endTime))c.push(`⚠️ Conflicts with "${s.title}" at ${to12(s.startTime)}–${to12(s.endTime)}`);});setConflicts(c);setChecked(true);return c;}
  function save(){const c=check();if(c.some(x=>x.startsWith("🔒")||x.startsWith("⚠️")))return;const id=`s-${Date.now()}`;const session={id,sessionType:type,title:`${athlete.name} — ${ST.find(t=>t.id===type)?.label}`,date,startTime:start,endTime:end,maxAthletes:ST.find(t=>t.id===type)?.max||1,location,price:25,notes,isLocked:false,isCompleted:false,coachNotes:"",createdAt:new Date().toISOString()};const booking={id:`b-${Date.now()}-${athlete.id}`,sessionId:id,athleteId:athlete.id,athleteName:athlete.name,athleteSport:athlete.sport,athleteStatus:athlete.status,sessionsRemaining:athlete.sessions,bookingStatus:"booked",attendanceStatus:"pending",effortScore:0,readinessScore:0,sorenessScore:0,coachNotes:"",workoutNotes:"",sessionsDeducted:false,bookedAt:new Date().toISOString(),completedAt:""};onSave(session,booking);setBooked(true);setTimeout(()=>{onClose();},1200);}
  const isD1Day=D1_DAYS.includes(new Date(date+"T12:00:00").getDay());

  return(
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)"}}/>
      <div style={{position:"relative",background:"#0a0a14",borderRadius:"20px 20px 0 0",border:"1px solid rgba(26,110,255,0.3)",padding:"20px 16px 50px",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><div style={{fontSize:16,fontWeight:900,color:"#1a6eff"}}>📅 BOOK SESSION</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>Elite Skillz Lab 🧪</div></div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13}}>✕</button>
        </div>
        <div style={{background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",borderRadius:12,padding:"12px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"#1a6eff",marginBottom:4}}>🔒 ATHLETE</div>
            <div style={{fontSize:17,fontWeight:900}}>{athlete.name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{athlete.sport}{athlete.position?` · ${athlete.position}`:""}</div>
            {athlete.injuries&&<div style={{fontSize:11,color:"#f0c040",marginTop:3}}>⚠️ {athlete.injuries}</div>}
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:900,color:athlete.sessions<=2?"#ff4444":athlete.sessions<=5?"#f0c040":"#1a6eff"}}>{athlete.sessions}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em"}}>SESSIONS LEFT</div>
          </div>
        </div>
        {checked&&conflicts.length>0&&conflicts.map((c,i)=><div key={i} style={{background:"rgba(255,68,68,0.1)",border:"1px solid rgba(255,68,68,0.25)",borderRadius:10,padding:"10px 12px",marginBottom:8,fontSize:13,color:"#ff8888"}}>{c}</div>)}
        {checked&&conflicts.length===0&&<div style={{background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.25)",borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:13,color:"#00d084",fontWeight:700}}>✅ Schedule is clear!</div>}
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:8}}>SESSION TYPE</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {ST.map(t=><div key={t.id} onClick={()=>setType(t.id)} style={{background:type===t.id?"rgba(26,110,255,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${type===t.id?"rgba(26,110,255,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:10,padding:"12px 10px",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>{t.icon}</div><div style={{fontSize:12,fontWeight:700,color:type===t.id?"#1a6eff":"rgba(255,255,255,0.7)"}}>{t.label}</div></div>)}
        </div>
        <label style={lbl}>DATE</label><input type="date" value={date} onChange={e=>{setDate(e.target.value);setChecked(false);}} style={inp2}/>
        {isD1Day&&<div style={{fontSize:11,color:"#1a6eff",marginTop:-6,marginBottom:10,fontWeight:700}}>🔒 D1 locked 5:45–7:45 PM on this day</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:8}}>
          <div><label style={lbl}>START TIME</label><input type="time" value={start} onChange={e=>{setStart(e.target.value);setChecked(false);}} style={inp2}/></div>
          <div><label style={lbl}>END TIME</label><input type="time" value={end} onChange={e=>{setEnd(e.target.value);setChecked(false);}} style={inp2}/></div>
        </div>
        <div style={{marginTop:10}}><label style={lbl}>LOCATION</label><input value={location} onChange={e=>setLocation(e.target.value)} style={inp2}/></div>
        <div style={{marginTop:10,marginBottom:16}}><label style={lbl}>NOTES</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Session notes…" style={{...inp2,height:50,resize:"none" as const}}/></div>
        <button onClick={save} style={{width:"100%",background:booked?"#00d084":"#1a6eff",border:"none",color:booked?"#000":"#fff",borderRadius:14,padding:"17px",fontSize:16,fontWeight:900,cursor:"pointer"}}>{booked?"✓ SESSION BOOKED!":"📅 CHECK & BOOK SESSION"}</button>
        <div style={{textAlign:"center",marginTop:8,fontSize:11,color:"rgba(255,255,255,0.25)"}}>Appears on Schedule after booking</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// AI QUICK SHEET
// ── KEY CHANGE: workout skill removed (use program page)
// ── KEY CHANGE: WorkoutDisplay used when result is workout
// ══════════════════════════════════════════════════════
function QuickAISheet({athlete,onClose}:{athlete:Athlete;onClose:()=>void}){
  const router=useRouter();

  // ── SKILLS — no workout generation here (that goes to /coach/program) ──
  const QUICK=[
    {id:"renewal",    icon:"💰",label:"Renewal Pitch"},
    {id:"parentUpdate",icon:"👨‍👩‍👦",label:"Parent Update"},
    {id:"reEngage",   icon:"🔁",label:"Re-Engage"},
    {id:"sessionRecap",icon:"📝",label:"Session Recap"},
    {id:"progressReport",icon:"📈",label:"Progress Report"},
    {id:"instaAthlete",icon:"📸",label:"IG Spotlight"},
    {id:"milestone",  icon:"🎉",label:"Milestone"},
    {id:"combineReady",icon:"🎯",label:"Combine Readiness"},
  ];

  const [sel,setSel]=useState<string|null>(null);
  const [res,setRes]=useState("");
  const [load,setLoad]=useState(false);
  const [err,setErr]=useState("");
  const [copied,setCopied]=useState(false);

  const mx=Object.entries(athlete.maxes||{}).filter(([,v])=>v).map(([k,v])=>`${k}:${v}`).join("|");
  const ctx=`Coach T — Elite Skillz Lab 🧪 | D1 Hulen FW | ATHLETE: ${athlete.name} | ${athlete.sport||"General"} | ${athlete.position||""} | Sessions:${athlete.sessions} | ${athlete.freq}x/wk | Parent:${athlete.parentName||"N/A"} | Goal:${athlete.goal||"athletic development"} | Injuries:${athlete.injuries||"none"} | Maxes:${mx||"not recorded"}`;

  const PROMPTS:Record<string,string>={
    renewal:`${ctx}\n${athlete.sessions} sessions left. Confident renewal pitch to ${athlete.parentName||"parent/athlete"}. Coach not salesman. Under 5 sentences.`,
    parentUpdate:`${ctx}\nParent text to ${athlete.parentName||"parent"}: 1 strength win, 1 movement improvement, 1 character note, next focus. Under 6 sentences.`,
    reEngage:`${ctx}\nRe-engagement to ${athlete.parentName||"parent/athlete"}. Genuine. Noticed absence. Availability question. Under 4 sentences.`,
    sessionRecap:`${ctx}\nSession recap to ${athlete.parentName||"parent"}. What was trained, what stood out, one next focus. Under 4 sentences.`,
    progressReport:`${ctx}\n4-week progress report. Strength, speed, attitude, improvements, gaps. Professional.`,
    instaAthlete:`${ctx}\nIG spotlight — no last name. Grind+improvement. Coach T voice. #EliteSkillzLab #D1Training #DFWAthletes + 2 sport hashtags.`,
    milestone:`${ctx}\nCelebration message — athlete hit a milestone. Enthusiastic, momentum-building. Under 4 sentences.`,
    combineReady:`${ctx}\nCombine readiness: ${athlete.sport} — ${athlete.position||"athlete"}. Maxes:${mx||"not recorded"}. D1/D2/D3 comparison. Timeline. Gap to close.`,
  };

  async function run(){
    if(!sel)return;setLoad(true);setRes("");setErr("");
    try{const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:PROMPTS[sel]||ctx})});const d=await r.json();if(d.error)setErr(d.message||d.error);else setRes(d.text);}
    catch{setErr("Network error.");}
    setLoad(false);
  }
  function copy(){navigator.clipboard?.writeText(res);setCopied(true);setTimeout(()=>setCopied(false),2000);}
  const isWorkout=res&&isWorkoutContent(res);

  return(
    <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)"}}/>
      <div style={{position:"relative",background:"#0a0a14",borderRadius:"20px 20px 0 0",border:"1px solid rgba(26,110,255,0.3)",padding:"20px 16px 50px",maxHeight:"93vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><div style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>⚡ AI AGENT</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{athlete.name}</div></div>
          <button onClick={()=>{if(sel&&res){setSel(null);setRes("");setErr("");}else onClose();}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13}}>{sel&&res?"← Back":"✕"}</button>
        </div>

        {/* Context strip */}
        <div style={{background:"rgba(26,110,255,0.08)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:10,padding:"10px",marginBottom:14,display:"flex",gap:10}}>
          {[{l:"SESSIONS",v:athlete.sessions},{l:"FREQ",v:`${athlete.freq}x`},{l:"STATUS",v:(athlete.status||"active").toUpperCase()},{l:"SPORT",v:athlete.sport||"General"}].map((s,i)=>(
            <div key={i} style={{flex:1,textAlign:"center"}}><div style={{fontSize:13,fontWeight:900,color:"#1a6eff"}}>{s.v}</div><div style={{fontSize:8,color:"rgba(255,255,255,0.3)",marginTop:1}}>{s.l}</div></div>
          ))}
        </div>

        {/* ── WORKOUT BUTTON — prominent, routes to program page ── */}
        <div onClick={()=>{try{localStorage.setItem("cros_program_athlete",JSON.stringify(athlete));}catch{}router.push("/coach/program");}} style={{background:"linear-gradient(135deg,rgba(0,208,132,0.15),rgba(0,208,132,0.08))",border:"1px solid rgba(0,208,132,0.3)",borderRadius:12,padding:"14px",marginBottom:14,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:900,color:"#00d084"}}>💪 Generate Workout Plan</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Single session · 1-week · 4-week · 8-week program</div>
            <div style={{fontSize:10,color:"rgba(0,208,132,0.6)",marginTop:3}}>Premium card display with Save + Mark Complete</div>
          </div>
          <span style={{color:"#00d084",fontSize:20}}>›</span>
        </div>

        {/* Communication + content skills */}
        {!sel&&!res&&(
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase" as const,marginBottom:10}}>COMMUNICATIONS & CONTENT</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {QUICK.map(q=>(
                <div key={q.id} onClick={()=>setSel(q.id)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"13px 10px",cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{q.icon}</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#1a6eff"}}>{q.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sel&&!res&&!load&&(
          <div>
            <div style={{background:"rgba(26,110,255,0.08)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:700,color:"#1a6eff"}}>{QUICK.find(q=>q.id===sel)?.icon} {QUICK.find(q=>q.id===sel)?.label}</div>
            </div>
            <button onClick={run} style={{width:"100%",background:"#1a6eff",border:"none",color:"#fff",borderRadius:12,padding:"16px",fontSize:16,fontWeight:900,cursor:"pointer"}}>⚡ GENERATE</button>
          </div>
        )}

        {load&&(
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>⚙️</div>
            <div style={{fontSize:14,fontWeight:800,color:"#1a6eff",letterSpacing:"0.1em"}}>GENERATING...</div>
          </div>
        )}

        {err&&<div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10,padding:"14px",color:"#ff8888",fontSize:13}}>{err}</div>}

        {res&&(
          <div>
            {/* ── KEY CHANGE: WorkoutDisplay for workout content, plain text otherwise ── */}
            {isWorkout ? (
              <div style={{marginBottom:12}}>
                <WorkoutDisplay text={res} compact={true}/>
              </div>
            ) : (
              <div style={{background:"#0d0d0d",border:"1px solid #222",borderRadius:14,padding:"16px",fontSize:14,lineHeight:1.85,color:"#fff",whiteSpace:"pre-wrap",marginBottom:12,maxHeight:"45vh",overflowY:"auto"}}>
                {res}
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
              <button onClick={()=>{setRes("");setErr("");setSel(null);}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"13px",cursor:"pointer",fontSize:13,fontWeight:700}}>🔄 Redo</button>
              <button onClick={copy} style={{background:copied?"#00d084":"#1a6eff",border:"none",color:copied?"#000":"#fff",borderRadius:10,padding:"13px",cursor:"pointer",fontSize:14,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
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
  const router=useRouter();
  const [athletes,setAthletes]=useState<Athlete[]>([]);
  const [sessions,setSessions]=useState<any[]>([]);
  const [bookings,setBookings]=useState<any[]>([]);
  const [completions,setCompletions]=useState<any[]>([]);
  const [view,setView]=useState<"list"|"detail">("list");
  const [sel,setSel]=useState<Athlete|null>(null);
  const [tab,setTab]=useState<"info"|"sessions"|"workouts">("info");
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [newLog,setNewLog]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [showEdit,setShowEdit]=useState(false);
  const [showBook,setShowBook]=useState(false);
  const [showAI,setShowAI]=useState(false);
  const [bookConfirm,setBookConfirm]=useState(false);

  useEffect(()=>{
    try{const r=localStorage.getItem(S_ATHLETES);const d=r?JSON.parse(r):DEFAULT_ATHLETES;setAthletes(d.map((a:any)=>({...a,maxes:{...BLANK_MAXES,...(a.maxes||{})},progressLog:a.progressLog||[],parentName:a.parentName||"",parentPhone:a.parentPhone||"",phone:a.phone||""})));}
    catch{setAthletes(DEFAULT_ATHLETES.map(a=>({...a,maxes:{...BLANK_MAXES},progressLog:[]})));}
    try{const r=localStorage.getItem(S_SESSIONS);if(r)setSessions(JSON.parse(r));}catch{}
    try{const r=localStorage.getItem(S_BOOKINGS);if(r)setBookings(JSON.parse(r));}catch{}
    try{const r=localStorage.getItem(S_COMPLETIONS);if(r)setCompletions(JSON.parse(r));}catch{}
  },[]);

  function persist(data:Athlete[]){setAthletes(data);try{localStorage.setItem(S_ATHLETES,JSON.stringify(data));}catch{}}
  function saveSessions(data:any[]){setSessions(data);try{localStorage.setItem(S_SESSIONS,JSON.stringify(data));}catch{}}
  function saveBookings(data:any[]){setBookings(data);try{localStorage.setItem(S_BOOKINGS,JSON.stringify(data));}catch{}}

  function addAthlete(data:any){const a={...data,id:nextId(athletes),maxes:{...BLANK_MAXES},progressLog:[],createdAt:new Date().toISOString()};persist([...athletes,a]);setShowAdd(false);}
  function editAthlete(data:any){if(!sel)return;const u=athletes.map(a=>a.id===sel.id?{...a,...data}:a);persist(u);setSel({...sel,...data});setShowEdit(false);}
  function deleteAthlete(id:number){if(!confirm(`Delete ${sel?.name}?`))return;persist(athletes.filter(a=>a.id!==id));setView("list");setSel(null);}
  function addLog(){if(!newLog.trim()||!sel)return;const log={text:newLog,date:new Date().toLocaleDateString(),ts:Date.now()};const logs=[log,...(sel.progressLog||[])];persist(athletes.map(a=>a.id===sel.id?{...a,progressLog:logs}:a));setSel({...sel,progressLog:logs});setNewLog("");}
  function handleBook(session:any,booking:any){saveSessions([...sessions,session]);saveBookings([...bookings,booking]);setBookConfirm(true);setTimeout(()=>setBookConfirm(false),3000);}

  function upcomingSessions(id:number){const t=todayStr();return bookings.filter(b=>b.athleteId===id&&b.bookingStatus==="booked").map(b=>({b,s:sessions.find(s=>s.id===b.sessionId)})).filter(x=>x.s&&x.s.date>=t).sort((a,b)=>(a.s?.date||"").localeCompare(b.s?.date||""));}
  function pastSessions(id:number){return bookings.filter(b=>b.athleteId===id&&["completed","missed","cancelled"].includes(b.bookingStatus)).map(b=>({b,s:sessions.find(s=>s.id===b.sessionId)})).sort((a,b)=>b.b.bookedAt.localeCompare(a.b.bookedAt)).slice(0,15);}
  function athleteCompletions(id:number){return completions.filter(c=>c.athleteId===id).sort((a:any,b:any)=>b.completedAt.localeCompare(a.completedAt));}
  function attendanceRate(id:number){const h=bookings.filter(b=>b.athleteId===id&&["completed","missed"].includes(b.bookingStatus));if(!h.length)return null;return Math.round((h.filter(b=>["present","late"].includes(b.attendanceStatus)).length/h.length)*100);}

  const shown=athletes.filter(a=>(filter==="all"||a.status===filter)&&a.name?.toLowerCase().includes(search.toLowerCase()));
  const urgentCount=athletes.filter(a=>a.status==="urgent").length;

  // ── DETAIL VIEW ──
  if(view==="detail"&&sel){
    const s=SC[sel.status]||SC.active;
    const up=upcomingSessions(sel.id);
    const past=pastSessions(sel.id);
    const comps=athleteCompletions(sel.id);
    const rate=attendanceRate(sel.id);
    const mx=Object.entries(sel.maxes||{}).filter(([,v])=>v);

    return(
      <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("list");setSel(null);setTab("info");}} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Roster</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowEdit(true)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid #333",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:13}}>✏️ Edit</button>
            <button onClick={()=>deleteAthlete(sel.id)} style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:13}}>🗑</button>
          </div>
        </div>
        <div style={{padding:"14px 16px 0"}}>
          <div style={{background:s.bg,borderLeft:`4px solid ${s.c}`,border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"16px",marginBottom:12}}>
            <div style={{fontSize:24,fontWeight:900,marginBottom:4}}>{sel.name}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{sel.sport}{sel.position?` · ${sel.position}`:""}{sel.age?` · Age ${sel.age}`:""}{sel.weight?` · ${sel.weight}lbs`:""}</div>
            {sel.goal&&<div style={{fontSize:13,color:"#1a6eff",marginTop:4}}>🎯 {sel.goal}</div>}
            {sel.injuries&&<div style={{fontSize:12,color:"#ff4444",marginTop:3}}>⚠️ {sel.injuries}</div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:14}}>
              {[{l:"SESSIONS",v:sel.sessions,c:sel.sessions<=2?"#ff4444":sel.sessions<=5?"#f0c040":"#1a6eff"},{l:"FREQ/WK",v:`${sel.freq}x`,c:"#fff"},{l:"DONE",v:comps.length,c:"#00d084"},{l:"ATTEND",v:rate!==null?`${rate}%`:"—",c:rate!==null?(rate>=80?"#00d084":rate>=60?"#f0c040":"#ff4444"):"rgba(255,255,255,0.35)"}].map((item,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:900,color:item.c}}>{item.v}</div>
                  <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginTop:2}}>{item.l}</div>
                </div>
              ))}
            </div>
          </div>

          {bookConfirm&&<div style={{background:"rgba(0,208,132,0.12)",border:"1px solid rgba(0,208,132,0.3)",borderRadius:12,padding:"10px 14px",marginBottom:10,fontSize:13,color:"#00d084",fontWeight:700}}>✅ Session booked — visible on Schedule</div>}

          {/* Primary actions */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <button onClick={()=>setShowBook(true)} style={{background:"linear-gradient(135deg,#1a6eff,#0d4fd4)",border:"none",color:"#fff",borderRadius:12,padding:"16px",cursor:"pointer",fontSize:14,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><span style={{fontSize:18}}>📅</span> BOOK SESSION</button>
            <button onClick={()=>{try{localStorage.setItem("cros_program_athlete",JSON.stringify(sel));}catch{}router.push("/coach/program");}} style={{background:"rgba(0,208,132,0.12)",border:"1px solid rgba(0,208,132,0.3)",color:"#00d084",borderRadius:12,padding:"16px",cursor:"pointer",fontSize:14,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><span style={{fontSize:18}}>💪</span> WORKOUT</button>
          </div>
          <button onClick={()=>setShowAI(true)} style={{width:"100%",background:"rgba(26,110,255,0.08)",border:"1px solid rgba(26,110,255,0.2)",color:"#1a6eff",borderRadius:12,padding:"12px",cursor:"pointer",fontSize:14,fontWeight:700,marginBottom:12}}>⚡ AI — Messages · Reports · Content</button>

          {/* Tabs */}
          <div style={{display:"flex",gap:8}}>
            {[{id:"info",l:"📋 Info"},{id:"sessions",l:"📅 Sessions"},{id:"workouts",l:"💪 Workouts"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id as any)} style={{flex:1,padding:"9px 4px",borderRadius:10,background:tab===t.id?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${tab===t.id?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:tab===t.id?"#fff":"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:12,fontWeight:700}}>{t.l}</button>
            ))}
          </div>
        </div>

        {tab==="info"&&(
          <div style={{padding:"14px 16px"}}>
            <div style={{...cardStyle,border:"1px solid rgba(26,110,255,0.2)",background:"rgba(26,110,255,0.04)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#1a6eff"}}>📊 PRs & MAXES</div>
                <button onClick={()=>{try{localStorage.setItem("cros_program_athlete",JSON.stringify(sel));}catch{}router.push("/coach/program");}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>{mx.length?"UPDATE":"+ ADD"}</button>
              </div>
              {mx.length>0?(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {mx.map(([k,v]:any)=>(
                    <div key={k} style={{background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:14,fontWeight:900,color:"#1a6eff"}}>{v}</div>
                      <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",marginTop:2}}>
                        {({squat:"Squat",bench:"Bench",deadlift:"Deadlift",powerClean:"Power Clean",sprint40:"40 Yard",vertical:"Vertical",broadJump:"Broad Jump",agility:"Agility",pullups:"Pull-Ups",pushups:"Push-Ups",hangClean:"Hang Clean",customPR:"Custom PR"} as any)[k]||k}
                      </div>
                    </div>
                  ))}
                </div>
              ):<div style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontStyle:"italic"}}>No maxes yet. Add so AI can prescribe exact DB weights.</div>}
            </div>
            {(sel.parentName||sel.parentPhone||sel.phone)&&(
              <div style={cardStyle}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)",marginBottom:8}}>PARENT / CONTACT</div>
                {sel.parentName&&<div style={{fontSize:14,fontWeight:700}}>{sel.parentName}</div>}
                {sel.parentPhone&&<div style={{fontSize:13,color:"#1a6eff",marginTop:2}}>{sel.parentPhone}</div>}
                {sel.phone&&<div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:2}}>Athlete: {sel.phone}</div>}
              </div>
            )}
            <div style={{...cardStyle,border:"1px solid rgba(0,208,132,0.15)",background:"rgba(0,208,132,0.03)"}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"#00d084",marginBottom:8}}>📈 PROGRESS LOG</div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input value={newLog} onChange={e=>setNewLog(e.target.value)} placeholder="Add progress note…" style={{...inp,flex:1,marginBottom:0}}/>
                <button onClick={addLog} style={{background:"#00d084",border:"none",color:"#000",borderRadius:8,padding:"0 14px",cursor:"pointer",fontWeight:900,fontSize:13,flexShrink:0}}>ADD</button>
              </div>
              {sel.progressLog?.slice(0,3).map((log:any,i:number)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px",marginBottom:6}}>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.7)",lineHeight:1.5,marginBottom:2}}>{log.text}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>{log.date}</div>
                </div>
              ))||<div style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontStyle:"italic"}}>No notes yet.</div>}
            </div>
            {sel.notes&&<div style={cardStyle}><div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.3)",marginBottom:6}}>NOTES</div><div style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>{sel.notes}</div></div>}
          </div>
        )}

        {tab==="sessions"&&(
          <div style={{padding:"14px 16px"}}>
            {up.length>0&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"#1a6eff",marginBottom:10}}>📅 UPCOMING ({up.length})</div>
                {up.map(({b,s})=>s&&(
                  <div key={b.id} style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.15)",borderRadius:12,padding:"12px",marginBottom:8}}>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{s.title}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{fmtDate(s.date)} · {to12(s.startTime)}–{to12(s.endTime)}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>{s.location}</div>
                  </div>
                ))}
              </div>
            )}
            {past.length>0&&(
              <div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",marginBottom:10}}>🕐 PAST</div>
                {past.map(({b,s})=>(
                  <div key={b.id} style={{...cardStyle,marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <div><div style={{fontSize:13,fontWeight:700}}>{s?.title||"Session"}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{s?fmtDate(s.date):""}</div></div>
                      <span style={{fontSize:10,padding:"2px 8px",background:b.bookingStatus==="completed"?"rgba(0,208,132,0.12)":"rgba(255,68,68,0.1)",color:b.bookingStatus==="completed"?"#00d084":"#ff8888",borderRadius:4,fontWeight:700,height:"fit-content",alignSelf:"center",textTransform:"uppercase"}}>{b.bookingStatus}</span>
                    </div>
                    {b.workoutNotes&&<div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginTop:6,fontStyle:"italic"}}>{b.workoutNotes}</div>}
                  </div>
                ))}
              </div>
            )}
            {up.length===0&&past.length===0&&(
              <div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.25)",fontSize:13,lineHeight:1.8}}>
                No sessions yet.<br/>
                <button onClick={()=>setShowBook(true)} style={{marginTop:14,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13,fontWeight:700}}>📅 Book First Session</button>
              </div>
            )}
          </div>
        )}

        {tab==="workouts"&&(
          <div style={{padding:"14px 16px"}}>
            <button onClick={()=>{try{localStorage.setItem("cros_program_athlete",JSON.stringify(sel));}catch{}router.push("/coach/program");}} style={{width:"100%",background:"linear-gradient(135deg,#00d084,#009960)",border:"none",color:"#000",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:14,fontWeight:900,marginBottom:16}}>💪 Build New Workout Plan</button>
            {comps.length>0?(
              <div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",marginBottom:12}}>COMPLETED WORKOUTS ({comps.length})</div>
                {comps.map((c:any,i:number)=>(
                  <div key={i} style={{...cardStyle,border:"1px solid rgba(0,208,132,0.12)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div><div style={{fontSize:14,fontWeight:700}}>{(c.workoutType||"SESSION").toUpperCase()}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{c.completedAt?new Date(c.completedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):""}</div></div>
                      <div style={{display:"flex",gap:4}}>
                        {c.effortScore>0&&<span style={{fontSize:10,padding:"2px 8px",background:"rgba(26,110,255,0.12)",color:"#1a6eff",borderRadius:100}}>E:{c.effortScore}</span>}
                        {c.readinessScore>0&&<span style={{fontSize:10,padding:"2px 8px",background:"rgba(0,208,132,0.12)",color:"#00d084",borderRadius:100}}>R:{c.readinessScore}</span>}
                        {c.sorenessScore>0&&<span style={{fontSize:10,padding:"2px 8px",background:"rgba(240,192,64,0.12)",color:"#f0c040",borderRadius:100}}>S:{c.sorenessScore}</span>}
                      </div>
                    </div>
                    {c.coachNotes&&<div style={{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.5}}>{c.coachNotes}</div>}
                    {c.skippedExercises&&<div style={{fontSize:11,color:"#f0c040",marginTop:4}}>Skipped: {c.skippedExercises}</div>}
                  </div>
                ))}
              </div>
            ):(
              <div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.25)",fontSize:13,lineHeight:1.8}}>No completed workouts yet.</div>
            )}
          </div>
        )}

        {showBook&&<BookSessionModal athlete={sel} existingSessions={sessions} onSave={handleBook} onClose={()=>setShowBook(false)}/>}
        {showAI&&<QuickAISheet athlete={sel} onClose={()=>setShowAI(false)}/>}
        {showEdit&&<AthleteFormModal initial={sel} onSave={editAthlete} onClose={()=>setShowEdit(false)}/>}
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
          <button onClick={()=>setShowAdd(true)} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"9px 16px",cursor:"pointer",fontSize:14,fontWeight:900,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>+</span> ADD</button>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search athlete…" style={{...inp,marginBottom:10}}/>
        <div style={{display:"flex",gap:8,overflowX:"auto"}}>
          {["all","urgent","active","inactive"].map(fv=>(
            <button key={fv} onClick={()=>setFilter(fv)} style={{padding:"5px 12px",borderRadius:100,background:filter===fv?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${filter===fv?"#1a6eff":"#333"}`,color:filter===fv?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:"0.08em",cursor:"pointer",whiteSpace:"nowrap",textTransform:"uppercase"}}>
              {fv}{fv==="urgent"&&urgentCount>0?` (${urgentCount})`:""}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {shown.length===0&&(
          <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.25)",fontSize:14,lineHeight:1.8}}>
            {search?"No athletes match.":"No athletes yet."}<br/>
            <button onClick={()=>setShowAdd(true)} style={{marginTop:16,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13,fontWeight:700}}>+ Add First Athlete</button>
          </div>
        )}
        {shown.map(a=>{
          const s=SC[a.status]||SC.active;
          const up=upcomingSessions(a.id);
          const comps=athleteCompletions(a.id);
          const hasMaxes=a.maxes&&Object.values(a.maxes).some((v:any)=>v);
          return(
            <div key={a.id} style={{background:"#111",border:"1px solid #222",borderLeft:`4px solid ${s.c}`,borderRadius:12,padding:"14px",marginBottom:8}}>
              <div onClick={()=>{setSel(a);setView("detail");setTab("info");}} style={{cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,marginBottom:2}}>{a.name}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{a.sport}{a.position?` · ${a.position}`:""} · {a.freq}x/wk · {a.sessions} sessions</div>
                    {a.injuries&&<div style={{fontSize:11,color:"#f0c040",marginTop:2}}>⚠️ {a.injuries}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",padding:"3px 8px",background:s.bg,color:s.c,borderRadius:4,textTransform:"uppercase"}}>{s.l}</div>
                    {a.sessions<=3&&a.status!=="inactive"&&<div style={{fontSize:9,color:"#ff4444",fontWeight:700}}>⚠️ Renew soon</div>}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {hasMaxes&&<span style={{fontSize:10,background:"rgba(26,110,255,0.1)",borderRadius:6,padding:"2px 7px",color:"#1a6eff"}}>📊 Maxes</span>}
                {up.length>0&&<span style={{fontSize:10,background:"rgba(0,208,132,0.08)",borderRadius:6,padding:"2px 7px",color:"#00d084"}}>📅 {up.length} booked</span>}
                {comps.length>0&&<span style={{fontSize:10,background:"rgba(0,208,132,0.06)",borderRadius:6,padding:"2px 7px",color:"#00d084"}}>💪 {comps.length} done</span>}
                <button onClick={e=>{e.stopPropagation();setSel(a);setView("detail");setTimeout(()=>setShowBook(true),50);}} style={{marginLeft:"auto",fontSize:10,background:"linear-gradient(135deg,rgba(26,110,255,0.2),rgba(26,110,255,0.1))",borderRadius:100,padding:"4px 12px",color:"#1a6eff",fontWeight:700,border:"1px solid rgba(26,110,255,0.35)",cursor:"pointer"}}>📅 Book</button>
                <button onClick={e=>{e.stopPropagation();setSel(a);setView("detail");setTimeout(()=>setShowAI(true),50);}} style={{fontSize:10,background:"rgba(26,110,255,0.1)",borderRadius:100,padding:"4px 10px",color:"#1a6eff",fontWeight:700,border:"1px solid rgba(26,110,255,0.25)",cursor:"pointer"}}>⚡ AI</button>
              </div>
            </div>
          );
        })}
      </div>
      {showAdd&&<AthleteFormModal onSave={addAthlete} onClose={()=>setShowAdd(false)}/>}
    </main>
  );
}

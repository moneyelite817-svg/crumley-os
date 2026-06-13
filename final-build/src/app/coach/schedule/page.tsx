"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ══════════════════════════════════════════════════════
// DATA TYPES — matches Supabase schema exactly
// ══════════════════════════════════════════════════════
interface Athlete {
  id: number; name: string; sport: string; position: string;
  age: string; weight: string; status: string; sessions: number;
  freq: number; goal: string; injuries: string;
  parentName: string; parentPhone: string; maxes: Record<string,string>;
  progressLog: {text:string;date:string;ts:number}[];
}

interface ScheduleSession {
  id: string;
  sessionType: "private"|"group_small"|"group_large"|"d1_group"|"assessment"|"program_review";
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  maxAthletes: number;
  location: string;
  price: number;
  notes: string;
  isLocked: boolean;
  isCompleted: boolean;
  coachNotes: string;
  createdAt: string;
}

interface SessionBooking {
  id: string;
  sessionId: string;
  athleteId: number;
  athleteName: string;
  athleteSport: string;
  athleteStatus: string;
  sessionsRemaining: number;
  bookingStatus: "booked"|"completed"|"missed"|"cancelled";
  attendanceStatus: "pending"|"present"|"absent"|"late"|"excused";
  effortScore: number;
  readinessScore: number;
  sorenessScore: number;
  coachNotes: string;
  workoutNotes: string;
  sessionsDeducted: boolean;
  bookedAt: string;
  completedAt: string;
}

// ══════════════════════════════════════════════════════
// STORAGE KEYS
// ══════════════════════════════════════════════════════
const S_ATHLETES = "ct_clients";
const S_SESSIONS = "ct_sessions_v2";
const S_BOOKINGS = "ct_bookings_v1";

const SESSION_TYPES: {id:ScheduleSession["sessionType"];label:string;icon:string;max:number;color:string;desc:string}[] = [
  { id:"private",      label:"Private Training",    icon:"👤", max:1,   color:"#1a6eff", desc:"1-on-1 session" },
  { id:"group_small",  label:"Small Group",          icon:"👥", max:4,   color:"#00d084", desc:"2-4 athletes" },
  { id:"group_large",  label:"Large Group",          icon:"🏟", max:12,  color:"#4a8fff", desc:"5-12 athletes" },
  { id:"d1_group",     label:"D1 Group Class",       icon:"🔒", max:30,  color:"#1a6eff", desc:"D1 locked block" },
  { id:"assessment",   label:"Assessment/Testing",   icon:"📊", max:2,   color:"#f0c040", desc:"PR testing, eval" },
  { id:"program_review",label:"Program Review",      icon:"📋", max:2,   color:"#9b59b6", desc:"Plan & consult" },
];

const D1_LOCKED_DAYS = [2, 3]; // Tuesday, Wednesday
const D1_START = "17:45";
const D1_END   = "19:45";

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════
function toMin(t: string) { const [h,m] = t.split(":").map(Number); return h*60+m; }
function overlap(s1:string,e1:string,s2:string,e2:string) { return toMin(s1)<toMin(e2)&&toMin(e1)>toMin(s2); }
function to12(t: string) {
  if(!t) return "";
  const [h,m]=t.split(":").map(Number);
  return `${h%12||12}:${m.toString().padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}
function todayStr() { return new Date().toISOString().split("T")[0]; }
function formatDateLabel(d: string) {
  const date = new Date(d+"T12:00:00");
  return date.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});
}
function durationMin(s: string, e: string) { return toMin(e)-toMin(s); }
function statusColor(s: string) {
  return {present:"#00d084",absent:"#ff4444",late:"#f0c040",excused:"rgba(255,255,255,0.4)",pending:"rgba(255,255,255,0.3)"}[s]||"#fff";
}
function bookingStatusColor(s: string) {
  return {booked:"#1a6eff",completed:"#00d084",missed:"#ff4444",cancelled:"rgba(255,255,255,0.3)"}[s]||"#fff";
}
function initials(name: string) {
  return name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
}

// ══════════════════════════════════════════════════════
// ATHLETE AVATAR
// ══════════════════════════════════════════════════════
function Avatar({ athlete, size=36, selected=false }: { athlete:Athlete; size?:number; selected?:boolean }) {
  const sc = athlete.status==="urgent"?"#ff4444":athlete.status==="inactive"?"rgba(255,255,255,0.3)":"#1a6eff";
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`${sc}22`, border:`2px solid ${selected?"#00d084":sc}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:size*0.33, fontWeight:700, color:sc }}>
      {initials(athlete.name)}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// ATHLETE SELECTOR SHEET
// ══════════════════════════════════════════════════════
function AthleteSelector({
  athletes, maxSelect, selected, sessions, existingBookings, sessionDate, sessionStart, sessionEnd,
  onConfirm, onClose
}: {
  athletes: Athlete[]; maxSelect: number; selected: number[]; sessions: ScheduleSession[];
  existingBookings: SessionBooking[]; sessionDate: string; sessionStart: string; sessionEnd: string;
  onConfirm: (ids: number[]) => void; onClose: () => void;
}) {
  const [sel, setSel] = useState<number[]>(selected);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  function isAlreadyBooked(athleteId: number): string|null {
    const sessionDay = new Date(sessionDate+"T12:00:00").getDay();
    const conflict = sessions.find(sess => {
      if(sess.date !== sessionDate) return false;
      if(!overlap(sessionStart, sessionEnd, sess.startTime, sess.endTime)) return false;
      return existingBookings.some(b => b.sessionId===sess.id && b.athleteId===athleteId && b.bookingStatus!=="cancelled");
    });
    return conflict ? `${to12(conflict.startTime)}–${to12(conflict.endTime)}` : null;
  }

  const shown = athletes
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    .filter(a => filter==="all" || a.status===filter)
    .sort((a,b) => {
      if(a.status==="urgent"&&b.status!=="urgent") return -1;
      if(b.status==="urgent"&&a.status!=="urgent") return 1;
      return a.name.localeCompare(b.name);
    });

  const canAdd = sel.length < maxSelect;
  const inp: any = {width:"100%",padding:"9px 12px",background:"#0d0d0d",border:"1px solid #333",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:13,outline:"none",boxSizing:"border-box"};

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)"}}/>
      <div style={{position:"relative",background:"#0a0a14",borderRadius:"20px 20px 0 0",border:"1px solid rgba(26,110,255,0.3)",padding:"20px 16px 50px",maxHeight:"92vh",display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>SELECT ATHLETES</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>
              {sel.length}/{maxSelect} selected · {maxSelect===1?"Private session":"Group session"}
            </div>
          </div>
          <button onClick={()=>onConfirm(sel)} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"10px 18px",cursor:"pointer",fontSize:14,fontWeight:900}}>
            CONFIRM ({sel.length})
          </button>
        </div>

        {/* Selected athletes strip */}
        {sel.length > 0 && (
          <div style={{display:"flex",gap:8,marginBottom:12,overflowX:"auto",paddingBottom:4}}>
            {sel.map(id => {
              const a = athletes.find(x=>x.id===id);
              if(!a) return null;
              return(
                <div key={id} onClick={()=>setSel(s=>s.filter(x=>x!==id))} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",borderRadius:100,padding:"4px 10px 4px 4px",cursor:"pointer",whiteSpace:"nowrap" as const,flexShrink:0}}>
                  <Avatar athlete={a} size={24}/>
                  <span style={{fontSize:11,fontWeight:700,color:"#1a6eff"}}>{a.name.split(" ")[0]}</span>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>✕</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Search + filter */}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search athlete..." style={{...inp,marginBottom:8}}/>
        <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto"}}>
          {["all","urgent","active","inactive"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:100,background:filter===f?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${filter===f?"#1a6eff":"#333"}`,color:filter===f?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" as const,textTransform:"uppercase" as const}}>
              {f}
            </button>
          ))}
        </div>

        {/* Athlete list */}
        <div style={{overflowY:"auto",flex:1}}>
          {shown.map(a => {
            const isSel = sel.includes(a.id);
            const conflict = isAlreadyBooked(a.id);
            const sc = a.status==="urgent"?"#ff4444":a.status==="inactive"?"rgba(255,255,255,0.3)":"#1a6eff";
            const canSelect = isSel || (canAdd && !conflict);
            return (
              <div key={a.id}
                onClick={()=>{
                  if(!canSelect) return;
                  if(isSel) setSel(s=>s.filter(x=>x!==a.id));
                  else if(maxSelect===1) setSel([a.id]);
                  else setSel(s=>[...s,a.id]);
                }}
                style={{background:isSel?"rgba(26,110,255,0.12)":conflict?"rgba(255,68,68,0.05)":"rgba(255,255,255,0.02)",border:`1px solid ${isSel?"rgba(26,110,255,0.4)":conflict?"rgba(255,68,68,0.2)":"#222"}`,borderRadius:12,padding:"12px",marginBottom:8,cursor:canSelect?"pointer":"not-allowed",opacity:conflict&&!isSel?0.5:1}}
              >
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <Avatar athlete={a} size={42} selected={isSel}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                      <span style={{fontSize:15,fontWeight:700}}>{a.name}</span>
                      {isSel && <span style={{fontSize:12,color:"#00d084",fontWeight:700}}>✓</span>}
                    </div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>
                      {a.sport}{a.position?` · ${a.position}`:""}{a.age?` · Age ${a.age}`:""}
                    </div>
                    {a.injuries && <div style={{fontSize:11,color:"#f0c040",marginTop:2}}>⚠️ {a.injuries}</div>}
                    {conflict && <div style={{fontSize:11,color:"#ff4444",marginTop:2}}>🚫 Already booked {conflict}</div>}
                  </div>
                  <div style={{textAlign:"right" as const,flexShrink:0}}>
                    <div style={{fontSize:14,fontWeight:900,color:a.sessions<=2?"#ff4444":a.sessions<=5?"#f0c040":"#1a6eff"}}>{a.sessions}</div>
                    <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em"}}>SESSIONS</div>
                    <div style={{fontSize:9,padding:"2px 6px",background:`${sc}22`,color:sc,borderRadius:4,fontWeight:700,textTransform:"uppercase" as const,marginTop:4}}>{a.status}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// SESSION COMPLETE FLOW
// ══════════════════════════════════════════════════════
function CompleteSessionSheet({
  session, bookings, athletes, onSave, onClose
}: {
  session: ScheduleSession; bookings: SessionBooking[]; athletes: Athlete[];
  onSave: (updates: SessionBooking[], coachNotes: string) => void; onClose: ()=>void;
}) {
  const [bState, setBState] = useState<SessionBooking[]>(bookings.map(b=>({...b})));
  const [coachNotes, setCoachNotes] = useState(session.coachNotes||"");

  function update(id: string, k: keyof SessionBooking, v: any) {
    setBState(prev => prev.map(b => b.id===id ? {...b,[k]:v} : b));
  }

  const inp2: any = {width:"100%",padding:"9px 12px",background:"#0d0d0d",border:"1px solid #333",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:13,outline:"none",boxSizing:"border-box"};

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)"}}/>
      <div style={{position:"relative",background:"#0a0a14",borderRadius:"20px 20px 0 0",border:"1px solid rgba(0,208,132,0.3)",padding:"20px 16px 50px",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:"#00d084"}}>✓ COMPLETE SESSION</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{session.title} · {formatDateLabel(session.date)}</div>
          </div>
          <button onClick={()=>onSave(bState,coachNotes)} style={{background:"#00d084",border:"none",color:"#000",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:900}}>SAVE ✓</button>
        </div>

        {bState.map(b => {
          const athlete = athletes.find(a=>a.id===b.athleteId);
          return (
            <div key={b.id} style={{background:"rgba(255,255,255,0.03)",border:"1px solid #222",borderRadius:14,padding:"14px",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                {athlete && <Avatar athlete={athlete} size={38}/>}
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700}}>{b.athleteName}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{b.athleteSport} · {b.sessionsRemaining} sessions remaining</div>
                </div>
              </div>

              {/* Attendance */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:6}}>ATTENDANCE</div>
                <div style={{display:"flex",gap:8}}>
                  {(["present","absent","late","excused"] as const).map(s=>(
                    <button key={s} onClick={()=>{update(b.id,"attendanceStatus",s);update(b.id,"bookingStatus",s==="present"||s==="late"?"completed":"missed");}} style={{flex:1,padding:"8px 4px",borderRadius:8,background:b.attendanceStatus===s?`${statusColor(s)}25`:"rgba(255,255,255,0.04)",border:`1px solid ${b.attendanceStatus===s?statusColor(s):"#333"}`,color:b.attendanceStatus===s?statusColor(s):"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:10,fontWeight:700,textTransform:"capitalize" as const}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scores */}
              {(b.attendanceStatus==="present"||b.attendanceStatus==="late") && (
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                    {[{l:"EFFORT",k:"effortScore"},{l:"READINESS",k:"readinessScore"},{l:"SORENESS",k:"sorenessScore"}].map(sc=>(
                      <div key={sc.k}>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)",marginBottom:4}}>{sc.l} (1-10)</div>
                        <input type="number" min="1" max="10" value={(b as any)[sc.k]||""}
                          onChange={e=>update(b.id,sc.k as keyof SessionBooking,parseInt(e.target.value)||0)}
                          style={{...inp2,textAlign:"center" as const}}/>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)",marginBottom:4}}>WORKOUT NOTES</div>
                    <textarea value={b.workoutNotes||""} onChange={e=>update(b.id,"workoutNotes",e.target.value)} placeholder="What was trained, PRs hit, form notes..." style={{...inp2,height:55,resize:"none" as const}}/>
                  </div>
                </div>
              )}

              {/* Deduct sessions */}
              {(b.attendanceStatus==="present"||b.attendanceStatus==="late")&&!b.sessionsDeducted && (
                <div style={{background:"rgba(240,192,64,0.08)",border:"1px solid rgba(240,192,64,0.2)",borderRadius:8,padding:"8px 10px",marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#f0c040"}}>Deduct 1 session (→ {b.sessionsRemaining-1} remaining)</span>
                  <button onClick={()=>update(b.id,"sessionsDeducted",true)} style={{background:"#f0c040",border:"none",color:"#000",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>DEDUCT</button>
                </div>
              )}
              {b.sessionsDeducted && <div style={{fontSize:11,color:"#00d084",marginTop:6,fontWeight:700}}>✓ Session deducted</div>}
            </div>
          );
        })}

        <div>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:6}}>COACH NOTES FOR THIS SESSION</div>
          <textarea value={coachNotes} onChange={e=>setCoachNotes(e.target.value)} placeholder="Overall session notes, what to work on next, observations..." style={{...inp2,height:80,resize:"none" as const}}/>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN SCHEDULE PAGE
// ══════════════════════════════════════════════════════
export default function CoachSchedulePage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [bookings, setBookings] = useState<SessionBooking[]>([]);
  const [view, setView] = useState<"week"|"add"|"detail"|"history">("week");
  const [selSession, setSelSession] = useState<ScheduleSession|null>(null);
  const [selAthlete, setSelAthlete] = useState<Athlete|null>(null);
  const [selDay, setSelDay] = useState<string>(todayStr());
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAthleteSelector, setShowAthleteSelector] = useState(false);
  const [showCompleteSheet, setShowCompleteSheet] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCopied, setAiCopied] = useState(false);

  // Form state
  const blankForm = { sessionType:"private" as ScheduleSession["sessionType"], title:"", date:selDay, startTime:"10:00", endTime:"11:00", maxAthletes:1, location:"D1 Training Hulen", price:25, notes:"", selectedAthletes:[] as number[] };
  const [form, setForm] = useState<typeof blankForm>({...blankForm});
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [conflictChecked, setConflictChecked] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(()=>{
    try{ const r=localStorage.getItem(S_ATHLETES); if(r){ const p=JSON.parse(r); if(Array.isArray(p)) setAthletes(p); }}catch{}
    try{ const r=localStorage.getItem(S_SESSIONS); if(r) setSessions(JSON.parse(r)); else seedD1Sessions(); }catch{ seedD1Sessions(); }
    try{ const r=localStorage.getItem(S_BOOKINGS); if(r) setBookings(JSON.parse(r)); }catch{}
  },[]);

  function seedD1Sessions() {
    const seed: ScheduleSession[] = [];
    for(let w=0;w<8;w++) {
      [2,3].forEach(dn => {
        const d=new Date(); d.setDate(d.getDate()+(dn-d.getDay()+w*7));
        if(d>=new Date()) seed.push({ id:`d1-${dn}-${w}`, sessionType:"d1_group", title:"D1 Group Training", date:d.toISOString().split("T")[0], startTime:"17:45", endTime:"19:45", maxAthletes:30, location:"D1 Training Hulen Fort Worth", price:0, notes:"2 group classes — LOCKED", isLocked:true, isCompleted:false, coachNotes:"", createdAt:new Date().toISOString() });
      });
    }
    persistSessions(seed);
  }

  function persistSessions(data: ScheduleSession[]) { setSessions(data); try{localStorage.setItem(S_SESSIONS,JSON.stringify(data));}catch{} }
  function persistBookings(data: SessionBooking[]) { setBookings(data); try{localStorage.setItem(S_BOOKINGS,JSON.stringify(data));}catch{} }
  function persistAthletes(data: Athlete[]) { setAthletes(data); try{localStorage.setItem(S_ATHLETES,JSON.stringify(data));}catch{} }

  function f(k:string,v:any){ setForm(p=>({...p,[k]:v})); setConflictChecked(false); }

  // Get bookings for a session
  function sessionBookings(sessionId: string) { return bookings.filter(b=>b.sessionId===sessionId&&b.bookingStatus!=="cancelled"); }
  function sessionCapacity(sess: ScheduleSession) { return `${sessionBookings(sess.id).length}/${sess.maxAthletes}`; }
  function sessionFull(sess: ScheduleSession) { return sessionBookings(sess.id).length >= sess.maxAthletes; }

  // Get athlete's sessions
  function athleteUpcoming(athleteId: number) {
    const today = todayStr();
    return bookings
      .filter(b=>b.athleteId===athleteId&&b.bookingStatus==="booked"&&sessions.find(s=>s.id===b.sessionId&&s.date>=today))
      .sort((a,b)=>{ const sa=sessions.find(s=>s.id===a.sessionId),sb=sessions.find(s=>s.id===b.sessionId); return (sa?.date||"").localeCompare(sb?.date||""); });
  }
  function athleteHistory(athleteId: number) {
    const today = todayStr();
    return bookings
      .filter(b=>b.athleteId===athleteId&&["completed","missed","cancelled"].includes(b.bookingStatus))
      .sort((a,b)=>b.bookedAt.localeCompare(a.bookedAt))
      .slice(0,20);
  }
  function attendanceRate(athleteId: number) {
    const hist = bookings.filter(b=>b.athleteId===athleteId&&["completed","missed"].includes(b.bookingStatus));
    if(!hist.length) return null;
    const present = hist.filter(b=>b.attendanceStatus==="present"||b.attendanceStatus==="late").length;
    return Math.round((present/hist.length)*100);
  }

  // Check conflicts
  function checkConflicts() {
    const c: string[] = [];
    const date = new Date(form.date+"T12:00:00");
    const day = date.getDay();
    if(D1_LOCKED_DAYS.includes(day) && overlap(form.startTime,form.endTime,D1_START,D1_END))
      c.push("🔒 CONFLICT: D1 Training is LOCKED 5:45–7:45 PM on this day.");
    sessions.forEach(s=>{
      if(s.date===form.date&&overlap(form.startTime,form.endTime,s.startTime,s.endTime))
        c.push(`⚠️ CONFLICT: "${s.title}" is already ${to12(s.startTime)}–${to12(s.endTime)} on this date.`);
    });
    form.selectedAthletes.forEach(aid=>{
      const a=athletes.find(x=>x.id===aid);
      if(!a)return;
      const ab=bookings.find(b=>b.athleteId===aid&&b.bookingStatus==="booked");
      if(ab){const as2=sessions.find(s=>s.id===ab.sessionId);if(as2&&as2.date===form.date&&overlap(form.startTime,form.endTime,as2.startTime,as2.endTime))c.push(`🏃 CONFLICT: ${a.name} is already booked at ${to12(as2.startTime)}–${to12(as2.endTime)}.`);}
    });
    setConflicts(c);
    if(!c.filter(x=>x.includes("CONFLICT:")).length){const dur=toMin(form.endTime)-toMin(form.startTime);const avail:string[]=[];for(let h=7;h<=20;h++)for(let m=0;m<60;m+=30){const st=`${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`;const em=h*60+m+dur;if(em>20*60)break;const et=`${Math.floor(em/60).toString().padStart(2,"0")}:${(em%60).toString().padStart(2,"0")}`;const bad=sessions.some(s=>s.date===form.date&&overlap(st,et,s.startTime,s.endTime))||(D1_LOCKED_DAYS.includes(new Date(form.date+"T12:00:00").getDay())&&overlap(st,et,D1_START,D1_END));if(!bad)avail.push(`${to12(st)}–${to12(et)}`);}setSuggestions(avail.slice(0,5));}
    setConflictChecked(true);
    return c;
  }

  function saveSession() {
    const hardConflicts = conflicts.filter(x=>x.includes("CONFLICT:"));
    if(hardConflicts.length) return;
    const sess: ScheduleSession = { ...form, id:Date.now().toString(), isLocked:false, isCompleted:false, coachNotes:"", createdAt:new Date().toISOString() };
    persistSessions([...sessions,sess]);
    // Create bookings for selected athletes
    const newBookings: SessionBooking[] = form.selectedAthletes.map(aid=>{
      const a=athletes.find(x=>x.id===aid)!;
      return { id:`b-${Date.now()}-${aid}`, sessionId:sess.id, athleteId:aid, athleteName:a.name, athleteSport:a.sport, athleteStatus:a.status, sessionsRemaining:a.sessions, bookingStatus:"booked", attendanceStatus:"pending", effortScore:0, readinessScore:0, sorenessScore:0, coachNotes:"", workoutNotes:"", sessionsDeducted:false, bookedAt:new Date().toISOString(), completedAt:"" };
    });
    if(newBookings.length) persistBookings([...bookings,...newBookings]);
    setForm({...blankForm,date:selDay});
    setConflicts([]);
    setSuggestions([]);
    setConflictChecked(false);
    setView("week");
  }

  function completeSession(updates: SessionBooking[], coachNotes: string) {
    if(!selSession) return;
    // Update bookings
    const updated = bookings.map(b=>{const u=updates.find(x=>x.id===b.id);return u?{...u,completedAt:new Date().toISOString()}:b;});
    persistBookings(updated);
    // Deduct sessions from athletes
    const deducted = updates.filter(u=>u.sessionsDeducted&&!bookings.find(b=>b.id===u.id&&b.sessionsDeducted));
    if(deducted.length){
      const updatedAthletes=athletes.map(a=>{const d=deducted.find(b=>b.athleteId===a.id);return d?{...a,sessions:Math.max(0,a.sessions-1)}:a;});
      persistAthletes(updatedAthletes);
    }
    // Mark session completed
    persistSessions(sessions.map(s=>s.id===selSession.id?{...s,isCompleted:true,coachNotes}:s));
    setShowCompleteSheet(false);
    setView("week");
    setSelSession(null);
  }

  async function runAI(prompt: string) {
    setAiLoading(true); setAiResult("");
    try{const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});const d=await r.json();if(d.error)setAiResult("Error: "+d.message);else setAiResult(d.text);}catch{setAiResult("Network error.");}
    setAiLoading(false);
  }

  // Week dates
  const today2 = new Date();
  const sun = new Date(today2); sun.setDate(today2.getDate()-today2.getDay()+weekOffset*7);
  const weekDates = Array.from({length:7},(_,i)=>{ const d=new Date(sun); d.setDate(sun.getDate()+i); return d; });
  const DAYS=["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const FDAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  // ── ATHLETE HISTORY VIEW ──
  if(view==="history"&&selAthlete){
    const upcoming=athleteUpcoming(selAthlete.id);
    const history=athleteHistory(selAthlete.id);
    const rate=attendanceRate(selAthlete.id);
    const sc=selAthlete.status==="urgent"?"#ff4444":selAthlete.status==="inactive"?"rgba(255,255,255,0.3)":"#1a6eff";
    return(
      <main style={{minHeight:"100vh",background:"#000",paddingBottom:60,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("week");setSelAthlete(null);}} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Schedule</button>
          <span style={{fontSize:13,fontWeight:700}}>SESSION HISTORY</span>
          <div style={{width:60}}/>
        </div>
        <div style={{padding:"20px 16px"}}>
          <div style={{background:`${sc}15`,border:`1px solid ${sc}33`,borderRadius:14,padding:"18px",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
              <Avatar athlete={selAthlete} size={52}/>
              <div>
                <div style={{fontSize:22,fontWeight:900}}>{selAthlete.name}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{selAthlete.sport}{selAthlete.position?` · ${selAthlete.position}`:""}</div>
                {selAthlete.injuries&&<div style={{fontSize:12,color:"#f0c040",marginTop:3}}>⚠️ {selAthlete.injuries}</div>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[{l:"SESSIONS LEFT",v:selAthlete.sessions,c:selAthlete.sessions<=2?"#ff4444":selAthlete.sessions<=5?"#f0c040":"#1a6eff"},{l:"UPCOMING",v:upcoming.length,c:"#1a6eff"},{l:"ATTENDANCE",v:rate!==null?`${rate}%`:"—",c:"#00d084"}].map((s2,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"10px",textAlign:"center" as const}}>
                  <div style={{fontSize:18,fontWeight:900,color:s2.c}}>{s2.v}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em",marginTop:2}}>{s2.l}</div>
                </div>
              ))}
            </div>
          </div>

          {upcoming.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"#1a6eff",marginBottom:10}}>📅 UPCOMING SESSIONS</div>
              {upcoming.map(b=>{const sess=sessions.find(s=>s.id===b.sessionId);if(!sess)return null;return(
                <div key={b.id} style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.15)",borderRadius:12,padding:"12px",marginBottom:8}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{sess.title}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{formatDateLabel(sess.date)} · {to12(sess.startTime)}–{to12(sess.endTime)}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>{sess.location}</div>
                </div>
              );})}
            </div>
          )}

          {history.length>0&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",marginBottom:10}}>📋 SESSION HISTORY</div>
              {history.map(b=>{const sess=sessions.find(s=>s.id===b.sessionId);return(
                <div key={b.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid #222",borderRadius:12,padding:"12px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                    <div><div style={{fontSize:13,fontWeight:700}}>{sess?.title||"Session"}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{sess?formatDateLabel(sess.date):b.bookedAt.split("T")[0]}</div></div>
                    <div style={{display:"flex",gap:6}}>
                      <span style={{fontSize:10,padding:"2px 8px",background:`${bookingStatusColor(b.bookingStatus)}22`,color:bookingStatusColor(b.bookingStatus),borderRadius:4,fontWeight:700,textTransform:"uppercase" as const}}>{b.bookingStatus}</span>
                      {b.attendanceStatus!=="pending"&&<span style={{fontSize:10,padding:"2px 8px",background:`${statusColor(b.attendanceStatus)}22`,color:statusColor(b.attendanceStatus),borderRadius:4,fontWeight:700,textTransform:"capitalize" as const}}>{b.attendanceStatus}</span>}
                    </div>
                  </div>
                  {(b.effortScore>0||b.readinessScore>0)&&(
                    <div style={{display:"flex",gap:8,marginTop:4}}>
                      {b.effortScore>0&&<span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Effort: {b.effortScore}/10</span>}
                      {b.readinessScore>0&&<span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Readiness: {b.readinessScore}/10</span>}
                    </div>
                  )}
                  {b.workoutNotes&&<div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:6,lineHeight:1.4}}>{b.workoutNotes}</div>}
                </div>
              );})}
            </div>
          )}
          {history.length===0&&upcoming.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.25)",fontSize:13}}>No session history yet.</div>}
        </div>
      </main>
    );
  }

  // ── SESSION DETAIL ──
  if(view==="detail"&&selSession){
    const sb=sessionBookings(selSession.id);
    const typeInfo=SESSION_TYPES.find(t=>t.id===selSession.sessionType);
    const bc=typeInfo?.color||"#1a6eff";
    const booked=sb.length;
    const max=selSession.maxAthletes;
    return(
      <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("week");setSelSession(null);}} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Schedule</button>
          <div style={{display:"flex",gap:8}}>
            {!selSession.isLocked&&!selSession.isCompleted&&sb.length>0&&(
              <button onClick={()=>setShowCompleteSheet(true)} style={{background:"#00d084",border:"none",color:"#000",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ Complete</button>
            )}
            {!selSession.isLocked&&!selSession.isCompleted&&!sessionFull(selSession)&&(
              <button onClick={()=>setShowAthleteSelector(true)} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>+ Add</button>
            )}
          </div>
        </div>
        <div style={{padding:"20px 16px"}}>
          <div style={{background:`${bc}15`,border:`1px solid ${bc}33`,borderLeft:`4px solid ${bc}`,borderRadius:14,padding:"18px",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontSize:21,fontWeight:900,marginBottom:4}}>{selSession.title}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{formatDateLabel(selSession.date)} · {to12(selSession.startTime)}–{to12(selSession.endTime)}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:2}}>{selSession.location}</div>
              </div>
              <div style={{textAlign:"right" as const}}>
                <div style={{fontSize:22,fontWeight:900,color:booked>=max?"#ff4444":booked>0?"#f0c040":"rgba(255,255,255,0.3)"}}>{booked}/{max}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em"}}>BOOKED</div>
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <span style={{fontSize:11,padding:"3px 10px",background:`${bc}22`,color:bc,borderRadius:100,fontWeight:700}}>{typeInfo?.icon} {typeInfo?.label}</span>
              {selSession.isLocked&&<span style={{fontSize:11,padding:"3px 10px",background:"rgba(26,110,255,0.12)",color:"#1a6eff",borderRadius:100,fontWeight:700}}>🔒 LOCKED</span>}
              {selSession.isCompleted&&<span style={{fontSize:11,padding:"3px 10px",background:"rgba(0,208,132,0.12)",color:"#00d084",borderRadius:100,fontWeight:700}}>✓ COMPLETED</span>}
              {selSession.price>0&&<span style={{fontSize:11,padding:"3px 10px",background:"rgba(26,110,255,0.1)",color:"#1a6eff",borderRadius:100,fontWeight:700}}>${selSession.price}/session</span>}
            </div>
          </div>

          {sb.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",marginBottom:10}}>BOOKED ATHLETES ({sb.length})</div>
              {sb.map(b=>{
                const a=athletes.find(x=>x.id===b.athleteId);
                return(
                  <div key={b.id} onClick={()=>{if(a){setSelAthlete(a);setView("history");}}} style={{background:"#111",border:"1px solid #222",borderRadius:12,padding:"12px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                    {a&&<Avatar athlete={a} size={40}/>}
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{b.athleteName}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{b.athleteSport}{a?.position?` · ${a.position}`:""} · {b.sessionsRemaining} sessions left</div>
                      {a?.injuries&&<div style={{fontSize:11,color:"#f0c040",marginTop:2}}>⚠️ {a.injuries}</div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column" as const,alignItems:"flex-end",gap:4}}>
                      <span style={{fontSize:10,padding:"2px 8px",background:`${bookingStatusColor(b.bookingStatus)}22`,color:bookingStatusColor(b.bookingStatus),borderRadius:4,fontWeight:700,textTransform:"uppercase" as const}}>{b.bookingStatus}</span>
                      {b.attendanceStatus!=="pending"&&<span style={{fontSize:10,padding:"2px 8px",background:`${statusColor(b.attendanceStatus)}22`,color:statusColor(b.attendanceStatus),borderRadius:4,fontWeight:700,textTransform:"capitalize" as const}}>{b.attendanceStatus}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {sb.length===0&&!selSession.isLocked&&(
            <div style={{textAlign:"center",padding:"30px 0",color:"rgba(255,255,255,0.3)",fontSize:13}}>
              No athletes booked yet.<br/>
              <button onClick={()=>setShowAthleteSelector(true)} style={{marginTop:12,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13,fontWeight:700}}>+ Book Athletes</button>
            </div>
          )}
          {selSession.coachNotes&&(
            <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid #222",borderRadius:12,padding:"14px"}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.3)",marginBottom:6}}>COACH NOTES</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>{selSession.coachNotes}</div>
            </div>
          )}
        </div>

        {showAthleteSelector&&(
          <AthleteSelector athletes={athletes} maxSelect={selSession.maxAthletes} selected={sb.map(b=>b.athleteId)} sessions={sessions} existingBookings={bookings} sessionDate={selSession.date} sessionStart={selSession.startTime} sessionEnd={selSession.endTime}
            onConfirm={newIds=>{
              const existing=sb.map(b=>b.athleteId);
              const toAdd=newIds.filter(id=>!existing.includes(id));
              const newB: SessionBooking[]=toAdd.map(aid=>{const a=athletes.find(x=>x.id===aid)!;return{id:`b-${Date.now()}-${aid}`,sessionId:selSession.id,athleteId:aid,athleteName:a.name,athleteSport:a.sport,athleteStatus:a.status,sessionsRemaining:a.sessions,bookingStatus:"booked",attendanceStatus:"pending",effortScore:0,readinessScore:0,sorenessScore:0,coachNotes:"",workoutNotes:"",sessionsDeducted:false,bookedAt:new Date().toISOString(),completedAt:""};});
              persistBookings([...bookings,...newB]);
              setShowAthleteSelector(false);
            }}
            onClose={()=>setShowAthleteSelector(false)}
          />
        )}
        {showCompleteSheet&&(
          <CompleteSessionSheet session={selSession} bookings={sb} athletes={athletes} onSave={completeSession} onClose={()=>setShowCompleteSheet(false)}/>
        )}
      </main>
    );
  }

  // ── ADD SESSION ──
  if(view==="add"){
    const typeInfo=SESSION_TYPES.find(t=>t.id===form.sessionType);
    const hardConflicts=conflicts.filter(x=>x.includes("CONFLICT:"));
    const warnings=conflicts.filter(x=>x.includes("WARNING:")||x.includes("CONFLICT:")===false&&x.includes("⚠️")||x.includes("🏃"));
    const inp2: any={width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10};
    return(
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("week");setConflicts([]);setConflictChecked(false);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Cancel</button>
          <span style={{fontSize:14,fontWeight:800}}>BOOK SESSION</span>
          <button onClick={()=>{if(conflictChecked&&!hardConflicts.length)saveSession();else{const c=checkConflicts();if(!c.filter(x=>x.includes("CONFLICT:")).length)saveSession();}}} style={{background:conflictChecked&&!hardConflicts.length?"#00d084":"#1a6eff",border:"none",color:conflictChecked&&!hardConflicts.length?"#000":"#fff",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>
            {conflictChecked&&!hardConflicts.length?"✓ SAVE":"CHECK & SAVE"}
          </button>
        </div>
        <div style={{padding:"20px 16px"}}>

          {/* Conflicts */}
          {conflictChecked&&conflicts.length>0&&(
            <div style={{marginBottom:14}}>
              {hardConflicts.map((c,i)=><div key={i} style={{background:"rgba(255,68,68,0.1)",border:"1px solid rgba(255,68,68,0.3)",borderRadius:12,padding:"12px",marginBottom:8,fontSize:13,color:"#ff8888",lineHeight:1.5}}>{c}</div>)}
              {warnings.filter(x=>!hardConflicts.includes(x)).map((c,i)=><div key={i} style={{background:"rgba(240,192,64,0.08)",border:"1px solid rgba(240,192,64,0.2)",borderRadius:12,padding:"12px",marginBottom:8,fontSize:13,color:"#f0c040",lineHeight:1.5}}>{c}</div>)}
              {suggestions.length>0&&<div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:12,padding:"12px"}}><div style={{fontSize:11,fontWeight:700,color:"#1a6eff",marginBottom:8}}>💡 OPEN SLOTS</div><div style={{display:"flex",flexWrap:"wrap" as const,gap:8}}>{suggestions.map((s,i)=><button key={i} onClick={()=>{const [st,et]=s.split("–").map(x=>x.trim());const to24=(t:string)=>{const pm=t.includes("PM"),am=t.includes("AM");const c=t.replace(/[AP]M/,"").trim();const[h,m]=c.split(":").map(Number);const h24=pm&&h!==12?h+12:am&&h===12?0:h;return`${h24.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`;};f("startTime",to24(st));f("endTime",to24(et));setConflictChecked(false);setConflicts([]);setSuggestions([]);}} style={{fontSize:12,background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",borderRadius:8,padding:"5px 12px",color:"#1a6eff",cursor:"pointer",fontWeight:700}}>{s}</button>)}</div></div>}
            </div>
          )}
          {conflictChecked&&!conflicts.length&&<div style={{background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.25)",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#00d084",fontWeight:700}}>✅ Schedule is clear!</div>}

          {/* Session type */}
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"16px",marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:12}}>SESSION TYPE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {SESSION_TYPES.map(t=>(
                <div key={t.id} onClick={()=>{f("sessionType",t.id);f("maxAthletes",t.max);}} style={{background:form.sessionType===t.id?`${t.color}20`:"rgba(255,255,255,0.02)",border:`1px solid ${form.sessionType===t.id?t.color:"rgba(255,255,255,0.06)"}`,borderRadius:10,padding:"12px 10px",cursor:"pointer"}}>
                  <div style={{fontSize:18,marginBottom:4}}>{t.icon}</div>
                  <div style={{fontSize:12,fontWeight:700,color:form.sessionType===t.id?t.color:"rgba(255,255,255,0.7)",marginBottom:1}}>{t.label}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Title & Date */}
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"16px",marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:10}}>SESSION DETAILS</div>
            <label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:4}}>TITLE</label>
            <input value={form.title} onChange={e=>f("title",e.target.value)} placeholder="e.g. Private Training — Travis Cheyne" style={inp2}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:4}}>DATE</label><input type="date" value={form.date} onChange={e=>f("date",e.target.value)} style={inp2}/></div>
              <div><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:4}}>PRICE $</label><input type="number" value={form.price} onChange={e=>f("price",parseFloat(e.target.value)||0)} style={inp2}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:4}}>START</label><input type="time" value={form.startTime} onChange={e=>f("startTime",e.target.value)} style={inp2}/></div>
              <div><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:4}}>END</label><input type="time" value={form.endTime} onChange={e=>f("endTime",e.target.value)} style={inp2}/></div>
            </div>
            <label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:4}}>LOCATION</label>
            <input value={form.location} onChange={e=>f("location",e.target.value)} placeholder="D1 Training Hulen Fort Worth" style={inp2}/>
          </div>

          {/* Athletes */}
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"16px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const}}>ATHLETES</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>{form.selectedAthletes.length}/{form.maxAthletes} selected</div>
              </div>
              <button onClick={()=>setShowAthleteSelector(true)} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>
                {form.selectedAthletes.length===0?"+ Add Athletes":"Edit Athletes"}
              </button>
            </div>
            {form.selectedAthletes.length===0?(
              <div style={{textAlign:"center",padding:"20px 0",color:"rgba(255,255,255,0.2)",fontSize:12}}>No athletes selected yet</div>
            ):(
              <div style={{display:"flex",flexWrap:"wrap" as const,gap:8}}>
                {form.selectedAthletes.map(id=>{const a=athletes.find(x=>x.id===id);if(!a)return null;return(
                  <div key={id} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.25)",borderRadius:100,padding:"4px 12px 4px 4px"}}>
                    <Avatar athlete={a} size={28}/>
                    <div><div style={{fontSize:12,fontWeight:700}}>{a.name.split(" ")[0]}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.4)"}}>{a.sessions} sessions</div></div>
                    <button onClick={()=>f("selectedAthletes",form.selectedAthletes.filter(x=>x!==id))} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:14,padding:"0 0 0 4px"}}>✕</button>
                  </div>
                );})}
              </div>
            )}
          </div>

          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"16px"}}>
            <label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:4}}>NOTES</label>
            <textarea value={form.notes} onChange={e=>f("notes",e.target.value)} placeholder="Any notes for this session..." style={{...inp2,height:60,resize:"none" as const,marginBottom:0}}/>
          </div>
        </div>

        {showAthleteSelector&&(
          <AthleteSelector athletes={athletes} maxSelect={form.maxAthletes} selected={form.selectedAthletes} sessions={sessions} existingBookings={bookings} sessionDate={form.date} sessionStart={form.startTime} sessionEnd={form.endTime}
            onConfirm={ids=>{f("selectedAthletes",ids);setShowAthleteSelector(false);}}
            onClose={()=>setShowAthleteSelector(false)}
          />
        )}
      </main>
    );
  }

  // ── WEEK VIEW ──
  const todayFull = todayStr();
  const selDayEvents = sessions.filter(s=>s.date===selDay).sort((a,b)=>a.startTime.localeCompare(b.startTime));

  return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Link href="/coach/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
            <div>
              <div style={{fontSize:16,fontWeight:800}}>TRAINING SCHEDULE</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Elite Skillz Lab 🧪</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowAIPanel(!showAIPanel)} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...blankForm,date:selDay});setConflicts([]);setConflictChecked(false);setView("add");}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ BOOK</button>
          </div>
        </div>

        {/* Week nav */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:0}}>
          <button onClick={()=>setWeekOffset(w=>w-1)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid #333",color:"#fff",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14}}>‹</button>
          <div style={{flex:1,display:"flex",gap:4}}>
            {weekDates.map((d,i)=>{
              const ds=d.toISOString().split("T")[0];
              const isToday=ds===todayFull,isSel=ds===selDay;
              const daySess=sessions.filter(s=>s.date===ds);
              const dayBooked=daySess.reduce((a,s)=>a+sessionBookings(s.id).length,0);
              const isD1day=[2,3].includes(d.getDay());
              return(
                <div key={i} onClick={()=>setSelDay(ds)} style={{flex:1,textAlign:"center",padding:"6px 2px",borderRadius:10,cursor:"pointer",background:isSel?"rgba(26,110,255,0.2)":isToday?"rgba(26,110,255,0.08)":"transparent",border:`1px solid ${isSel?"#1a6eff":isToday?"rgba(26,110,255,0.3)":"rgba(255,255,255,0.06)"}`}}>
                  <div style={{fontSize:8,fontWeight:800,color:isSel?"#fff":isToday?"#1a6eff":"rgba(255,255,255,0.4)"}}>{DAYS[i]}</div>
                  <div style={{fontSize:14,fontWeight:700,color:isSel?"#fff":isToday?"#1a6eff":"#fff",marginTop:1}}>{d.getDate()}</div>
                  {daySess.length>0&&<div style={{width:4,height:4,borderRadius:"50%",background:isSel?"#fff":"#1a6eff",margin:"2px auto 0"}}/>}
                  {isD1day&&<div style={{fontSize:7,color:"rgba(26,110,255,0.6)"}}>D1</div>}
                  {dayBooked>0&&<div style={{fontSize:7,color:"#00d084"}}>{dayBooked}🏃</div>}
                </div>
              );
            })}
          </div>
          <button onClick={()=>setWeekOffset(w=>w+1)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid #333",color:"#fff",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14}}>›</button>
        </div>
      </div>

      {/* AI Panel */}
      {showAIPanel&&(
        <div style={{background:"rgba(26,110,255,0.04)",border:"1px solid rgba(26,110,255,0.2)",margin:"12px 16px",borderRadius:14,padding:"14px"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#1a6eff",marginBottom:10}}>⚡ SCHEDULING AGENT</div>
          {!aiResult&&!aiLoading&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{l:"Who needs sessions?",prompt:`Coach T at Elite Skillz Lab. Athletes needing sessions: ${athletes.filter(a=>a.sessions<=3).map(a=>`${a.name}(${a.sessions}sess)`).join(",")||"none"}. All athletes: ${athletes.map(a=>`${a.name}(${a.sessions},${a.status})`).join(",")}.  Who to prioritize booking? Top 3 actions with exact names.`},{l:"Fill open slots",prompt:`Coach T schedule for ${selDay}: ${selDayEvents.map(s=>`${s.title} ${s.startTime}-${s.endTime} (${sessionBookings(s.id).length}/${s.maxAthletes})`).join("|")||"nothing scheduled"}. Athletes active: ${athletes.filter(a=>a.status==="active").map(a=>a.name).join(",")}.  Which athletes should fill open session slots today? Be specific.`},{l:"Revenue today",prompt:`Coach T. Today's sessions: ${selDayEvents.map(s=>`${s.title}($${s.price}x${sessionBookings(s.id).length}athletes)`).join("|")||"none"}. Athletes with urgent renewals: ${athletes.filter(a=>a.sessions<=2).map(a=>a.name).join(",")}.  Today's revenue analysis and top money action.`},{l:"Who needs renewal?",prompt:`Coach T. Urgent athletes (sessions running out): ${athletes.filter(a=>a.sessions<=3).map(a=>`${a.name}(${a.sessions}left,${a.freq}x/wk)`).join(",")||"none"}.  Write renewal priority list with exact outreach order and what to say to #1.`}].map((a,i)=>(
                <div key={i} onClick={()=>runAI(a.prompt)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid #333",borderRadius:10,padding:"10px",cursor:"pointer",fontSize:12,fontWeight:700,color:"#1a6eff"}}>{a.l}</div>
              ))}
            </div>
          )}
          {aiLoading&&<div style={{textAlign:"center",padding:"16px"}}><div style={{fontSize:14,fontWeight:800,color:"#1a6eff"}}>⚙️ ANALYZING...</div></div>}
          {aiResult&&(
            <div>
              <div style={{fontSize:13,lineHeight:1.7,color:"#fff",whiteSpace:"pre-wrap",marginBottom:10}}>{aiResult}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={()=>setAiResult("")} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12}}>← More</button>
                <button onClick={()=>{navigator.clipboard?.writeText(aiResult);setAiCopied(true);setTimeout(()=>setAiCopied(false),2000);}} style={{background:aiCopied?"#00d084":"#1a6eff",border:"none",color:aiCopied?"#000":"#fff",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:700}}>{aiCopied?"✓ COPIED!":"📋 Copy"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Day sessions */}
      <div style={{padding:"14px 16px"}}>
        <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.6)",marginBottom:12}}>{formatDateLabel(selDay)}</div>

        {[2,3].includes(new Date(selDay+"T12:00:00").getDay())&&(
          <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.15)",borderRadius:12,padding:"10px 14px",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}>
            <span>🔒</span><span style={{fontSize:12,color:"#1a6eff",fontWeight:700}}>D1 TRAINING LOCKED 5:45–7:45 PM</span>
          </div>
        )}

        {selDayEvents.length===0&&(
          <div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.25)",fontSize:13,lineHeight:1.8}}>
            No sessions on {FDAYS[new Date(selDay+"T12:00:00").getDay()]}<br/>
            <button onClick={()=>{setForm({...blankForm,date:selDay});setConflicts([]);setConflictChecked(false);setView("add");}} style={{marginTop:14,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13,fontWeight:700}}>+ Book Session</button>
          </div>
        )}

        {selDayEvents.map(sess=>{
          const typeInfo=SESSION_TYPES.find(t=>t.id===sess.sessionType);
          const bc=typeInfo?.color||"#1a6eff";
          const sb=sessionBookings(sess.id);
          const dur=durationMin(sess.startTime,sess.endTime);
          return(
            <div key={sess.id} onClick={()=>{setSelSession(sess);setView("detail");}} style={{background:"#111",border:"1px solid #222",borderLeft:`4px solid ${bc}`,borderRadius:12,padding:"14px",marginBottom:10,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{sess.title}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{to12(sess.startTime)}–{to12(sess.endTime)} · {dur}min · {sess.location.split(" ")[0]}</div>
                </div>
                <div style={{textAlign:"right" as const,flexShrink:0,marginLeft:10}}>
                  <div style={{fontSize:18,fontWeight:900,color:sb.length>=sess.maxAthletes?"#ff4444":sb.length>0?"#f0c040":"rgba(255,255,255,0.3)"}}>{sb.length}/{sess.maxAthletes}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>ATHLETES</div>
                </div>
              </div>

              {/* Athlete avatars */}
              {sb.length>0&&(
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <div style={{display:"flex",gap:-4}}>
                    {sb.slice(0,5).map((b,i)=>{const a=athletes.find(x=>x.id===b.athleteId);return a?<div key={i} style={{marginLeft:i>0?-8:0,zIndex:5-i}}><Avatar athlete={a} size={28}/></div>:null;})}
                    {sb.length>5&&<div style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.1)",border:"1px solid #333",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"rgba(255,255,255,0.5)",marginLeft:-8}}>+{sb.length-5}</div>}
                  </div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginLeft:6}}>{sb.map(b=>b.athleteName.split(" ")[0]).slice(0,3).join(", ")}{sb.length>3?`+${sb.length-3} more`:""}</div>
                </div>
              )}

              <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                <span style={{fontSize:10,background:`${bc}18`,borderRadius:6,padding:"2px 8px",color:bc,fontWeight:700}}>{typeInfo?.icon} {typeInfo?.label}</span>
                {sess.isLocked&&<span style={{fontSize:10,background:"rgba(26,110,255,0.12)",borderRadius:6,padding:"2px 8px",color:"#1a6eff",fontWeight:700}}>🔒 LOCKED</span>}
                {sess.isCompleted&&<span style={{fontSize:10,background:"rgba(0,208,132,0.12)",borderRadius:6,padding:"2px 8px",color:"#00d084",fontWeight:700}}>✓ DONE</span>}
                {sess.price>0&&<span style={{fontSize:10,background:"rgba(26,110,255,0.1)",borderRadius:6,padding:"2px 8px",color:"#1a6eff"}}>${sess.price>0?(sess.price*sb.length).toLocaleString():"0"}</span>}
                {!sess.isLocked&&!sess.isCompleted&&!sessionFull(sess)&&<span style={{fontSize:10,background:"rgba(0,208,132,0.08)",borderRadius:6,padding:"2px 8px",color:"#00d084"}}>Open slot</span>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ══════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════
interface ScheduleEvent {
  id: string;
  title: string;
  business: "luxury"|"moving"|"coach"|"personal";
  serviceType: string;
  date: string;
  startTime: string;
  endTime: string;
  address: string;
  driveTime: number;
  price: number;
  notes: string;
  clientName: string;
  linkedId: string;
  isLocked: boolean;
  createdAt: string;
}

const STORAGE = "cros_schedule_v1";

// D1 LOCKED BLOCKS — never schedule over these
const D1_LOCKS = [
  { day: 2, label: "D1 Training", start: "17:45", end: "19:45" }, // Tuesday
  { day: 3, label: "D1 Training", start: "17:45", end: "19:45" }, // Wednesday
];

const BUSINESS_TYPES = [
  { id:"luxury", label:"🏠 All In One Luxury", color:"#1a6eff" },
  { id:"moving", label:"🚛 Moving Company",    color:"#4a8fff" },
  { id:"coach",  label:"💪 Elite Skillz Lab",  color:"#00d084" },
  { id:"personal",label:"👤 Personal/Admin",   color:"rgba(255,255,255,0.5)" },
];

const SERVICE_TYPES: Record<string, string[]> = {
  luxury:  ["Staging Install","Staging Transfer","Staging Pickup","Client Meeting","Realtor Meeting","Property Walkthrough"],
  moving:  ["Moving Job","Moving Estimate","Crew Briefing","Equipment Check","Client Walkthrough"],
  coach:   ["D1 Group Class","Private Training","1-on-1 Session","Assessment/Testing","Team Practice","Parent Meeting"],
  personal:["Admin Block","Planning Session","Family Time","Travel","Recovery","Personal"],
};

const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const FDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function timeOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  const s1m = toMinutes(s1), e1m = toMinutes(e1);
  const s2m = toMinutes(s2), e2m = toMinutes(e2);
  return s1m < e2m && e1m > s2m;
}

function to12h(time24: string): string {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getWeekDates(offsetWeeks = 0): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ── STYLES ──
const inp: any = { width:"100%", padding:"10px 12px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#fff", fontFamily:"system-ui", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 };
const lbl: any = { display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase" as const, marginBottom:4 };
const card: any = { background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"16px", marginBottom:10 };

// ── CONFLICT CHECKER ──
function checkConflicts(form: Partial<ScheduleEvent>, existing: ScheduleEvent[]): string[] {
  const conflicts: string[] = [];
  if (!form.date || !form.startTime || !form.endTime) return conflicts;
  const eventDate = new Date(form.date + "T00:00:00");
  const dayOfWeek = eventDate.getDay();

  // Check D1 locked blocks
  D1_LOCKS.forEach(lock => {
    if (lock.day === dayOfWeek && timeOverlap(form.startTime!, form.endTime!, lock.start, lock.end)) {
      conflicts.push(`🔒 CONFLICT: D1 Training is LOCKED ${to12h(lock.start)}–${to12h(lock.end)} on ${FDAYS[lock.day]}. This is a protected commitment.`);
    }
  });

  // Check existing events
  existing.forEach(ev => {
    if (ev.id === form.id) return; // Skip self when editing
    if (ev.date === form.date && timeOverlap(form.startTime!, form.endTime!, ev.startTime, ev.endTime)) {
      const biz = BUSINESS_TYPES.find(b => b.id === ev.business)?.label || ev.business;
      conflicts.push(`⚠️ CONFLICT: "${ev.title}" is already scheduled ${to12h(ev.startTime)}–${to12h(ev.endTime)} on this date.`);
    }
  });

  // Check drive time conflicts
  if (form.driveTime && form.driveTime > 0) {
    const startWithDrive = toMinutes(form.startTime!) - form.driveTime;
    const driveStart = `${Math.floor(startWithDrive / 60).toString().padStart(2,"0")}:${(startWithDrive % 60).toString().padStart(2,"0")}`;
    existing.forEach(ev => {
      if (ev.id === form.id) return;
      if (ev.date === form.date && timeOverlap(driveStart, form.startTime!, ev.startTime, ev.endTime)) {
        conflicts.push(`🚗 DRIVE TIME WARNING: You have "${ev.title}" ending at ${to12h(ev.endTime)} but need ${form.driveTime} min drive time before your new event at ${to12h(form.startTime!)}.`);
      }
    });
  }

  return conflicts;
}

// ── SUGGEST TIMES ──
function suggestTimes(date: string, duration: number, existing: ScheduleEvent[]): string[] {
  const slots: string[] = [];
  const suggestions: string[] = [];
  const eventDate = new Date(date + "T00:00:00");
  const dayOfWeek = eventDate.getDay();

  // Build blocked periods
  const blocked: Array<{start:string;end:string}> = [];
  D1_LOCKS.forEach(lock => { if (lock.day === dayOfWeek) blocked.push({start:lock.start, end:lock.end}); });
  existing.filter(ev => ev.date === date).forEach(ev => blocked.push({start:ev.startTime, end:ev.endTime}));

  // Check 7am-8pm in 30-min increments
  for (let h = 7; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      const start = `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`;
      const endMin = h * 60 + m + duration;
      if (endMin > 20 * 60) break;
      const end = `${Math.floor(endMin/60).toString().padStart(2,"0")}:${(endMin%60).toString().padStart(2,"0")}`;
      const hasConflict = blocked.some(b => timeOverlap(start, end, b.start, b.end));
      if (!hasConflict) slots.push(`${to12h(start)} – ${to12h(end)}`);
    }
  }
  return slots.slice(0, 6);
}

// ── AI AGENT PANEL ──
function AgentPanel({ events, onClose }: { events: ScheduleEvent[]; onClose: ()=>void }) {
  const [action, setAction] = useState<string|null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const today = new Date();
  const todayStr = formatDate(today);
  const todayEvents = events.filter(e => e.date === todayStr);
  const weekEvents = events.filter(e => {
    const d = new Date(e.date);
    const diff = (d.getTime() - today.getTime()) / 86400000;
    return diff >= 0 && diff < 7;
  });
  const totalRevenue = weekEvents.reduce((a, e) => a + (e.price || 0), 0);

  const ACTIONS = [
    { id:"brief",   icon:"📋", label:"Today's Schedule Brief",   desc:`${todayEvents.length} events today · ${totalRevenue>0?"$"+weekEvents.reduce((a,e)=>a+(e.price||0),0).toLocaleString()+" this week":"review priorities"}` },
    { id:"optimize",icon:"🗺", label:"Optimize This Week",        desc:"Identify gaps, conflicts, and clustering opportunities" },
    { id:"revenue", icon:"💰", label:"Revenue Breakdown",         desc:"Which days and sessions generate the most" },
    { id:"conflicts",icon:"⚠️",label:"Conflict Scan",            desc:"Scan all upcoming events for issues" },
    { id:"suggest", icon:"💡", label:"Best Days to Book",         desc:"Recommend when to schedule new appointments" },
  ];

  async function run(actionId: string) {
    setLoading(true); setResult(""); setError(""); setAction(actionId);
    const eventSummary = weekEvents.map(e => `${e.date} ${e.startTime}-${e.endTime}: ${e.title} (${e.business}, $${e.price||0})`).join("\n");
    const prompts: Record<string,string> = {
      brief: `You are the Scheduling Agent for Crumley OS — Terrance Crumley's AI operating system for DFW. Today: ${today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}.\n\nD1 Training LOCKED Tue+Wed 5:45-7:45 PM always. Never schedule over these.\n\nToday's events:\n${todayEvents.map(e=>`${to12h(e.startTime)}-${to12h(e.endTime)}: ${e.title} @ ${e.address||"TBD"} ($${e.price||0})`).join("\n")||"No events today"}\n\nThis week (${weekEvents.length} events, $${totalRevenue} revenue):\n${eventSummary||"No events this week"}\n\nGenerate a sharp scheduling brief: top priorities today, any gaps to fill with revenue-generating appointments, drive time concerns, what to protect. COO-level, under 6 sentences.`,
      optimize: `Scheduling strategist for Terrance Crumley. All In One Luxury Designs (staging/moving) is primary income. Elite Skillz Lab is secondary. D1 locked Tue+Wed 5:45-7:45 PM.\n\nThis week's schedule:\n${eventSummary||"No events scheduled"}\n\nAnalyze and optimize: identify underutilized days, clustering opportunities (nearby staging jobs same day), revenue gaps, and schedule compression. Give 3 specific actions to improve this week's efficiency. Direct, specific, no fluff.`,
      revenue: `Revenue analyst for Terrance Crumley. This week's scheduled events:\n${eventSummary||"No events"}\nTotal scheduled revenue: $${totalRevenue}\n\nBreak down revenue by business type. Identify highest-value time blocks. Recommend 2 specific moves to increase this week's revenue. Include: any empty staging windows, moving estimates to close, or training slots to fill.`,
      conflicts: `Schedule conflict scanner for Crumley OS. D1 locked: Tuesday 5:45-7:45 PM, Wednesday 5:45-7:45 PM.\n\nAll upcoming events:\n${events.filter(e=>e.date>=todayStr).map(e=>`${e.date} ${e.startTime}-${e.endTime}: ${e.title}`).join("\n")||"No upcoming events"}\n\nScan for: overlapping times, back-to-back events with no drive time, scheduling near D1 blocks without buffer, low-revenue events blocking high-revenue windows. List ALL conflicts found. If none, confirm schedule is clean.`,
      suggest: `Scheduling advisor for Terrance Crumley. D1 locked Tue+Wed 5:45-7:45 PM. Current week:\n${eventSummary||"Schedule is open"}\n\nRecommend the 3 best available windows this week to book new revenue-generating appointments (staging installs, moving estimates, private training). Consider: drive time clustering, D1 blocks, energy management, highest income per hour. Give specific day and time recommendations.`,
    };
    try {
      const res = await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:prompts[actionId]})});
      const data = await res.json();
      if(data.error) setError(data.message||data.error); else setResult(data.text);
    } catch { setError("Network error."); }
    setLoading(false);
  }

  function copy(){navigator.clipboard?.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);}

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.8)"}}/>
      <div style={{position:"relative",background:"#070d1a",borderRadius:"20px 20px 0 0",border:"1px solid rgba(26,110,255,0.3)",padding:"20px 16px 50px",maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>⚡ SCHEDULING AGENT</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>Conflict prevention · Revenue optimization · Route planning</div>
          </div>
          <button onClick={()=>{if(action&&result){setAction(null);setResult("");setError("");}else onClose();}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>
            {(action&&result)?"← Back":"✕"}
          </button>
        </div>
        {!result&&!loading&&ACTIONS.map(a=>(
          <div key={a.id} onClick={()=>run(a.id)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(26,110,255,0.15)",borderRadius:12,padding:"14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>{a.icon}</span>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#1a6eff",marginBottom:2}}>{a.label}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{a.desc}</div></div>
            <span style={{color:"rgba(255,255,255,0.2)"}}>›</span>
          </div>
        ))}
        {loading&&<div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:36,marginBottom:12}}>📅</div><div style={{fontSize:14,fontWeight:800,color:"#1a6eff",letterSpacing:"0.1em"}}>ANALYZING SCHEDULE...</div></div>}
        {error&&<div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10,padding:"14px",color:"#ff8888",fontSize:13}}>{error}</div>}
        {result&&(
          <div>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px",fontSize:14,lineHeight:1.8,color:"#fff",whiteSpace:"pre-wrap",marginBottom:12}}>{result}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
              <button onClick={()=>{setResult("");setError("");setAction(null);}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13}}>← More</button>
              <button onClick={copy} style={{background:copied?"#00d084":"#1a6eff",border:"none",color:copied?"#000":"#fff",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:14,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN SCHEDULE PAGE
// ══════════════════════════════════════════════════════
export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [view, setView] = useState<"week"|"add"|"detail">("week");
  const [sel, setSel] = useState<ScheduleEvent|null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selDay, setSelDay] = useState<string|null>(null);
  const [showAgent, setShowAgent] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conflictChecked, setConflictChecked] = useState(false);

  const BLANK = {
    title:"", business:"luxury" as const, serviceType:"Staging Install",
    date: selDay || formatDate(new Date()),
    startTime:"09:00", endTime:"11:00", address:"",
    driveTime:0, price:0, notes:"", clientName:"", linkedId:"", isLocked:false,
  };
  const [form, setForm] = useState<any>({...BLANK});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setEvents(JSON.parse(raw));
      else {
        // Seed with D1 locked blocks
        const seed: ScheduleEvent[] = [];
        for (let w = 0; w < 8; w++) {
          [2,3].forEach(dayNum => {
            const d = new Date();
            const diff = dayNum - d.getDay() + w * 7;
            const date = new Date(d);
            date.setDate(d.getDate() + diff);
            if (date >= new Date()) {
              seed.push({
                id: `d1-${dayNum}-${w}`,
                title: "D1 Training — Group Classes",
                business: "coach",
                serviceType: "D1 Group Class",
                date: formatDate(date),
                startTime: "17:45",
                endTime: "19:45",
                address: "D1 Training Hulen Fort Worth",
                driveTime: 0,
                price: 0,
                notes: "2 group classes — LOCKED COMMITMENT",
                clientName: "D1 Training",
                linkedId: "",
                isLocked: true,
                createdAt: new Date().toISOString(),
              });
            }
          });
        }
        setEvents(seed);
        localStorage.setItem(STORAGE, JSON.stringify(seed));
      }
    } catch {}
  }, []);

  function persist(data: ScheduleEvent[]) {
    setEvents(data);
    try { localStorage.setItem(STORAGE, JSON.stringify(data)); } catch {}
  }

  function f(k: string, v: any) { setForm((p: any) => ({...p, [k]: v})); }

  function checkForm() {
    const c = checkConflicts(form, events);
    setConflicts(c);
    if (c.length === 0) {
      setSuggestions([]);
    } else {
      // Only suggest if there's a real conflict (not just warnings)
      const hardConflicts = c.filter(x => x.includes("CONFLICT:"));
      if (hardConflicts.length > 0 && form.startTime && form.endTime) {
        const dur = toMinutes(form.endTime) - toMinutes(form.startTime);
        setSuggestions(suggestTimes(form.date, dur, events));
      }
    }
    setConflictChecked(true);
  }

  function saveEvent() {
    const hardConflicts = conflicts.filter(x => x.includes("CONFLICT:"));
    if (hardConflicts.length > 0) return; // Block save on hard conflicts

    const event: ScheduleEvent = {
      ...form,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    persist([...events, event]);
    setForm({...BLANK});
    setConflicts([]);
    setSuggestions([]);
    setConflictChecked(false);
    setView("week");
  }

  function deleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    persist(events.filter(e => e.id !== id));
    setView("week");
    setSel(null);
  }

  const weekDates = getWeekDates(weekOffset);
  const today = formatDate(new Date());
  const bizColor = (b: string) => BUSINESS_TYPES.find(x => x.id === b)?.color || "#fff";

  // ── EVENT DETAIL ──
  if (view === "detail" && sel) {
    const bc = bizColor(sel.business);
    return (
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("week");setSel(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Schedule</button>
          {!sel.isLocked&&<button onClick={()=>deleteEvent(sel.id)} style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🗑 Delete</button>}
        </div>
        <div style={{padding:"20px 16px"}}>
          <div style={{background:`${bc}15`,border:`1px solid ${bc}33`,borderLeft:`4px solid ${bc}`,borderRadius:14,padding:"18px",marginBottom:14}}>
            <div style={{fontSize:21,fontWeight:900,marginBottom:4}}>{sel.title}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:4}}>{BUSINESS_TYPES.find(b=>b.id===sel.business)?.label}</div>
            <div style={{fontSize:15,fontWeight:700,color:bc}}>{to12h(sel.startTime)} – {to12h(sel.endTime)}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:2}}>{new Date(sel.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
            {sel.isLocked&&<div style={{marginTop:8,fontSize:12,color:"#1a6eff",fontWeight:700}}>🔒 LOCKED COMMITMENT</div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[{l:"PRICE",v:sel.price>0?`$${sel.price.toLocaleString()}`:"—",c:"#1a6eff"},{l:"DRIVE TIME",v:sel.driveTime>0?`${sel.driveTime} min`:"—",c:"rgba(255,255,255,0.5)"},{l:"SERVICE",v:sel.serviceType.split(" ").slice(0,2).join(" "),c:bc}].map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px",textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:900,color:s.c}}>{s.v}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
          {[{l:"CLIENT",v:sel.clientName},{l:"SERVICE TYPE",v:sel.serviceType},{l:"LOCATION / ADDRESS",v:sel.address},{l:"NOTES",v:sel.notes}].filter(i=>i.v).map((item,i)=>(
            <div key={i} style={{...card,marginBottom:8}}>
              <div style={{...lbl,marginBottom:4}}>{item.l}</div>
              <div style={{fontSize:14,color:"#fff"}}>{item.v}</div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // ── ADD EVENT ──
  if (view === "add") {
    const hardConflicts = conflicts.filter(x => x.includes("CONFLICT:"));
    const warnings = conflicts.filter(x => x.includes("WARNING:"));
    const bc = bizColor(form.business);
    return (
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("week");setConflicts([]);setSuggestions([]);setConflictChecked(false);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Cancel</button>
          <span style={{fontSize:14,fontWeight:800}}>SCHEDULE EVENT</span>
          <button
            onClick={conflictChecked && hardConflicts.length===0 ? saveEvent : checkForm}
            style={{background: conflictChecked && hardConflicts.length===0 ? "#00d084" : "#1a6eff", border:"none", color: conflictChecked && hardConflicts.length===0 ? "#000" : "#fff", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontSize:13, fontWeight:700}}
          >
            {conflictChecked && hardConflicts.length===0 ? "✓ SAVE" : "CHECK & SAVE"}
          </button>
        </div>

        <div style={{padding:"20px 16px"}}>
          {/* CONFLICTS */}
          {conflictChecked && conflicts.length > 0 && (
            <div style={{marginBottom:14}}>
              {hardConflicts.map((c,i)=>(
                <div key={i} style={{background:"rgba(255,68,68,0.1)",border:"1px solid rgba(255,68,68,0.3)",borderRadius:12,padding:"14px",marginBottom:8,fontSize:13,color:"#ff8888",lineHeight:1.6}}>
                  {c}
                </div>
              ))}
              {warnings.map((c,i)=>(
                <div key={i} style={{background:"rgba(240,192,64,0.08)",border:"1px solid rgba(240,192,64,0.25)",borderRadius:12,padding:"14px",marginBottom:8,fontSize:13,color:"#f0c040",lineHeight:1.6}}>
                  {c}
                </div>
              ))}
              {suggestions.length > 0 && (
                <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:12,padding:"14px",marginBottom:8}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#1a6eff",marginBottom:10}}>💡 AVAILABLE TIMES ON THIS DATE</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {suggestions.map((s,i)=>(
                      <button key={i} onClick={()=>{
                        const [st, et] = s.replace(" AM","am").replace(" PM","pm").split(" – ");
                        const to24=(t:string)=>{const isPM=t.includes("pm"),isAM=t.includes("am");const clean=t.replace(/[ap]m/,"").trim();const[h,m]=clean.split(":").map(Number);const h24=isPM&&h!==12?h+12:isAM&&h===12?0:h;return`${h24.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`;};
                        f("startTime",to24(st));f("endTime",to24(et));setConflictChecked(false);setConflicts([]);setSuggestions([]);
                      }} style={{fontSize:12,background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",borderRadius:8,padding:"6px 12px",color:"#1a6eff",cursor:"pointer",fontWeight:700}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {conflictChecked && conflicts.length === 0 && (
            <div style={{background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.25)",borderRadius:12,padding:"12px 14px",marginBottom:14,fontSize:13,color:"#00d084",fontWeight:700}}>
              ✅ No conflicts found — schedule is clear!
            </div>
          )}

          {/* Business type */}
          <div style={{...card}}>
            <label style={lbl}>BUSINESS TYPE</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {BUSINESS_TYPES.map(b=>(
                <button key={b.id} onClick={()=>{f("business",b.id);f("serviceType",SERVICE_TYPES[b.id][0]);}} style={{padding:"10px 8px",borderRadius:10,background:form.business===b.id?`${b.color}25`:"rgba(255,255,255,0.03)",border:`1px solid ${form.business===b.id?b.color:"rgba(255,255,255,0.08)"}`,color:form.business===b.id?b.color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:12,fontWeight:700,textAlign:"center"}}>
                  {b.label}
                </button>
              ))}
            </div>
            <label style={lbl}>SERVICE TYPE</label>
            <select value={form.serviceType} onChange={e=>f("serviceType",e.target.value)} style={{...inp}}>
              {(SERVICE_TYPES[form.business]||[]).map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Title & Client */}
          <div style={{...card}}>
            <label style={lbl}>EVENT TITLE</label>
            <input value={form.title} onChange={e=>f("title",e.target.value)} placeholder="e.g. Staging Install — Valentine St" style={inp}/>
            <label style={lbl}>CLIENT NAME</label>
            <input value={form.clientName} onChange={e=>f("clientName",e.target.value)} placeholder="Leston Eustache" style={inp}/>
          </div>

          {/* Date & Time */}
          <div style={{...card}}>
            <label style={lbl}>DATE</label>
            <input type="date" value={form.date} onChange={e=>{f("date",e.target.value);setConflictChecked(false);setConflicts([]);setSuggestions([]);}} style={inp}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>START TIME</label><input type="time" value={form.startTime} onChange={e=>{f("startTime",e.target.value);setConflictChecked(false);setConflicts([]);}} style={inp}/></div>
              <div><label style={lbl}>END TIME</label><input type="time" value={form.endTime} onChange={e=>{f("endTime",e.target.value);setConflictChecked(false);setConflicts([]);}} style={inp}/></div>
            </div>
            <label style={lbl}>DRIVE TIME (minutes to location)</label>
            <input type="number" value={form.driveTime} onChange={e=>f("driveTime",parseInt(e.target.value)||0)} placeholder="0" style={inp}/>
          </div>

          {/* Location & Revenue */}
          <div style={{...card}}>
            <label style={lbl}>ADDRESS / LOCATION</label>
            <input value={form.address} onChange={e=>f("address",e.target.value)} placeholder="3031 Valentine St, Dallas TX" style={inp}/>
            <label style={lbl}>PRICE / REVENUE $</label>
            <input type="number" value={form.price} onChange={e=>f("price",parseFloat(e.target.value)||0)} placeholder="2750" style={inp}/>
          </div>

          {/* Notes */}
          <div style={{...card}}>
            <label style={lbl}>NOTES</label>
            <textarea value={form.notes} onChange={e=>f("notes",e.target.value)} placeholder="Any notes about this appointment..." style={{...inp,height:70,resize:"none" as const,marginBottom:0}}/>
          </div>

          {/* D1 warning */}
          {(form.date && [2,3].includes(new Date(form.date+"T12:00:00").getDay())) && (
            <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:12,padding:"12px 14px",marginBottom:14,fontSize:13,color:"#1a6eff"}}>
              🔒 <strong>Note:</strong> {FDAYS[new Date(form.date+"T12:00:00").getDay()]} has D1 Training locked 5:45–7:45 PM. The conflict check will verify your times.
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── WEEK VIEW ──
  const dayRevenue = (dateStr: string) => events.filter(e=>e.date===dateStr).reduce((a,e)=>a+(e.price||0),0);

  return (
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      {/* Header */}
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Link href="/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
            <div>
              <div style={{fontSize:16,fontWeight:800}}>SCHEDULE</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>
                {weekDates[0].toLocaleDateString("en-US",{month:"short",day:"numeric"})} – {weekDates[6].toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowAgent(true)} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>⚡ Agent</button>
            <button onClick={()=>{setForm({...BLANK,date:selDay||today});setConflicts([]);setSuggestions([]);setConflictChecked(false);setView("add");}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ BOOK</button>
          </div>
        </div>

        {/* Week navigation */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setWeekOffset(w=>w-1)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14}}>‹</button>
          <div style={{flex:1,display:"flex",gap:4}}>
            {weekDates.map((d,i)=>{
              const dateStr = formatDate(d);
              const isToday = dateStr === today;
              const hasSel = selDay === dateStr;
              const dayEvents = events.filter(e=>e.date===dateStr);
              const rev = dayRevenue(dateStr);
              const hasD1 = [2,3].includes(d.getDay());
              return(
                <div key={i} onClick={()=>setSelDay(hasSel?null:dateStr)} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:10,cursor:"pointer",background:hasSel?"rgba(26,110,255,0.2)":isToday?"rgba(26,110,255,0.08)":"transparent",border:`1px solid ${hasSel?"#1a6eff":isToday?"rgba(26,110,255,0.3)":"rgba(255,255,255,0.06)"}`}}>
                  <div style={{fontSize:8,fontWeight:800,letterSpacing:"0.05em",color:hasSel?"#fff":isToday?"#1a6eff":"rgba(255,255,255,0.4)"}}>{DAYS[i]}</div>
                  <div style={{fontSize:14,fontWeight:700,color:hasSel?"#fff":isToday?"#1a6eff":"#fff",marginTop:1}}>{d.getDate()}</div>
                  {dayEvents.length > 0 && <div style={{width:4,height:4,borderRadius:"50%",background:hasSel?"#fff":"#1a6eff",margin:"2px auto 0"}}/>}
                  {hasD1 && <div style={{fontSize:7,color:"rgba(26,110,255,0.7)",marginTop:1}}>D1</div>}
                  {rev > 0 && <div style={{fontSize:7,color:"#00d084",marginTop:1}}>${(rev/1000).toFixed(0)}k</div>}
                </div>
              );
            })}
          </div>
          <button onClick={()=>setWeekOffset(w=>w+1)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14}}>›</button>
        </div>
      </div>

      {/* Events */}
      <div style={{padding:"14px 16px"}}>
        {/* D1 lock reminder */}
        <div style={{background:"rgba(26,110,255,0.05)",border:"1px solid rgba(26,110,255,0.15)",borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>🔒</span>
          <div style={{fontSize:12,color:"#1a6eff",fontWeight:700}}>D1 TRAINING LOCKED — TUE & WED 5:45–7:45 PM</div>
        </div>

        {/* Filter by selected day or show all */}
        {(() => {
          const filterDates = selDay ? [selDay] : weekDates.map(formatDate);
          const shown = filterDates.flatMap(d => {
            const dayEvs = events.filter(e => e.date === d).sort((a,b)=>a.startTime.localeCompare(b.startTime));
            if (!dayEvs.length) return [];
            const dateObj = new Date(d+"T12:00:00");
            return [{type:"header" as const, date:d, label:`${FDAYS[dateObj.getDay()]} ${dateObj.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`}, ...dayEvs.map(e=>({type:"event" as const, event:e}))];
          });

          if (shown.length === 0) return (
            <div style={{textAlign:"center",padding:"50px 0",color:"rgba(255,255,255,0.25)",fontSize:14,lineHeight:1.8}}>
              {selDay ? `No events on ${new Date(selDay+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}` : "No events this week"}
              <br/>
              <button onClick={()=>{setForm({...BLANK,date:selDay||today});setConflicts([]);setSuggestions([]);setConflictChecked(false);setView("add");}} style={{marginTop:16,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13,fontWeight:700}}>+ Book Appointment</button>
            </div>
          );

          return shown.map((item,i) => {
            if (item.type === "header") return (
              <div key={i} style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",color:"rgba(255,255,255,0.4)",textTransform:"uppercase" as const,padding:"8px 0 6px",borderBottom:"1px solid rgba(255,255,255,0.05)",marginBottom:8,marginTop:i>0?14:0}}>
                {item.label} · ${dayRevenue(item.date).toLocaleString()} revenue
              </div>
            );
            const ev = item.event!;
            const bc = bizColor(ev.business);
            return (
              <div key={i} onClick={()=>{setSel(ev);setView("detail");}} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`4px solid ${bc}`,borderRadius:12,padding:"14px",marginBottom:8,cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ev.title}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{to12h(ev.startTime)} – {to12h(ev.endTime)}{ev.clientName?` · ${ev.clientName}`:""}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                    {ev.price>0&&<div style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>${ev.price.toLocaleString()}</div>}
                    {ev.isLocked&&<div style={{fontSize:10,color:"#1a6eff",fontWeight:700}}>🔒 LOCKED</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                  <span style={{fontSize:10,background:`${bc}18`,borderRadius:6,padding:"2px 8px",color:bc,fontWeight:700}}>{BUSINESS_TYPES.find(b=>b.id===ev.business)?.label.split(" ").slice(1).join(" ")||ev.business}</span>
                  <span style={{fontSize:10,background:"rgba(255,255,255,0.04)",borderRadius:6,padding:"2px 8px",color:"rgba(255,255,255,0.4)"}}>{ev.serviceType}</span>
                  {ev.address&&<span style={{fontSize:10,background:"rgba(255,255,255,0.04)",borderRadius:6,padding:"2px 8px",color:"rgba(255,255,255,0.3)",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{ev.address.split(",")[0]}</span>}
                  {ev.driveTime>0&&<span style={{fontSize:10,background:"rgba(240,192,64,0.08)",borderRadius:6,padding:"2px 8px",color:"#f0c040"}}>🚗 {ev.driveTime}min</span>}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {showAgent && <AgentPanel events={events} onClose={()=>setShowAgent(false)}/>}
    </main>
  );
}

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
const STORAGE = "ct_sessions";
const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const FDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const COLORS: Record<string,string> = {"D1 on 1":"#1a6eff","Group":"#4a8fff","Rookie":"#fff","Devo":"#4488ff","Prep":"#aaccff","Game Day":"#ff4444","Weekly L10":"#2255dd"};
const DEFAULT_SESSIONS = [
  {id:1,type:"Group",time:"5:45 PM",end:"6:45 PM",day:2,clients:[],maxClients:20,notes:"Tue Group Class 1 — LOCKED"},
  {id:2,type:"Group",time:"6:45 PM",end:"7:45 PM",day:2,clients:[],maxClients:20,notes:"Tue Group Class 2 — LOCKED"},
  {id:3,type:"Group",time:"5:45 PM",end:"6:45 PM",day:3,clients:[],maxClients:20,notes:"Wed Group Class 1 — LOCKED"},
  {id:4,type:"Group",time:"6:45 PM",end:"7:45 PM",day:3,clients:[],maxClients:20,notes:"Wed Group Class 2 — LOCKED"},
  {id:5,type:"D1 on 1",time:"3:30 PM",end:"4:30 PM",day:2,clients:["Travis Cheyne"],maxClients:1,notes:""},
  {id:6,type:"D1 on 1",time:"4:30 PM",end:"5:30 PM",day:2,clients:["Breelan"],maxClients:1,notes:""},
  {id:7,type:"D1 on 1",time:"4:30 PM",end:"5:30 PM",day:4,clients:["Granger"],maxClients:1,notes:""},
];
const inp: any = { width:"100%", padding:"10px 12px", background:"#111", border:"1px solid #333", borderRadius:10, color:"#fff", fontFamily:"system-ui", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 };
const lbl: any = { display:"block", fontFamily:"system-ui", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:4 };
export default function Page() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selDay, setSelDay] = useState(new Date().getDay());
  const [selSession, setSelSession] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type:"D1 on 1", time:"12:00 PM", end:"1:00 PM", day:new Date().getDay(), maxClients:1, notes:"" });
  useEffect(() => { try { const s = localStorage.getItem(STORAGE); setSessions(s ? JSON.parse(s) : DEFAULT_SESSIONS); } catch { setSessions(DEFAULT_SESSIONS); } }, []);
  function save(data: any[]) { setSessions(data); try { localStorage.setItem(STORAGE, JSON.stringify(data)); } catch {} }
  const daySessions = sessions.filter(s => s.day === selDay).sort((a,b) => a.time.localeCompare(b.time));
  const today = new Date().getDay();
  const isLocked = (s: any) => s.notes?.includes("LOCKED");
  if (selSession) {
    const sess = sessions.find(s => s.id === selSession.id) || selSession;
    const color = COLORS[sess.type]||"#1a6eff";
    return (
      <main style={{ minHeight:"100vh", background:"#000", paddingBottom:60, fontFamily:"system-ui" }}>
        <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={()=>setSelSession(null)} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Schedule</button>
          {!isLocked(sess)&&<button onClick={()=>{if(!confirm("Delete?"))return;save(sessions.filter(s=>s.id!==sess.id));setSelSession(null);}} style={{ background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.2)", color:"#ff6b6b", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:12 }}>Delete</button>}
        </div>
        <div style={{ padding:"20px 16px" }}>
          <div style={{ background:`${color}18`, border:`1px solid ${color}44`, borderRadius:14, padding:"18px", marginBottom:14 }}>
            <div style={{ fontSize:22, fontWeight:900, color, marginBottom:4 }}>{sess.type}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>{sess.time}–{sess.end} · {FDAYS[sess.day]}</div>
            {isLocked(sess)&&<div style={{ marginTop:8, fontSize:12, color:"#1a6eff", fontWeight:700 }}>🔒 LOCKED D1 COMMITMENT</div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
              {[{l:"BOOKED",v:`${sess.clients.length}/${sess.maxClients}`},{l:"TYPE",v:sess.notes?.includes("LOCKED")?"LOCKED":"BOOKABLE"}].map((s,i)=>(
                <div key={i} style={{ background:"rgba(255,255,255,0.06)", borderRadius:8, padding:"10px", textAlign:"center" }}>
                  <div style={{ fontSize:16, fontWeight:900 }}>{s.v}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          {sess.clients.length>0&&<div style={{ background:"#111", border:"1px solid #222", borderRadius:12, padding:"16px" }}>
            <div style={{ fontSize:10, letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)", fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>BOOKED CLIENTS</div>
            {sess.clients.map((c:string,i:number)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:i<sess.clients.length-1?"1px solid #222":"none" }}>
                <span style={{ fontSize:14, fontWeight:700 }}>{c}</span>
                <button onClick={()=>save(sessions.map(s=>s.id===sess.id?{...s,clients:s.clients.filter((x:string)=>x!==c)}:s))} style={{ background:"transparent", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:12 }}>✕</button>
              </div>
            ))}
          </div>}
          {sess.notes&&!isLocked(sess)&&<div style={{ marginTop:12, fontSize:13, color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>{sess.notes}</div>}
        </div>
      </main>
    );
  }
  return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Link href="/coach/dashboard" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"none", fontSize:20 }}>←</Link>
            <div style={{ fontSize:16, fontWeight:800 }}>SCHEDULE</div>
          </div>
          <button onClick={()=>setShowAdd(true)} style={{ background:"#1a6eff", border:"none", color:"#fff", borderRadius:10, padding:"8px 14px", cursor:"pointer", fontSize:12, fontWeight:700 }}>+ BOOK</button>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {DAYS.map((d,i)=>{
            const hasSess = sessions.filter(s=>s.day===i).length>0;
            const isToday = i===today;
            const active = i===selDay;
            return (
              <div key={i} onClick={()=>setSelDay(i)} style={{ flex:1, textAlign:"center", padding:"8px 4px", borderRadius:10, cursor:"pointer", background:active?"#1a6eff":isToday?"rgba(26,110,255,0.15)":"transparent", border:`1px solid ${active?"#1a6eff":isToday?"rgba(26,110,255,0.3)":"#222"}` }}>
                <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.05em", color:active?"#fff":isToday?"#1a6eff":"rgba(255,255,255,0.4)" }}>{d}</div>
                {hasSess&&<div style={{ width:4, height:4, borderRadius:"50%", background:active?"#fff":"#1a6eff", margin:"3px auto 0" }}/>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding:"14px 16px" }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:12, color:"rgba(255,255,255,0.7)" }}>{FDAYS[selDay]}</div>
        {daySessions.length===0&&<div style={{ textAlign:"center", padding:"50px 0", color:"rgba(255,255,255,0.3)", fontSize:14 }}>No sessions — tap + BOOK to add</div>}
        {daySessions.map(sess=>{
          const color = COLORS[sess.type]||"#1a6eff";
          const locked = isLocked(sess);
          return (
            <div key={sess.id} onClick={()=>setSelSession(sess)} style={{ background:"#111", border:`1px solid #222`, borderLeft:`4px solid ${locked?"#1a6eff":color}`, borderRadius:12, padding:"14px", marginBottom:10, cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div><div style={{ fontSize:15, fontWeight:700, color }}>{sess.type}{locked?" 🔒":""}</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{sess.time}–{sess.end}</div></div>
                <div style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.5)" }}>{sess.clients.length}/{sess.maxClients}</div>
              </div>
              {sess.clients.length>0&&<div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>{sess.clients.map((c:string,i:number)=><div key={i} style={{ fontSize:11, background:"rgba(26,110,255,0.15)", border:"1px solid rgba(26,110,255,0.3)", borderRadius:6, padding:"2px 8px", color:"#1a6eff" }}>{c.split(" ")[0]}</div>)}</div>}
            </div>
          );
        })}
      </div>
      {showAdd&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:100, display:"flex", alignItems:"flex-end" }}>
          <div style={{ background:"#111", borderRadius:"16px 16px 0 0", padding:"24px 16px 48px", width:"100%", maxHeight:"80vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
              <span style={{ fontSize:20, fontWeight:800 }}>BOOK SESSION</span>
              <button onClick={()=>setShowAdd(false)} style={{ background:"#1a1a1a", border:"none", color:"#888", borderRadius:6, padding:"6px 12px", cursor:"pointer" }}>Cancel</button>
            </div>
            <label style={lbl}>TYPE</label>
            <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={inp}>
              {Object.keys(COLORS).map(t=><option key={t}>{t}</option>)}
            </select>
            <label style={lbl}>DAY</label>
            <select value={form.day} onChange={e=>setForm(p=>({...p,day:parseInt(e.target.value)}))} style={inp}>
              {FDAYS.map((d,i)=><option key={i} value={i}>{d}</option>)}
            </select>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div><label style={lbl}>START</label><input value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={inp}/></div>
              <div><label style={lbl}>END</label><input value={form.end} onChange={e=>setForm(p=>({...p,end:e.target.value}))} style={inp}/></div>
            </div>
            <label style={lbl}>MAX CLIENTS</label>
            <input type="number" value={form.maxClients} onChange={e=>setForm(p=>({...p,maxClients:parseInt(e.target.value)||1}))} style={inp}/>
            <label style={lbl}>NOTES</label>
            <input value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={inp}/>
            <button onClick={()=>{save([...sessions,{...form,id:Date.now(),clients:[]}]);setShowAdd(false);}} style={{ width:"100%", background:"#1a6eff", border:"none", color:"#fff", borderRadius:12, padding:"16px", fontSize:16, fontWeight:900, cursor:"pointer" }}>ADD TO SCHEDULE</button>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
const STORAGE = "ct_clients";
const DEFAULT_ATHLETES = [
  {id:1,name:"Levi Smith",sport:"General",freq:2,sessions:1,value:378,status:"urgent",notes:""},
  {id:2,name:"Donovan Edwards",sport:"General",freq:2,sessions:33,value:2835,status:"active",notes:""},
  {id:3,name:"Travis Cheyne",sport:"General",freq:2,sessions:48,value:0,status:"active",notes:""},
  {id:4,name:"Rex Hayes",sport:"General",freq:2,sessions:26,value:0,status:"active",notes:""},
  {id:5,name:"Emiliano Ortiz",sport:"Football",freq:4,sessions:20,value:0,status:"inactive",notes:"Mom: Anna Ortiz"},
  {id:6,name:"Mateo Ortiz",sport:"Football",freq:4,sessions:20,value:0,status:"inactive",notes:"Brother of Emiliano"},
  {id:7,name:"Noah Langdon",sport:"General",freq:1,sessions:4,value:367,status:"active",notes:""},
  {id:8,name:"Sam Stacy",sport:"General",freq:1,sessions:4,value:1575,status:"active",notes:""},
  {id:9,name:"Cruz Mar",sport:"General",freq:1,sessions:13,value:1134,status:"active",notes:""},
  {id:10,name:"Joaquin Chavez",sport:"General",freq:2,sessions:12,value:1071,status:"active",notes:""},
  {id:11,name:"Lilianna Chavez",sport:"General",freq:2,sessions:12,value:1071,status:"active",notes:""},
  {id:12,name:"Breelan",sport:"General",freq:2,sessions:8,value:0,status:"active",notes:""},
  {id:13,name:"Granger",sport:"General",freq:2,sessions:8,value:0,status:"active",notes:""},
  {id:14,name:"Cody Bevan",sport:"General",freq:1,sessions:1,value:0,status:"urgent",notes:""},
  {id:15,name:"Joshua Chavis",sport:"General",freq:2,sessions:2,value:0,status:"urgent",notes:""},
  {id:16,name:"Daniel Chapman",sport:"General",freq:2,sessions:2,value:0,status:"urgent",notes:""},
  {id:17,name:"Axton Mondragon",sport:"General",freq:1,sessions:4,value:1575,status:"active",notes:""},
  {id:18,name:"Aaliyah Jauregui",sport:"General",freq:2,sessions:2,value:0,status:"urgent",notes:""},
  {id:19,name:"Jaxson Bowling",sport:"General",freq:9,sessions:12,value:0,status:"active",notes:""},
  {id:20,name:"Jacob Robledo",sport:"General",freq:1,sessions:3,value:210,status:"active",notes:""},
  {id:21,name:"Quenton Jean",sport:"General",freq:2,sessions:0,value:0,status:"inactive",notes:"Contact Kevin (dad)"},
].map(a => ({...a, age:"", weight:"", position:"", goal:"", injuries:"", maxes:{}, progressLog:[]}));
const SC: Record<string,{color:string,bg:string,label:string}> = {
  active:{color:"#1a6eff",bg:"rgba(26,110,255,0.1)",label:"ACTIVE"},
  urgent:{color:"#ff4444",bg:"rgba(255,68,68,0.1)",label:"URGENT"},
  inactive:{color:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)",label:"INACTIVE"},
};
const inp: any = { width:"100%", padding:"10px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", fontFamily:"system-ui", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 };
const lbl: any = { display:"block", fontFamily:"system-ui", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:4 };
export default function Page() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [view, setView] = useState("list");
  const [sel, setSel] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  useEffect(() => { try { const s = localStorage.getItem(STORAGE); setAthletes(s ? JSON.parse(s) : DEFAULT_ATHLETES); } catch { setAthletes(DEFAULT_ATHLETES); } }, []);
  function save(data: any[]) { setAthletes(data); try { localStorage.setItem(STORAGE, JSON.stringify(data)); } catch {} }
  function f(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })); }
  function saveEdit() { const u = athletes.map(a => a.id===sel.id?{...a,...form}:a); save(u); setSel({...sel,...form}); setView("detail"); }
  const shown = athletes.filter(a => (filter==="all"||a.status===filter) && a.name.toLowerCase().includes(search.toLowerCase()));
  const urgent = athletes.filter(a => a.status==="urgent").length;
  if (view === "edit" && sel) return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:60, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={()=>{setView("detail");setForm({});}} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Cancel</button>
        <span style={{ fontSize:14, fontWeight:800 }}>EDIT ATHLETE</span>
        <button onClick={saveEdit} style={{ background:"#1a6eff", border:"none", color:"#fff", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontSize:13, fontWeight:700 }}>SAVE</button>
      </div>
      <div style={{ padding:"20px 16px" }}>
        {[{l:"NAME",k:"name"},{l:"SPORT",k:"sport"},{l:"POSITION",k:"position"},{l:"AGE",k:"age"},{l:"WEIGHT (lbs)",k:"weight"},{l:"GOAL",k:"goal"},{l:"INJURIES",k:"injuries"},{l:"NOTES",k:"notes"}].map(field=>(
          <div key={field.k}><label style={{...lbl,color:"rgba(255,255,255,0.35)"}}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} style={{...inp,background:"#111",border:"1px solid #333"}}/></div>
        ))}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          <div><label style={{...lbl,color:"rgba(255,255,255,0.35)"}}>SESSIONS</label><input type="number" value={form.sessions||0} onChange={e=>f("sessions",parseInt(e.target.value)||0)} style={{...inp,background:"#111",border:"1px solid #333"}}/></div>
          <div><label style={{...lbl,color:"rgba(255,255,255,0.35)"}}>FREQ/WK</label><input type="number" value={form.freq||2} onChange={e=>f("freq",parseInt(e.target.value)||2)} style={{...inp,background:"#111",border:"1px solid #333"}}/></div>
          <div><label style={{...lbl,color:"rgba(255,255,255,0.35)"}}>VALUE $</label><input type="number" value={form.value||0} onChange={e=>f("value",parseFloat(e.target.value)||0)} style={{...inp,background:"#111",border:"1px solid #333"}}/></div>
        </div>
        <label style={{...lbl,color:"rgba(255,255,255,0.35)"}}>STATUS</label>
        <select value={form.status||"active"} onChange={e=>f("status",e.target.value)} style={{...inp,background:"#111",border:"1px solid #333"}}>
          {["active","urgent","inactive"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </main>
  );
  if (view === "detail" && sel) {
    const s = SC[sel.status]||SC.active;
    return (
      <main style={{ minHeight:"100vh", background:"#000", paddingBottom:60, fontFamily:"system-ui" }}>
        <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Roster</button>
          <button onClick={()=>{setForm({...sel});setView("edit");}} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid #333", color:"#fff", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:13 }}>✏️ Edit</button>
        </div>
        <div style={{ padding:"20px 16px" }}>
          <div style={{ background:s.bg, borderLeft:`4px solid ${s.color}`, border:`1px solid rgba(255,255,255,0.06)`, borderRadius:12, padding:"18px", marginBottom:14 }}>
            <div style={{ fontSize:24, fontWeight:900, marginBottom:4 }}>{sel.name}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>{sel.sport}{sel.position?` · ${sel.position}`:""}{sel.age?` · Age ${sel.age}`:""}</div>
            {sel.goal&&<div style={{ fontSize:13, color:"#1a6eff", marginTop:6 }}>🎯 {sel.goal}</div>}
            {sel.injuries&&<div style={{ fontSize:12, color:"#ff4444", marginTop:4 }}>⚠️ {sel.injuries}</div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:14 }}>
              {[{l:"SESSIONS",v:sel.sessions},{l:"FREQ/WK",v:`${sel.freq}x`},{l:"VALUE",v:sel.value>0?`$${sel.value.toLocaleString()}`:"—"}].map((item,i)=>(
                <div key={i} style={{ background:"rgba(255,255,255,0.06)", borderRadius:8, padding:"10px", textAlign:"center" }}>
                  <div style={{ fontSize:17, fontWeight:900 }}>{item.v}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", marginTop:2 }}>{item.l}</div>
                </div>
              ))}
            </div>
          </div>
          {sel.notes&&<div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid #222", borderRadius:12, padding:"14px", marginBottom:10, fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>{sel.notes}</div>}
          <Link href="/coach/agent" style={{ display:"block", textDecoration:"none", background:"#1a6eff", borderRadius:12, padding:"14px", textAlign:"center", fontSize:14, fontWeight:700, color:"#fff", marginTop:10 }}>⚡ Generate AI Content for {sel.name.split(" ")[0]}</Link>
        </div>
      </main>
    );
  }
  return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Link href="/coach/dashboard" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"none", fontSize:20 }}>←</Link>
            <div><div style={{ fontSize:16, fontWeight:800 }}>ATHLETE ROSTER</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{athletes.length} athletes{urgent>0?` · ${urgent} urgent`:""}</div></div>
          </div>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search athlete..." style={{...inp,background:"#111",border:"1px solid #333",marginBottom:10}}/>
        <div style={{ display:"flex", gap:8 }}>
          {["all","urgent","inactive","active"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:"5px 12px", borderRadius:100, background:filter===f?"#1a6eff":"rgba(255,255,255,0.04)", border:`1px solid ${filter===f?"#1a6eff":"#333"}`, color:filter===f?"#fff":"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, letterSpacing:"0.08em", cursor:"pointer", whiteSpace:"nowrap", textTransform:"uppercase" }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:"14px 16px" }}>
        {shown.map(a=>{
          const s = SC[a.status]||SC.active;
          return (
            <div key={a.id} onClick={()=>{setSel(a);setView("detail");}} style={{ background:"#111", border:"1px solid #222", borderLeft:`4px solid ${s.color}`, borderRadius:12, padding:"14px", marginBottom:10, cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div><div style={{ fontSize:16, fontWeight:700, marginBottom:2 }}>{a.name}</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{a.sport} · {a.freq}x/wk · {a.sessions} sessions</div></div>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", padding:"3px 8px", background:s.bg, color:s.color, borderRadius:4, textTransform:"uppercase" }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

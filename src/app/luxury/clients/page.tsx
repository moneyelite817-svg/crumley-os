"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
const STORAGE = "cros_clients_v1";
const SEED = [
  { id:"1", name:"Leston Eustache", type:"agent", phone:"", email:"", company:"@iamlestacks", notes:"Top DFW producer. Primary referral partner. 4 active listings.", totalJobs:4, totalRevenue:11000, createdAt:"" },
  { id:"2", name:"KC", type:"agent", phone:"", email:"", company:"", notes:"2 active listings on Dennison St. Dallas.", totalJobs:2, totalRevenue:5500, createdAt:"" },
];
const BLANK = { name:"", type:"agent", phone:"", email:"", company:"", notes:"", totalJobs:0, totalRevenue:0 };
const TC: Record<string,string> = { agent:"#1a6eff", builder:"#00d084", developer:"#f0c040", homeowner:"rgba(255,255,255,0.4)" };
const inp: any = { width:"100%", padding:"10px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", fontFamily:"system-ui", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 };
const lbl: any = { display:"block", fontFamily:"system-ui", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:4 };
export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [view, setView] = useState("list");
  const [sel, setSel] = useState<any>(null);
  const [form, setForm] = useState<any>({...BLANK});
  const [search, setSearch] = useState("");
  useEffect(() => { try { const s = localStorage.getItem(STORAGE); setItems(s ? JSON.parse(s) : SEED); } catch { setItems(SEED); } }, []);
  function save(data: any[]) { setItems(data); try { localStorage.setItem(STORAGE, JSON.stringify(data)); } catch {} }
  function f(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })); }
  function submit() {
    if (!form.name?.trim()) return;
    if (view === "edit" && sel) { const u = items.map((c:any) => c.id === sel.id ? { ...c, ...form } : c); save(u); setSel({ ...sel, ...form }); setView("detail"); }
    else { save([...items, { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() }]); setForm({...BLANK}); setView("list"); }
  }
  const shown = items.filter((c:any) => c.name.toLowerCase().includes(search.toLowerCase()));
  const totalRev = items.reduce((a:number, c:any) => a + (c.totalRevenue||0), 0);
  if (view === "add" || view === "edit") return (
    <main style={{ minHeight:"100vh", background:"#03060f", paddingBottom:60, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(3,6,15,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={() => { setView(view==="edit"?"detail":"list"); setForm({...BLANK}); }} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Cancel</button>
        <span style={{ fontSize:14, fontWeight:800 }}>{view==="edit"?"EDIT CLIENT":"NEW CLIENT"}</span>
        <button onClick={submit} style={{ background:"#1a6eff", border:"none", color:"#fff", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontSize:13, fontWeight:700 }}>SAVE</button>
      </div>
      <div style={{ padding:"20px 16px" }}>
        {[{l:"NAME *",k:"name"},{l:"COMPANY",k:"company"},{l:"PHONE",k:"phone"},{l:"EMAIL",k:"email"},{l:"NOTES",k:"notes"}].map(field => (
          <div key={field.k}><label style={lbl}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} style={inp}/></div>
        ))}
        <label style={lbl}>TYPE</label>
        <select value={form.type} onChange={e=>f("type",e.target.value)} style={{...inp}}>
          {["agent","builder","developer","homeowner"].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div><label style={lbl}>TOTAL JOBS</label><input type="number" value={form.totalJobs||0} onChange={e=>f("totalJobs",parseInt(e.target.value)||0)} style={inp}/></div>
          <div><label style={lbl}>REVENUE $</label><input type="number" value={form.totalRevenue||0} onChange={e=>f("totalRevenue",parseFloat(e.target.value)||0)} style={inp}/></div>
        </div>
      </div>
    </main>
  );
  if (view === "detail" && sel) {
    const color = TC[sel.type]||"#fff";
    return (
      <main style={{ minHeight:"100vh", background:"#03060f", paddingBottom:60, fontFamily:"system-ui" }}>
        <div style={{ background:"rgba(3,6,15,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Clients</button>
          <button onClick={()=>{setForm({...sel});setView("edit");}} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:13 }}>✏️ Edit</button>
        </div>
        <div style={{ padding:"20px 16px" }}>
          <div style={{ background:`${color}15`, border:`1px solid ${color}33`, borderRadius:14, padding:"20px", marginBottom:14 }}>
            <div style={{ fontSize:24, fontWeight:900, marginBottom:4 }}>{sel.name}</div>
            {sel.company&&<div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>{sel.company}</div>}
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", color, textTransform:"uppercase" }}>{sel.type}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:14 }}>
              {[{l:"TOTAL JOBS",v:sel.totalJobs},{l:"TOTAL REVENUE",v:`$${(sel.totalRevenue||0).toLocaleString()}`}].map((s,i)=>(
                <div key={i} style={{ background:"rgba(255,255,255,0.05)", borderRadius:10, padding:"12px", textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:900, color }}>{s.v}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.12em", marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          {[{l:"PHONE",v:sel.phone},{l:"EMAIL",v:sel.email},{l:"NOTES",v:sel.notes}].filter(i=>i.v).map((item,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"14px", marginBottom:8 }}>
              <div style={{...lbl,marginBottom:4}}>{item.l}</div>
              <div style={{ fontSize:14, color:"#fff" }}>{item.v}</div>
            </div>
          ))}
          <button onClick={()=>{if(!confirm("Delete?"))return;save(items.filter((c:any)=>c.id!==sel.id));setView("list");setSel(null);}} style={{ width:"100%", marginTop:14, background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.2)", color:"#ff6b6b", borderRadius:12, padding:"14px", cursor:"pointer", fontSize:13, fontWeight:700 }}>🗑 DELETE</button>
        </div>
      </main>
    );
  }
  return (
    <main style={{ minHeight:"100vh", background:"#03060f", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(3,6,15,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"14px 16px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Link href="/luxury/dashboard" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"none", fontSize:20 }}>←</Link>
            <div><div style={{ fontSize:16, fontWeight:800 }}>CLIENTS & AGENTS</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{items.length} contacts · ${totalRev.toLocaleString()} lifetime</div></div>
          </div>
          <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{ background:"#1a6eff", border:"none", color:"#fff", borderRadius:10, padding:"9px 16px", cursor:"pointer", fontSize:12, fontWeight:700 }}>+ ADD</button>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...inp,marginBottom:0}}/>
      </div>
      <div style={{ padding:"14px 16px" }}>
        {shown.length===0&&<div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.25)", fontSize:14 }}>No clients found.<br/><button onClick={()=>{setForm({...BLANK});setView("add");}} style={{ marginTop:16, background:"rgba(26,110,255,0.1)", border:"1px solid rgba(26,110,255,0.3)", color:"#1a6eff", borderRadius:10, padding:"10px 20px", cursor:"pointer", fontSize:13 }}>+ Add Client</button></div>}
        {shown.map((c:any)=>{
          const color = TC[c.type]||"#fff";
          return (
            <div key={c.id} onClick={()=>{setSel(c);setView("detail");}} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderLeft:`3px solid ${color}`, borderRadius:14, padding:"16px", marginBottom:10, cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div><div style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>{c.name}</div>{c.company&&<div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{c.company}</div>}<div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color, marginTop:4, textTransform:"uppercase" }}>{c.type}</div></div>
                <div style={{ textAlign:"right" }}><div style={{ fontSize:16, fontWeight:900, color:"#1a6eff" }}>${(c.totalRevenue||0).toLocaleString()}</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{c.totalJobs} jobs</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

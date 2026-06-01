"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
const STORAGE = "cros_invoices_v1";
const BLANK = { client:"", address:"", amount:0, amountPaid:0, status:"unpaid", dueDate:"", notes:"", payMethod:"" };
const SC: Record<string,{color:string,bg:string}> = { unpaid:{color:"#f0c040",bg:"rgba(240,192,64,0.1)"}, partial:{color:"#1a6eff",bg:"rgba(26,110,255,0.1)"}, paid:{color:"#00d084",bg:"rgba(0,208,132,0.1)"}, overdue:{color:"#ff4444",bg:"rgba(255,68,68,0.1)"} };
const inp: any = { width:"100%", padding:"10px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", fontFamily:"system-ui", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 };
const lbl: any = { display:"block", fontFamily:"system-ui", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:4 };
export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [view, setView] = useState("list");
  const [sel, setSel] = useState<any>(null);
  const [form, setForm] = useState<any>({...BLANK});
  const [filter, setFilter] = useState("all");
  useEffect(() => { try { const s = localStorage.getItem(STORAGE); setItems(s ? JSON.parse(s) : []); } catch { setItems([]); } }, []);
  function save(data: any[]) { setItems(data); try { localStorage.setItem(STORAGE, JSON.stringify(data)); } catch {} }
  function f(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })); }
  function submit() {
    if (!form.client?.trim()) return;
    if (view === "edit" && sel) { save(items.map((i:any) => i.id === sel.id ? { ...i, ...form } : i)); setSel({ ...sel, ...form }); setView("detail"); }
    else { save([...items, { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() }]); setForm({...BLANK}); setView("list"); }
  }
  const shown = items.filter((i:any) => filter === "all" || i.status === filter);
  const totalUnpaid = items.filter((i:any) => i.status !== "paid").reduce((a:number,i:any) => a + Math.max(0,(i.amount||0)-(i.amountPaid||0)), 0);
  const totalPaid = items.filter((i:any) => i.status === "paid").reduce((a:number,i:any) => a + (i.amount||0), 0);
  if (view === "add" || view === "edit") return (
    <main style={{ minHeight:"100vh", background:"#03060f", paddingBottom:60, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(3,6,15,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={()=>{setView(view==="edit"?"detail":"list");setForm({...BLANK});}} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Cancel</button>
        <span style={{ fontSize:14, fontWeight:800 }}>{view==="edit"?"EDIT INVOICE":"NEW INVOICE"}</span>
        <button onClick={submit} style={{ background:"#1a6eff", border:"none", color:"#fff", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontSize:13, fontWeight:700 }}>SAVE</button>
      </div>
      <div style={{ padding:"20px 16px" }}>
        <div style={{ background:"rgba(26,110,255,0.06)", border:"1px solid rgba(26,110,255,0.15)", borderRadius:12, padding:"16px", marginBottom:14 }}>
          <div style={{ fontSize:28, fontWeight:900, color:"#1a6eff", textAlign:"center" }}>${Math.max(0,(form.amount||0)-(form.amountPaid||0)).toLocaleString()}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", textAlign:"center", letterSpacing:"0.1em" }}>BALANCE DUE</div>
        </div>
        {[{l:"CLIENT NAME *",k:"client"},{l:"PROPERTY ADDRESS",k:"address"},{l:"PAYMENT METHOD",k:"payMethod"},{l:"NOTES",k:"notes"}].map(field=>(
          <div key={field.k}><label style={lbl}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} style={inp}/></div>
        ))}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div><label style={lbl}>INVOICE AMOUNT $</label><input type="number" value={form.amount||0} onChange={e=>f("amount",parseFloat(e.target.value)||0)} style={inp}/></div>
          <div><label style={lbl}>AMOUNT PAID $</label><input type="number" value={form.amountPaid||0} onChange={e=>f("amountPaid",parseFloat(e.target.value)||0)} style={inp}/></div>
        </div>
        <label style={lbl}>DUE DATE</label><input type="date" value={form.dueDate||""} onChange={e=>f("dueDate",e.target.value)} style={inp}/>
        <label style={lbl}>STATUS</label>
        <select value={form.status} onChange={e=>f("status",e.target.value)} style={{...inp}}>
          {["unpaid","partial","paid","overdue"].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>
    </main>
  );
  if (view === "detail" && sel) {
    const s = SC[sel.status]||SC.unpaid;
    const balance = Math.max(0,(sel.amount||0)-(sel.amountPaid||0));
    return (
      <main style={{ minHeight:"100vh", background:"#03060f", paddingBottom:60, fontFamily:"system-ui" }}>
        <div style={{ background:"rgba(3,6,15,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Invoices</button>
          <button onClick={()=>{setForm({...sel});setView("edit");}} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:13 }}>✏️ Edit</button>
        </div>
        <div style={{ padding:"20px 16px" }}>
          <div style={{ background:s.bg, border:`1px solid rgba(255,255,255,0.08)`, borderLeft:`4px solid ${s.color}`, borderRadius:12, padding:"16px", marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:s.color, marginBottom:8 }}>{sel.status.toUpperCase()}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[{l:"INVOICE",v:`$${(sel.amount||0).toLocaleString()}`},{l:"PAID",v:`$${(sel.amountPaid||0).toLocaleString()}`},{l:"BALANCE",v:`$${balance.toLocaleString()}`}].map((item,i)=>(
                <div key={i} style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:900, color:i===2?s.color:"#fff" }}>{item.v}</div><div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", marginTop:2 }}>{item.l}</div></div>
              ))}
            </div>
          </div>
          {[{l:"CLIENT",v:sel.client},{l:"ADDRESS",v:sel.address},{l:"DUE DATE",v:sel.dueDate},{l:"PAYMENT METHOD",v:sel.payMethod},{l:"NOTES",v:sel.notes}].filter(i=>i.v).map((item,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"14px", marginBottom:8 }}>
              <div style={{...lbl,marginBottom:4}}>{item.l}</div><div style={{ fontSize:14, color:"#fff" }}>{item.v}</div>
            </div>
          ))}
          <div style={{ display:"grid", gap:10, marginTop:14 }}>
            <button onClick={()=>{save(items.map((i:any)=>i.id===sel.id?{...i,status:"paid",amountPaid:i.amount}:i));setSel({...sel,status:"paid",amountPaid:sel.amount});}} style={{ background:"rgba(0,208,132,0.08)", border:"1px solid rgba(0,208,132,0.25)", color:"#00d084", borderRadius:12, padding:"14px", cursor:"pointer", fontSize:13, fontWeight:700 }}>✓ MARK AS PAID</button>
            <button onClick={()=>{if(!confirm("Delete?"))return;save(items.filter((i:any)=>i.id!==sel.id));setView("list");setSel(null);}} style={{ background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.2)", color:"#ff6b6b", borderRadius:12, padding:"14px", cursor:"pointer", fontSize:13, fontWeight:700 }}>🗑 DELETE</button>
          </div>
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
            <div><div style={{ fontSize:16, fontWeight:800 }}>INVOICES</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>${totalUnpaid.toLocaleString()} unpaid · ${totalPaid.toLocaleString()} collected</div></div>
          </div>
          <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{ background:"#1a6eff", border:"none", color:"#fff", borderRadius:10, padding:"9px 16px", cursor:"pointer", fontSize:12, fontWeight:700 }}>+ NEW</button>
        </div>
        <div style={{ display:"flex", gap:8, overflowX:"auto" }}>
          {["all","unpaid","partial","paid","overdue"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:"5px 12px", borderRadius:100, background:filter===f?"#1a6eff":"rgba(255,255,255,0.04)", border:`1px solid ${filter===f?"#1a6eff":"rgba(255,255,255,0.08)"}`, color:filter===f?"#fff":"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, letterSpacing:"0.08em", cursor:"pointer", whiteSpace:"nowrap", textTransform:"uppercase" }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:"14px 16px" }}>
        {shown.length===0&&<div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.25)", fontSize:14 }}>No invoices yet.<br/><button onClick={()=>{setForm({...BLANK});setView("add");}} style={{ marginTop:16, background:"rgba(26,110,255,0.1)", border:"1px solid rgba(26,110,255,0.3)", color:"#1a6eff", borderRadius:10, padding:"10px 20px", cursor:"pointer", fontSize:13 }}>+ Create Invoice</button></div>}
        {shown.map((inv:any)=>{
          const s = SC[inv.status]||SC.unpaid;
          const balance = Math.max(0,(inv.amount||0)-(inv.amountPaid||0));
          return (
            <div key={inv.id} onClick={()=>{setSel(inv);setView("detail");}} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderLeft:`3px solid ${s.color}`, borderRadius:14, padding:"16px", marginBottom:10, cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div><div style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>{inv.client||"No client"}</div>{inv.address&&<div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{inv.address}</div>}</div>
                <div style={{ textAlign:"right" }}><div style={{ fontSize:17, fontWeight:900, color:"#1a6eff" }}>${(inv.amount||0).toLocaleString()}</div>{balance>0&&<div style={{ fontSize:10, color:s.color, fontWeight:700 }}>${balance.toLocaleString()} due</div>}</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <span style={{ fontSize:10, background:s.bg, borderRadius:100, padding:"3px 9px", color:s.color, fontWeight:700 }}>{inv.status.toUpperCase()}</span>
                {inv.dueDate&&<span style={{ fontSize:10, background:"rgba(255,255,255,0.04)", borderRadius:100, padding:"3px 9px", color:"rgba(255,255,255,0.4)" }}>{inv.dueDate}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

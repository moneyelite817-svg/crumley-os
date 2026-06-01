"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE = "cros_invoices_v1";
const BLANK = {client:"",address:"",amount:0,amountPaid:0,status:"unpaid",dueDate:"",notes:"",payMethod:""};
const SC: Record<string,{color:string;bg:string}> = {unpaid:{color:"#f0c040",bg:"rgba(240,192,64,0.1)"},partial:{color:"#1a6eff",bg:"rgba(26,110,255,0.1)"},paid:{color:"#00d084",bg:"rgba(0,208,132,0.1)"},overdue:{color:"#ff4444",bg:"rgba(255,68,68,0.1)"}};
const inp: any = {width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10};
const lbl: any = {display:"block",fontFamily:"system-ui",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",marginBottom:4};

function AIPanel({ invoice, onClose }: { invoice: any; onClose: ()=>void }) {
  const [action, setAction] = useState<string|null>(null);
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const balance = invoice ? Math.max(0,(invoice.amount||0)-(invoice.amountPaid||0)) : 0;

  const actions = [
    {id:"reminder",icon:"💬",label:"Payment Reminder",desc:"Friendly nudge to pay outstanding balance"},
    {id:"collections",icon:"⚠️",label:"Collections Text",desc:`Firm collections message for $${balance.toLocaleString()} owed`},
    {id:"final",icon:"🚨",label:"Final Notice",desc:"Last notice before furniture pickup"},
    {id:"receipt",icon:"✅",label:"Payment Receipt",desc:"Confirm received payment professionally"},
    {id:"partialAsk",icon:"💰",label:"Partial Payment Ask",desc:"Ask for a deposit or partial payment now"},
  ];

  function buildPrompt() {
    const base = `You are the AI agent for All In One Luxury Designs — Terrance Crumley's premium DFW home staging.
Client: ${invoice?.client||"the client"}
Property: ${invoice?.address||"their property"}
Invoice total: $${invoice?.amount?.toLocaleString()||0}
Amount paid: $${invoice?.amountPaid?.toLocaleString()||0}
Balance due: $${balance.toLocaleString()}
Status: ${invoice?.status||"unpaid"}
Due date: ${invoice?.dueDate||"not specified"}
Payment method: ${invoice?.payMethod||"Zelle, Venmo, or Cash"}
Notes: ${invoice?.notes||"none"}
${extra?`\nContext: ${extra}`:""}`;

    if(action==="reminder") return `${base}\n\nWrite a friendly but clear payment reminder text to ${invoice?.client||"the client"}. State the balance of $${balance.toLocaleString()}. Mention Zelle, Venmo, or Cash. Keep it warm but firm. Under 4 sentences.`;
    if(action==="collections") return `${base}\n\nWrite a firm collections text. Balance is $${balance.toLocaleString()} and is overdue. Professional tone — not rude, but serious. Mention furniture pickup will be scheduled if not received. Include payment options. Under 4 sentences.`;
    if(action==="final") return `${base}\n\nWrite a final notice text. This is the last outreach before scheduling furniture pickup. State exactly what happens next if balance of $${balance.toLocaleString()} is not paid within 48 hours. Professional but non-negotiable. Under 4 sentences.`;
    if(action==="receipt") return `${base}\n\nWrite a short professional payment receipt confirmation text to ${invoice?.client||"the client"}. Thank them, confirm the amount received, and wish them well with the listing. Under 3 sentences.`;
    if(action==="partialAsk") return `${base}\n\nWrite a text asking ${invoice?.client||"the client"} if they can pay a partial amount now toward the $${balance.toLocaleString()} balance. Offer flexibility — even half now. Make it easy for them to say yes. Under 4 sentences.`;
    return base;
  }

  async function generate() {
    setLoading(true); setResult(""); setError("");
    try {
      const res = await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:buildPrompt()})});
      const data = await res.json();
      if(data.error) setError(data.message||data.error); else setResult(data.text);
    } catch { setError("Network error."); }
    setLoading(false);
  }

  function copy() { navigator.clipboard?.writeText(result); setCopied(true); setTimeout(()=>setCopied(false),2000); }

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.7)"}}/>
      <div style={{position:"relative",background:"#0d1628",borderRadius:"20px 20px 0 0",border:"1px solid rgba(26,110,255,0.3)",padding:"20px 16px 48px",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>⚡ AI COLLECTIONS</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>{invoice?.client||"Invoice"} · ${balance.toLocaleString()} due</div></div>
          <button onClick={()=>{if(action){setAction(null);setResult("");setError("");}else onClose();}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>{action?"← Back":"✕"}</button>
        </div>
        {!action&&actions.map(a=>(
          <div key={a.id} onClick={()=>setAction(a.id)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>{a.icon}</span>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#1a6eff",marginBottom:2}}>{a.label}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{a.desc}</div></div>
            <span style={{color:"rgba(255,255,255,0.2)",fontSize:16}}>›</span>
          </div>
        ))}
        {action&&!result&&!loading&&(
          <div>
            <label style={lbl}>Additional context (optional)</label>
            <textarea value={extra} onChange={e=>setExtra(e.target.value)} placeholder="Any specific context..." style={{...inp,height:60,resize:"none"}}/>
            <button onClick={generate} style={{width:"100%",background:"#1a6eff",border:"none",color:"#fff",borderRadius:12,padding:"16px",fontSize:15,fontWeight:900,cursor:"pointer"}}>⚡ GENERATE</button>
          </div>
        )}
        {loading&&<div style={{textAlign:"center",padding:"30px 0"}}><div style={{fontSize:32,marginBottom:12}}>🤖</div><div style={{fontSize:14,fontWeight:800,color:"#1a6eff",letterSpacing:"0.1em"}}>GENERATING...</div></div>}
        {error&&<div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10,padding:"12px",color:"#ff8888",fontSize:13}}>{error}</div>}
        {result&&(
          <div>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px",fontSize:14,lineHeight:1.8,color:"#fff",whiteSpace:"pre-wrap",marginBottom:12}}>{result}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
              <button onClick={()=>{setResult("");setError("");}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13}}>🔄 Redo</button>
              <button onClick={copy} style={{background:copied?"#00d084":"#1a6eff",border:"none",color:copied?"#000":"#fff",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:14,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [view, setView] = useState("list");
  const [sel, setSel] = useState<any>(null);
  const [form, setForm] = useState<any>({...BLANK});
  const [filter, setFilter] = useState("all");
  const [showAI, setShowAI] = useState(false);
  const [aiInv, setAiInv] = useState<any>(null);

  useEffect(()=>{try{const s=localStorage.getItem(STORAGE);setItems(s?JSON.parse(s):[]);}catch{setItems([]);}}, []);
  function persist(data: any[]) {setItems(data);try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch{}}
  function f(k:string,v:any){setForm((p:any)=>({...p,[k]:v}));}
  function submit() {
    if(!form.client?.trim()) return;
    if(view==="edit"&&sel){persist(items.map((i:any)=>i.id===sel.id?{...i,...form}:i));setSel({...sel,...form});setView("detail");}
    else{persist([...items,{...form,id:Date.now().toString(),createdAt:new Date().toISOString()}]);setForm({...BLANK});setView("list");}
  }
  const shown = items.filter((i:any)=>filter==="all"||i.status===filter);
  const totalUnpaid = items.filter((i:any)=>i.status!=="paid").reduce((a:number,i:any)=>a+Math.max(0,(i.amount||0)-(i.amountPaid||0)),0);
  const totalPaid = items.filter((i:any)=>i.status==="paid").reduce((a:number,i:any)=>a+(i.amount||0),0);

  if(view==="add"||view==="edit") return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>{setView(view==="edit"?"detail":"list");setForm({...BLANK});}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Cancel</button>
        <span style={{fontSize:14,fontWeight:800}}>{view==="edit"?"EDIT INVOICE":"NEW INVOICE"}</span>
        <button onClick={submit} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
      </div>
      <div style={{padding:"20px 16px"}}>
        <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.15)",borderRadius:12,padding:"16px",marginBottom:14,textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:900,color:"#1a6eff"}}>${Math.max(0,(form.amount||0)-(form.amountPaid||0)).toLocaleString()}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em"}}>BALANCE DUE</div>
        </div>
        {[{l:"CLIENT NAME *",k:"client"},{l:"PROPERTY ADDRESS",k:"address"},{l:"PAYMENT METHOD",k:"payMethod"},{l:"NOTES",k:"notes"}].map(field=>(
          <div key={field.k}><label style={lbl}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} style={inp}/></div>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={lbl}>INVOICE $</label><input type="number" value={form.amount||0} onChange={e=>f("amount",parseFloat(e.target.value)||0)} style={inp}/></div>
          <div><label style={lbl}>PAID $</label><input type="number" value={form.amountPaid||0} onChange={e=>f("amountPaid",parseFloat(e.target.value)||0)} style={inp}/></div>
        </div>
        <label style={lbl}>DUE DATE</label><input type="date" value={form.dueDate||""} onChange={e=>f("dueDate",e.target.value)} style={inp}/>
        <label style={lbl}>STATUS</label>
        <select value={form.status} onChange={e=>f("status",e.target.value)} style={{...inp}}>
          {["unpaid","partial","paid","overdue"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </main>
  );

  if(view==="detail"&&sel) {
    const s=SC[sel.status]||SC.unpaid; const balance=Math.max(0,(sel.amount||0)-(sel.amountPaid||0));
    return(
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Invoices</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiInv(sel);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...sel});setView("edit");}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>✏️</button>
          </div>
        </div>
        <div style={{padding:"20px 16px"}}>
          <div style={{background:s.bg,borderLeft:`4px solid ${s.color}`,border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"16px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:s.color,marginBottom:8}}>{sel.status.toUpperCase()}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[{l:"INVOICE",v:`$${(sel.amount||0).toLocaleString()}`},{l:"PAID",v:`$${(sel.amountPaid||0).toLocaleString()}`},{l:"BALANCE",v:`$${balance.toLocaleString()}`}].map((item,i)=>(
                <div key={i} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:i===2?s.color:"#fff"}}>{item.v}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginTop:2}}>{item.l}</div></div>
              ))}
            </div>
          </div>
          {[{l:"CLIENT",v:sel.client},{l:"ADDRESS",v:sel.address},{l:"DUE DATE",v:sel.dueDate},{l:"PAYMENT METHOD",v:sel.payMethod},{l:"NOTES",v:sel.notes}].filter(i=>i.v).map((item,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"14px",marginBottom:8}}>
              <div style={{...lbl,marginBottom:4}}>{item.l}</div><div style={{fontSize:14,color:"#fff"}}>{item.v}</div>
            </div>
          ))}
          <div style={{display:"grid",gap:10,marginTop:14}}>
            {balance>0&&<button onClick={()=>{setAiInv(sel);setShowAI(true);}} style={{background:"linear-gradient(135deg,#1a6eff,#0d4fd4)",border:"none",color:"#fff",borderRadius:12,padding:"16px",cursor:"pointer",fontSize:15,fontWeight:900}}>⚡ AI AGENT — Collect ${balance.toLocaleString()}</button>}
            <button onClick={()=>{persist(items.map((i:any)=>i.id===sel.id?{...i,status:"paid",amountPaid:i.amount}:i));setSel({...sel,status:"paid",amountPaid:sel.amount});}} style={{background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.25)",color:"#00d084",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ MARK PAID</button>
            <button onClick={()=>{if(!confirm("Delete?"))return;persist(items.filter((i:any)=>i.id!==sel.id));setView("list");setSel(null);}} style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🗑 DELETE</button>
          </div>
        </div>
        {showAI&&<AIPanel invoice={aiInv} onClose={()=>{setShowAI(false);setAiInv(null);}}/>}
      </main>
    );
  }

  return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Link href="/luxury/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
            <div><div style={{fontSize:16,fontWeight:800}}>INVOICES</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>${totalUnpaid.toLocaleString()} unpaid · ${totalPaid.toLocaleString()} collected</div></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiInv(null);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ NEW</button>
          </div>
        </div>
        <div style={{display:"flex",gap:8,overflowX:"auto"}}>
          {["all","unpaid","partial","paid","overdue"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:100,background:filter===f?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${filter===f?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:filter===f?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:"0.08em",cursor:"pointer",whiteSpace:"nowrap",textTransform:"uppercase"}}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {shown.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.25)",fontSize:14}}>No invoices.<br/><button onClick={()=>{setForm({...BLANK});setView("add");}} style={{marginTop:16,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13}}>+ Create Invoice</button></div>}
        {shown.map((inv:any)=>{
          const s=SC[inv.status]||SC.unpaid; const balance=Math.max(0,(inv.amount||0)-(inv.amountPaid||0));
          return(
            <div key={inv.id} onClick={()=>{setSel(inv);setView("detail");}} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`3px solid ${s.color}`,borderRadius:14,padding:"14px",marginBottom:10,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div><div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{inv.client||"No client"}</div>{inv.address&&<div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{inv.address}</div>}</div>
                <div style={{textAlign:"right"}}><div style={{fontSize:17,fontWeight:900,color:"#1a6eff"}}>${(inv.amount||0).toLocaleString()}</div>{balance>0&&<div style={{fontSize:10,color:s.color,fontWeight:700}}>${balance.toLocaleString()} due</div>}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <span style={{fontSize:10,background:s.bg,borderRadius:100,padding:"3px 9px",color:s.color,fontWeight:700}}>{inv.status.toUpperCase()}</span>
                {balance>0&&<button onClick={e=>{e.stopPropagation();setAiInv(inv);setShowAI(true);}} style={{fontSize:10,background:"rgba(26,110,255,0.12)",borderRadius:100,padding:"3px 9px",color:"#1a6eff",fontWeight:700,border:"1px solid rgba(26,110,255,0.25)",cursor:"pointer"}}>⚡ Collect</button>}
              </div>
            </div>
          );
        })}
      </div>
      {showAI&&<AIPanel invoice={aiInv} onClose={()=>{setShowAI(false);setAiInv(null);}}/>}
    </main>
  );
}

"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function LuxuryDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAction, setAiAction] = useState<string|null>(null);
  const [showAgent, setShowAgent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(()=>{
    try{const s=localStorage.getItem("cros_luxury_jobs_v3");if(s)setJobs(JSON.parse(s));}catch{}
    try{const s=localStorage.getItem("cros_invoices_v1");if(s)setInvoices(JSON.parse(s));}catch{}
    try{const s=localStorage.getItem("cros_inventory_v1");if(s)setInventory(JSON.parse(s));}catch{}
  },[]);

  const activeJobs = jobs.filter(j=>{
    if(j.status==="completed")return false;
    if(!j.endDate)return true;
    return Math.ceil((new Date(j.endDate).getTime()-Date.now())/86400000)>0;
  });
  const expiring = jobs.filter(j=>{
    if(!j.endDate||j.status==="completed")return false;
    const d=Math.ceil((new Date(j.endDate).getTime()-Date.now())/86400000);
    return d>=0&&d<=14;
  });
  const unpaid = invoices.filter(i=>i.status!=="paid").reduce((a:number,i:any)=>a+Math.max(0,(i.amount||0)-(i.amountPaid||0)),0);
  const stagingRevenue = activeJobs.reduce((a:number,j:any)=>a+(j.price||0),0);
  const inventoryValue = inventory.filter(i=>!i.soldDisposed).reduce((a:number,i:any)=>a+((i.currentValue||i.purchasePrice||0)*(i.quantity||1)),0);

  const AGENT_ACTIONS = [
    {id:"today",   icon:"📋",label:"What needs attention today?", prompt:""},
    {id:"unpaid",  icon:"💰",label:"Who owes a balance?",         prompt:""},
    {id:"pickup",  icon:"📦",label:"Which pickups are overdue?",  prompt:""},
    {id:"followup",icon:"👋",label:"Who should I follow up with?",prompt:""},
    {id:"urgent",  icon:"🔥",label:"Most urgent job right now?",  prompt:""},
    {id:"revenue", icon:"📈",label:"Total unpaid balance?",       prompt:""},
  ];

  async function runAgent(actionId:string){
    setAiLoading(true);setAiResult("");setAiAction(actionId);
    const jobSummary=jobs.map(j=>`${j.address?.split(",")[0]}(${j.agent},price:$${j.price},deposit:$${j.deposit},balance:$${Math.max(0,(j.price||0)-(j.deposit||0))},endDate:${j.endDate||"none"},status:${j.status})`).join("|");
    const today=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
    const base=`You are the AI business agent for All In One Luxury Designs (Terrance Crumley). Full-turnkey DFW home staging. $2,750 installs, $1,450 transfers, 90-day terms. Today: ${today}.\n\nAll jobs: ${jobSummary}\nTotal unpaid balance: $${unpaid.toLocaleString()}\nExpiring soon: ${expiring.map(j=>j.address?.split(",")[0]).join(", ")||"none"}\n\n`;

    const prompts:Record<string,string>={
      today:`${base}What are the top 3 actions Terrance needs to take TODAY for his staging business? Be specific with property addresses and amounts. Direct, no fluff.`,
      unpaid:`${base}List every job with an outstanding balance. Show: property, agent, balance amount, days since install. What's the most overdue and what should Terrance say to collect? Draft the exact text for the #1 collections priority.`,
      pickup:`${base}Which jobs are overdue for pickup or past their 90-day end date? List them and recommend immediate next steps.`,
      followup:`${base}Which client or agent is most overdue for a follow-up? Consider: last contact, upcoming renewals, balance due. Write the exact follow-up message to send right now.`,
      urgent:`${base}What is the single most urgent staging job right now and why? Consider: overdue balance, expiring staging period, pickup needed, client communication gap. What's the #1 action to take?`,
      revenue:`${base}Give a complete revenue breakdown: active jobs total, unpaid balances, average time on market. What's the fastest path to collecting outstanding money this week?`,
    };

    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:prompts[actionId]})});
      const d=await r.json();
      if(d.error)setAiResult("Error: "+d.message);else setAiResult(d.text);
    }catch{setAiResult("Network error.");}
    setAiLoading(false);
  }

  const MODULES=[
    {href:"/luxury/jobs",      icon:"🏠",l:"STAGING JOBS",  s:`${activeJobs.length} active · $${stagingRevenue.toLocaleString()}`,c:"#1a6eff"},
    {href:"/luxury/moving",    icon:"🚛",l:"MOVING",        s:"Estimates + logistics",c:"#4a8fff"},
    {href:"/luxury/clients",   icon:"🤝",l:"CLIENTS",       s:"Agents + builders",c:"#1a6eff"},
    {href:"/luxury/invoices",  icon:"🧾",l:"INVOICES",      s:unpaid>0?`$${unpaid.toLocaleString()} unpaid`:"All clear",c:unpaid>0?"#f0c040":"#00d084"},
    {href:"/luxury/inventory", icon:"📦",l:"INVENTORY",     s:`$${inventoryValue.toLocaleString()} tracked`,c:"#9b59b6"},
    {href:"/luxury/revenue",   icon:"💰",l:"REVENUE",       s:"Analytics + insights",c:"#00d084"},
  ];

  return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:40,fontFamily:"system-ui"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(150deg,#0a1628,#03060f)",borderBottom:"3px solid #1A5CCC",padding:"28px 16px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:10,letterSpacing:"0.2em",color:"#1A5CCC",fontWeight:700,marginBottom:4}}>ALL IN ONE LUXURY DESIGNS</div>
            <div style={{fontSize:26,fontWeight:900,lineHeight:1.1}}>BUSINESS<br/><span style={{color:"#1A5CCC"}}>COMMAND CENTER</span></div>
          </div>
          <Link href="/dashboard" style={{color:"rgba(255,255,255,0.35)",textDecoration:"none",fontSize:12}}>← Master</Link>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
          {[
            {l:"ACTIVE JOBS",v:activeJobs.length,c:"#1A5CCC"},
            {l:"EXPIRING",v:expiring.length,c:expiring.length>0?"#f0c040":"rgba(255,255,255,0.3)"},
            {l:"UNPAID",v:`$${(unpaid/1000).toFixed(1)}k`,c:unpaid>0?"#f0c040":"#00d084"},
            {l:"INVENTORY",v:`$${(inventoryValue/1000).toFixed(0)}k`,c:"#9b59b6"},
          ].map((s,i)=>(
            <div key={i} style={{background:`${s.c}18`,border:`1px solid ${s.c}44`,borderRadius:10,padding:"10px 6px",textAlign:"center" as const}}>
              <div style={{fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em",marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"16px"}}>
        {/* ASK AGENT */}
        <div style={{background:"rgba(26,92,204,0.04)",border:"1px solid rgba(26,92,204,0.2)",borderRadius:16,padding:"16px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:900,color:"#1A5CCC"}}>⚡ ASK AGENT</div>
            {aiResult&&<button onClick={()=>{setAiResult("");setAiAction(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:11}}>← Back</button>}
          </div>
          {!aiResult&&!aiLoading&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {AGENT_ACTIONS.map(a=>(
                <div key={a.id} onClick={()=>runAgent(a.id)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"10px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>{a.icon}</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#1A5CCC",lineHeight:1.3}}>{a.label}</span>
                </div>
              ))}
            </div>
          )}
          {aiLoading&&<div style={{textAlign:"center",padding:"20px"}}><div style={{fontSize:28,marginBottom:8}}>⚙️</div><div style={{fontSize:13,fontWeight:800,color:"#1A5CCC",letterSpacing:"0.1em"}}>ANALYZING...</div></div>}
          {aiResult&&(
            <div>
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px",fontSize:13,lineHeight:1.8,color:"#fff",whiteSpace:"pre-wrap",marginBottom:12}}>{aiResult}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
                <button onClick={()=>{if(aiAction)runAgent(aiAction);}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:12}}>🔄 Redo</button>
                <button onClick={()=>{navigator.clipboard?.writeText(aiResult);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{background:copied?"#00d084":"#1A5CCC",border:"none",color:copied?"#000":"#fff",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {expiring.length>0&&(
          <div style={{background:"rgba(240,192,64,0.06)",border:"1px solid rgba(240,192,64,0.2)",borderRadius:14,padding:"14px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#f0c040",letterSpacing:"0.1em",marginBottom:10}}>⏰ EXPIRING SOON</div>
            {expiring.map((j:any)=>{
              const d=Math.ceil((new Date(j.endDate).getTime()-Date.now())/86400000);
              return(
                <Link key={j.id} href="/luxury/jobs" style={{textDecoration:"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(240,192,64,0.08)"}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{j.address?.split(",")[0]}</div>
                    <div style={{fontSize:11,color:"#f0c040",fontWeight:700}}>{d}d left</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Module grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {MODULES.map((m,i)=>(
            <Link key={i} href={m.href} style={{textDecoration:"none"}}>
              <div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${m.c}33`,borderRadius:14,padding:"16px",minHeight:90}}>
                <div style={{fontSize:24,marginBottom:8}}>{m.icon}</div>
                <div style={{fontSize:12,fontWeight:800,color:m.c,marginBottom:3,lineHeight:1.2}}>{m.l}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{m.s}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

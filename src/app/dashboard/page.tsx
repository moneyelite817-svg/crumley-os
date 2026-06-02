"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function MasterDashboard() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    try { const s = localStorage.getItem("cros_luxury_jobs_v3"); if(s) setJobs(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem("ct_clients"); if(s) setAthletes(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem("cros_invoices_v1"); if(s) setInvoices(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem("cros_schedule_v1"); if(s) setScheduleEvents(JSON.parse(s)); } catch {}
  }, []);

  const urgentJobs = jobs.filter(j => {
    if (!j.endDate) return false;
    const days = Math.ceil((new Date(j.endDate).getTime() - Date.now()) / 86400000);
    return days <= 14 && days >= 0;
  });
  const unpaidBalance = invoices.filter(i => i.status !== "paid").reduce((a:number, i:any) => a + Math.max(0,(i.amount||0)-(i.amountPaid||0)), 0);
  const urgentAthletes = athletes.filter(a => a.status === "urgent");
  const activeJobs = jobs.filter(j => j.status !== "completed");
  const stagingRevenue = activeJobs.reduce((a:number, j:any) => a + (j.price||j.value||0), 0);
  const today = new Date().toISOString().split("T")[0];
  const todayEvents = scheduleEvents.filter(e => e.date === today);
  const todayD1 = [2,3].includes(new Date().getDay());

  async function generateBrief() {
    setLoading(true); setBrief(""); setError("");
    const stagingSummary = activeJobs.map(j=>`${j.address?.split(",")[0]||"job"}($${j.price||0},balance:$${Math.max(0,(j.price||0)-(j.deposit||0))})`).join("|");
    const athleteSummary = athletes.slice(0,8).map(a=>`${a.name}(${a.sessions}sess,${a.status})`).join("|");
    const scheduleSummary = todayEvents.map(e=>`${e.title}@${e.startTime}`).join("|")||"nothing scheduled today";
    const prompt = `You are the Master AI Agent for Crumley OS — Terrance Crumley's DFW business operating system.

Today: ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
${todayD1?"🔒 D1 TRAINING LOCKED 5:45-7:45 PM TONIGHT":""}

BUSINESS DATA:
Active Staging Jobs: ${activeJobs.length} (${stagingSummary||"none"})
Unpaid Balance: $${unpaidBalance.toLocaleString()}
Urgent Staging Renewals (≤14 days): ${urgentJobs.map(j=>j.address?.split(",")[0]).join(", ")||"none"}
Athletes: ${athletes.length} total, ${urgentAthletes.length} urgent
Today's Schedule: ${scheduleSummary}

Generate the DAILY COMMAND BRIEF:
1. 🎯 TOP 3 PRIORITIES (numbered, specific, actionable)
2. 💰 MONEY IN MOTION (what revenue is at risk or available today)
3. ⚡ FIRST ACTION (the single most important thing to do right now)
4. 📅 SCHEDULE NOTE (anything about today's calendar worth noting)

Executive tone. Direct. Under 12 sentences total.`;

    try {
      const res = await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});
      const data = await res.json();
      if(data.error) setError(data.message||data.error); else setBrief(data.text);
    } catch { setError("Network error."); }
    setLoading(false);
  }

  function copy(){navigator.clipboard?.writeText(brief);setCopied(true);setTimeout(()=>setCopied(false),2000);}

  const MODULES = [
    {href:"/luxury/dashboard",  icon:"🏠", label:"ALL IN ONE LUXURY",    sub:"Staging + Moving",       color:"#1a6eff"},
    {href:"/coach/dashboard",   icon:"💪", label:"ELITE SKILLZ LAB",     sub:"Training + Athletes",    color:"#00d084"},
    {href:"/schedule",          icon:"📅", label:"SCHEDULE",              sub:"Book + conflict check",  color:"#4a8fff"},
    {href:"/coach/program",     icon:"📋", label:"PROGRAMMING",           sub:"Build workouts",         color:"#00d084"},
    {href:"/ai",                icon:"🤖", label:"AI SKILLS CENTER",      sub:"All 35+ skills",         color:"#9b59b6"},
    {href:"/coach/agent",       icon:"⚡", label:"COACH AGENT",           sub:"Athlete AI actions",     color:"#1a6eff"},
  ];

  return (
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:40,fontFamily:"system-ui"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(150deg,#001133,#000)",borderBottom:"3px solid #1a6eff",padding:"28px 16px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:11,letterSpacing:"0.2em",color:"#1a6eff",fontWeight:700}}>CRUMLEY OS</div>
            <div style={{fontSize:30,fontWeight:900,lineHeight:1.1,marginTop:4}}>COMMAND<br/>CENTER</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:4}}>
              {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
            </div>
          </div>
          <div style={{textAlign:"right" as const}}>
            {todayD1 && <div style={{fontSize:10,background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",borderRadius:8,padding:"4px 10px",color:"#1a6eff",fontWeight:700,marginBottom:6}}>🔒 D1 TONIGHT</div>}
          </div>
        </div>

        {/* KPI Row */}
        {mounted && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
            {[
              {l:"STAGING",   v:`$${(stagingRevenue/1000).toFixed(0)}k`, c:"#1a6eff"},
              {l:"UNPAID",    v:`$${(unpaidBalance/1000).toFixed(1)}k`,  c:unpaidBalance>0?"#f0c040":"#00d084"},
              {l:"ATHLETES",  v:athletes.length,                          c:"#00d084"},
              {l:"TODAY",     v:todayEvents.length,                       c:"#4a8fff"},
            ].map((s,i)=>(
              <div key={i} style={{background:`${s.c}18`,border:`1px solid ${s.c}44`,borderRadius:10,padding:"10px 6px",textAlign:"center" as const}}>
                <div style={{fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em",marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{padding:"16px"}}>

        {/* Today's Schedule Strip */}
        {mounted && todayEvents.length > 0 && (
          <div style={{background:"rgba(26,110,255,0.05)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:14,padding:"14px",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:"#1a6eff"}}>📅 TODAY'S SCHEDULE</div>
              <Link href="/schedule" style={{fontSize:11,color:"rgba(26,110,255,0.7)",textDecoration:"none",fontWeight:700}}>View all →</Link>
            </div>
            {todayEvents.map((e:any,i:number)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<todayEvents.length-1?"1px solid rgba(26,110,255,0.08)":"none"}}>
                <div>
                  <span style={{fontSize:13,fontWeight:700}}>{e.title}</span>
                  {e.address&&<span style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginLeft:8}}>{e.address.split(",")[0]}</span>}
                </div>
                <span style={{fontSize:12,color:"#1a6eff",fontWeight:700}}>
                  {e.startTime?e.startTime.split(":").slice(0,2).join(":")+" "+( parseInt(e.startTime)>=12?"PM":"AM"):""}
                  {e.price>0&&<span style={{fontSize:10,color:"#00d084",marginLeft:6}}>${e.price}</span>}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Alerts */}
        {mounted && (urgentJobs.length > 0 || unpaidBalance > 0 || urgentAthletes.length > 0) && (
          <div style={{background:"rgba(255,68,68,0.06)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:14,padding:"14px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#ff4444",letterSpacing:"0.1em",marginBottom:10}}>🚨 NEEDS ATTENTION</div>
            {urgentJobs.length > 0 && <div style={{fontSize:13,color:"#fff",marginBottom:6}}>⏰ {urgentJobs.length} staging job{urgentJobs.length>1?"s":""} expiring in 14 days</div>}
            {unpaidBalance > 0 && <div style={{fontSize:13,color:"#fff",marginBottom:6}}>💰 ${unpaidBalance.toLocaleString()} unpaid balance — collect now</div>}
            {urgentAthletes.length > 0 && <div style={{fontSize:13,color:"#fff"}}>🏃 {urgentAthletes.length} athlete{urgentAthletes.length>1?"s":""} running out of sessions</div>}
          </div>
        )}

        {/* AI Daily Brief */}
        <div style={{background:"rgba(26,110,255,0.04)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:16,padding:"16px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:900,color:"#1a6eff"}}>⚡ MASTER AGENT BRIEF</div>
            {brief && <button onClick={()=>setBrief("")} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:11}}>← Reset</button>}
          </div>

          {!brief && !loading && (
            <button onClick={generateBrief} style={{width:"100%",background:"linear-gradient(135deg,#1a6eff,#0d4fd4)",border:"none",color:"#fff",borderRadius:12,padding:"15px",fontSize:14,fontWeight:900,cursor:"pointer",letterSpacing:"0.05em"}}>
              ⚡ GENERATE TODAY'S COMMAND BRIEF
            </button>
          )}
          {loading && <div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:28,marginBottom:8}}>⚙️</div><div style={{fontSize:13,fontWeight:800,color:"#1a6eff",letterSpacing:"0.1em"}}>BRIEFING ALL AGENTS...</div></div>}
          {error && <div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10,padding:"12px",color:"#ff8888",fontSize:13}}>{error}</div>}
          {brief && (
            <div>
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px",fontSize:13,lineHeight:1.85,color:"#fff",whiteSpace:"pre-wrap",marginBottom:12}}>{brief}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
                <button onClick={()=>{setBrief("");generateBrief();}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:12}}>🔄 Refresh</button>
                <button onClick={copy} style={{background:copied?"#00d084":"#1a6eff",border:"none",color:copied?"#000":"#fff",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
              </div>
            </div>
          )}
        </div>

        {/* Module Grid */}
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase" as const,marginBottom:12}}>ALL MODULES</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {MODULES.map((m,i)=>(
            <Link key={i} href={m.href} style={{textDecoration:"none"}}>
              <div style={{background:"#111",border:`1px solid ${m.color}33`,borderRadius:14,padding:"16px",minHeight:90}}>
                <div style={{fontSize:24,marginBottom:8}}>{m.icon}</div>
                <div style={{fontSize:12,fontWeight:800,color:m.color,marginBottom:3,lineHeight:1.2}}>{m.label}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{m.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

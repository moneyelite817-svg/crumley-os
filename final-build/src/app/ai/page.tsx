"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ══════════════════════════════════════════════════════
// CONSOLIDATED AGENT STRUCTURE
// 6 agents. No duplicates. No overlap.
// ══════════════════════════════════════════════════════
const AGENTS = [
  {
    id:"master", icon:"🧠", title:"Master Agent",
    subtitle:"Daily brief · Priorities · Cross-business decisions",
    color:"#1a6eff", route:"/dashboard",
    actions:[
      {id:"brief",     icon:"📋", label:"Today's Command Brief",  desc:"Top priorities across all businesses"},
      {id:"revenue",   icon:"💰", label:"Revenue Status",         desc:"Total pipeline, unpaid, weekly goal"},
      {id:"urgent",    icon:"🚨", label:"Most Urgent Item",       desc:"Single highest priority right now"},
      {id:"growth",    icon:"📈", label:"Top Growth Move",        desc:"Highest leverage action this week"},
    ]
  },
  {
    id:"scheduling", icon:"📅", title:"Scheduling Agent",
    subtitle:"Calendar · Bookings · Conflicts · Availability",
    color:"#4a8fff", route:"/schedule",
    actions:[
      {id:"today",     icon:"☀️", label:"Today's Schedule",       desc:"What's on the calendar"},
      {id:"week",      icon:"🗺", label:"Optimize This Week",     desc:"Fill gaps, cluster appointments"},
      {id:"openSlots", icon:"💡", label:"Best Times to Book",     desc:"Available coaching slots"},
      {id:"conflicts", icon:"⚠️", label:"Conflict Scan",          desc:"Overlaps or D1 lock issues"},
    ]
  },
  {
    id:"luxury", icon:"🏠", title:"All In One Luxury Agent",
    subtitle:"Staging · Moving · Invoices · Contracts · Inventory",
    color:"#1A5CCC", route:"/luxury/dashboard",
    actions:[
      {id:"urgent",    icon:"🔥", label:"Urgent Jobs",            desc:"Expiring or overdue staging"},
      {id:"collect",   icon:"💰", label:"Collections",            desc:"Who owes and what to say"},
      {id:"renew",     icon:"🔄", label:"Renewals Needed",        desc:"Jobs needing 90-day extension"},
      {id:"followup",  icon:"💬", label:"Agent Follow-Up",        desc:"Who to reach out to today"},
    ]
  },
  {
    id:"esl", icon:"💪", title:"Elite Skillz Lab Agent",
    subtitle:"Athletes · Roster · Sessions · Renewals · Progression",
    color:"#00d084", route:"/coach/dashboard",
    actions:[
      {id:"roster",    icon:"👥", label:"Roster Status",          desc:"Sessions low, urgent renewals"},
      {id:"goal",      icon:"💵", label:"$800/Week Check",        desc:"Gap to weekly revenue target"},
      {id:"renewals",  icon:"⚠️", label:"Renewal Priorities",    desc:"Who to contact first and what to say"},
      {id:"reEngage",  icon:"🔁", label:"Re-Engage Inactive",    desc:"Athletes who've gone quiet"},
    ]
  },
  {
    id:"programming", icon:"📋", title:"Programming Agent",
    subtitle:"Workout generation ONLY — single session, weekly, 4-week, 8-week",
    color:"#9b59b6", route:"/coach/program",
    actions:[
      {id:"goto",      icon:"⚡", label:"Open Programming Agent", desc:"Full session builder with all types"},
      {id:"single",    icon:"🏋️", label:"Quick Session Tip",     desc:"What type of session fits today"},
      {id:"4week",     icon:"🗓", label:"4-Week Program Advice",  desc:"Periodization guidance for athlete"},
      {id:"combine",   icon:"🎯", label:"Combine Prep Focus",     desc:"Position-specific priorities"},
    ]
  },
  {
    id:"task", icon:"✅", title:"Task Agent",
    subtitle:"Follow-ups · Reminders · Renewals · Unpaid balances",
    color:"#e74c3c", route:"/dashboard",
    actions:[
      {id:"overdue",   icon:"🚨", label:"Overdue Actions",       desc:"What's past due across all businesses"},
      {id:"today",     icon:"☀️", label:"Today's Action List",   desc:"Numbered, specific, executable"},
      {id:"tasks",     icon:"➕", label:"Create Follow-Up Tasks", desc:"5 tasks to create right now"},
      {id:"revenue",   icon:"💵", label:"Revenue-Tied Tasks",    desc:"Actions that directly make money"},
    ]
  },
];

function buildLiveContext(jobs:any[], athletes:any[], inventory:any[]) {
  const unpaid = jobs.reduce((a:number,j:any)=>a+Math.max(0,(j.price||0)-(j.deposit||0)),0);
  const expiring = jobs.filter((j:any)=>{if(!j.endDate)return false;const d=Math.ceil((new Date(j.endDate).getTime()-Date.now())/86400000);return d>=0&&d<=14;});
  const urgent = athletes.filter((a:any)=>a.status==="urgent"||a.sessions<=2);
  const today = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const jobList = jobs.filter((j:any)=>j.status!=="completed").map((j:any)=>`${j.address?.split(",")[0]}($${j.price||0},dep:$${j.deposit||0},bal:$${Math.max(0,(j.price||0)-(j.deposit||0))},agent:${j.agent||"?"},end:${j.endDate||"none"})`).join("|");
  const athleteList = athletes.map((a:any)=>`${a.name}(${a.sessions}sess,${a.status},${a.freq}x/wk)`).join("|");
  return `CRUMLEY OS LIVE DATA — ${today}
All In One Luxury: ${jobs.filter((j:any)=>j.status!=="completed").length} active jobs | $${unpaid.toLocaleString()} unpaid | ${expiring.length} expiring (14d)
Jobs: ${jobList||"none"}
Elite Skillz Lab: ${athletes.length} athletes | ${urgent.length} urgent/low sessions
Athletes: ${athleteList||"none"}
Inventory: ${inventory.filter((i:any)=>!i.soldDisposed).length} active items`;
}

function buildPrompt(agentId:string, actionId:string, ctx:string): string {
  const base = `You are the ${agentId} AI inside Crumley OS — Terrance Crumley's DFW business OS.\n${ctx}\n\n`;
  const P: Record<string,string> = {
    "master-brief":       `${base}Executive command brief. Top 3 priorities across ALL businesses today. Specific with addresses and amounts. No fluff.`,
    "master-revenue":     `${base}Revenue status. Staging pipeline, unpaid balances, coaching gap to $800/week. Fastest path to money this week.`,
    "master-urgent":      `${base}Single most urgent item across all businesses right now. One action. Be specific.`,
    "master-growth":      `${base}Highest-leverage growth move this week. ONE action with exact steps. Staging + coaching + moving.`,
    "scheduling-today":   `${base}What should today's schedule look like? Any D1 locked blocks (Tue/Wed 5:45-7:45PM)? What appointments to book?`,
    "scheduling-week":    `${base}Optimize this week. Cluster staging visits by area, fill coaching slots, protect D1 blocks. Specific.`,
    "scheduling-openSlots":`${base}Recommend 3 best time slots this week for new revenue appointments. Consider D1 locks, drive time, energy.`,
    "scheduling-conflicts":`${base}Scan for scheduling conflicts or gaps. D1 blocks, back-to-back issues, staging visits needing coordination.`,
    "luxury-urgent":      `${base}Which staging jobs need immediate attention? Expiring, overdue, unpaid. Priority order with addresses.`,
    "luxury-collect":     `${base}Collections. Who owes, how much, how long. Write the exact text to send to #1 priority right now.`,
    "luxury-renew":       `${base}Which staging jobs need 90-day renewal? List in priority order. Write renewal pitch for most valuable job.`,
    "luxury-followup":    `${base}Which agent is most overdue for follow-up? What to say? Write the exact message.`,
    "esl-roster":         `${base}Roster status. Who needs sessions? Who's running low (≤3 sessions)? Priority action list today.`,
    "esl-goal":           `${base}Coach T's goal: $800/week from training. Current gap analysis. Top 3 actions to close the gap this week.`,
    "esl-renewals":       `${base}Urgent athlete renewals. Who to contact first. Write the exact renewal text for highest-priority athlete.`,
    "esl-reEngage":       `${base}Inactive athletes most likely to return. Write re-engagement message for highest-probability athlete.`,
    "programming-goto":   `${base}You handle workout generation. Navigate to /coach/program to build a full session, weekly block, 4-week, or 8-week program. What type does Coach T need most right now based on roster data?`,
    "programming-single": `${base}What type of session would be most effective today for the most active athlete? Single paragraph recommendation.`,
    "programming-4week":  `${base}Periodization advice for a 4-week program. What phases, loading parameters, testing days work best for DFW athletes training ${athletes.length > 0 ? Math.round(athletes.reduce((a:number,x:any)=>a+(x.freq||2),0)/Math.max(athletes.length,1)) : 2}x/week on DB+bands?`,
    "programming-combine":`${base}Combine prep priorities. Which athlete is most combine-ready? What's their position and biggest gap to D1 standards?`,
    "task-overdue":       `${base}What's most overdue across all businesses? Staging renewals, athlete follow-ups, unpaid invoices. Priority order.`,
    "task-today":         `${base}Today's action list for Terrance. Staging + coaching + moving + communications. Numbered, specific, executable.`,
    "task-tasks":         `${base}5 specific follow-up tasks to create today with due dates. Across all businesses.`,
    "task-revenue":       `${base}Revenue-generating actions to prioritize today. Rank by dollar value and ease of execution.`,
  };
  return P[`${agentId}-${actionId}`] || `${base}Help with ${agentId} — ${actionId}. Specific, actionable guidance for Terrance Crumley's DFW businesses.`;
}

export default function AISkillsCenter() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selAgent, setSelAgent] = useState<typeof AGENTS[0]|null>(null);
  const [selAction, setSelAction] = useState<any>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(()=>{
    try{const s=localStorage.getItem("cros_luxury_jobs_v3");if(s)setJobs(JSON.parse(s));}catch{}
    try{const s=localStorage.getItem("ct_clients");if(s)setAthletes(JSON.parse(s));}catch{}
    try{const s=localStorage.getItem("cros_inventory_v1");if(s)setInventory(JSON.parse(s));}catch{}
  },[]);

  async function run(agent:typeof AGENTS[0], action:any) {
    // Programming agent goto opens the page directly
    if(agent.id==="programming"&&action.id==="goto"){
      window.location.href="/coach/program";return;
    }
    setSelAgent(agent);setSelAction(action);setResult("");setError("");setLoading(true);
    const ctx=buildLiveContext(jobs,athletes,inventory);
    const prompt=buildPrompt(agent.id,action.id,ctx);
    try{
      const res=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});
      const data=await res.json();
      if(data.error)setError(data.message||data.error);else setResult(data.text);
    }catch{setError("Network error.");}
    setLoading(false);
  }

  function copy(){navigator.clipboard?.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);}

  // ── RESULT VIEW ──
  if(selAction&&(result||loading||error)) return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>{setSelAction(null);setResult("");setError("");setLoading(false);}} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:selAgent?.color||"#1a6eff"}}>{selAgent?.icon} {selAction.icon} {selAction.label}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{selAgent?.title}</div>
        </div>
      </div>
      <div style={{padding:"16px"}}>
        {loading&&<div style={{textAlign:"center",padding:"50px 0"}}><div style={{fontSize:44,marginBottom:16}}>⚙️</div><div style={{fontSize:15,fontWeight:900,color:selAgent?.color||"#1a6eff",letterSpacing:"0.1em"}}>READING LIVE DATA...</div><div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:8}}>Analyzing your actual jobs and athletes</div></div>}
        {error&&<div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:12,padding:"16px",color:"#ff8888",fontSize:13,lineHeight:1.6}}>{error}</div>}
        {result&&(
          <div>
            <div style={{background:"#0d0d14",border:`1px solid ${selAgent?.color||"#1a6eff"}22`,borderRadius:16,padding:"20px",fontSize:14,lineHeight:1.95,color:"#fff",whiteSpace:"pre-wrap",marginBottom:16}}>
              {result}
            </div>
            {selAgent?.route&&(
              <Link href={selAgent.route} style={{textDecoration:"none",display:"block",marginBottom:12}}>
                <div style={{background:`${selAgent.color}15`,border:`1px solid ${selAgent.color}33`,borderRadius:12,padding:"14px",textAlign:"center",fontSize:14,fontWeight:700,color:selAgent.color}}>
                  → Open {selAgent.title.replace(" Agent","")}
                </div>
              </Link>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
              <button onClick={()=>run(selAgent!,selAction)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🔄 Refresh</button>
              <button onClick={copy} style={{background:copied?"#00d084":selAgent?.color||"#1a6eff",border:"none",color:copied?"#000":"#fff",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:15,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );

  // ── AGENT DETAIL ──
  if(selAgent&&!selAction) return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setSelAgent(null)} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Agents</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:800,color:selAgent.color}}>{selAgent.icon} {selAgent.title}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{selAgent.subtitle}</div>
        </div>
        <Link href={selAgent.route} style={{textDecoration:"none"}}>
          <div style={{background:`${selAgent.color}15`,border:`1px solid ${selAgent.color}33`,borderRadius:8,padding:"6px 12px",fontSize:12,color:selAgent.color,fontWeight:700}}>Open →</div>
        </Link>
      </div>
      <div style={{padding:"16px"}}>
        <div style={{background:`${selAgent.color}10`,border:`1px solid ${selAgent.color}22`,borderRadius:14,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:32,marginBottom:8}}>{selAgent.icon}</div>
          <div style={{fontSize:18,fontWeight:900,marginBottom:4}}>{selAgent.title}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.5}}>{selAgent.subtitle}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:8}}>Reads live data from localStorage · {selAgent.actions.length} actions</div>
        </div>
        {selAgent.actions.map(action=>(
          <div key={action.id} onClick={()=>run(selAgent,action)} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${selAgent.color}22`,borderRadius:14,padding:"16px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
            <span style={{fontSize:28}}>{action.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:selAgent.color,marginBottom:3}}>{action.label}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{action.desc}</div>
            </div>
            <span style={{color:"rgba(255,255,255,0.2)",fontSize:20}}>›</span>
          </div>
        ))}
      </div>
    </main>
  );

  // ── MAIN GRID ──
  const activeJobs=jobs.filter((j:any)=>j.status!=="completed").length;
  const unpaidAmt=jobs.reduce((a:number,j:any)=>a+Math.max(0,(j.price||0)-(j.deposit||0)),0);
  const urgentAthletes=athletes.filter((a:any)=>a.status==="urgent"||a.sessions<=2).length;

  return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Link href="/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
          <div>
            <div style={{fontSize:16,fontWeight:900}}>AI SKILLS CENTER</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>6 agents · no duplicates · reads live data</div>
          </div>
        </div>
      </div>

      <div style={{padding:"16px"}}>
        {/* Live data strip */}
        <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.15)",borderRadius:14,padding:"14px",marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"#1a6eff",marginBottom:8}}>⚡ LIVE CONTEXT LOADED</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
            {[{l:"JOBS",v:activeJobs,c:"#1a6eff"},{l:"UNPAID",v:`$${(unpaidAmt/1000).toFixed(1)}k`,c:unpaidAmt>0?"#f0c040":"#00d084"},{l:"ATHLETES",v:athletes.length,c:"#00d084"},{l:"URGENT",v:urgentAthletes,c:urgentAthletes>0?"#ff4444":"#00d084"}].map((s,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em"}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:12}}>SELECT AGENT</div>

        {AGENTS.map(agent=>(
          <div key={agent.id} onClick={()=>setSelAgent(agent)} style={{background:`${agent.color}08`,border:`1px solid ${agent.color}25`,borderRadius:14,padding:"16px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
            <span style={{fontSize:32}}>{agent.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:800,color:agent.color,marginBottom:2}}>{agent.title}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{agent.subtitle}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              <span style={{color:"rgba(255,255,255,0.2)",fontSize:20}}>›</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,0.2)"}}>{agent.actions.length} actions</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

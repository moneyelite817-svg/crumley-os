"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface AgentAction {
  id: string; icon: string; label: string; desc: string; prompt?: string;
}

interface Agent {
  id: string; icon: string; title: string; subtitle: string; color: string;
  route?: string; actions: AgentAction[];
}

const AGENTS: Agent[] = [
  {
    id: "master", icon: "🧠", title: "Master Agent", subtitle: "Executive command center",
    color: "#1a6eff", route: "/dashboard",
    actions: [
      {id:"brief",     icon:"📋", label:"Daily Command Brief",     desc:"Today's priorities across all businesses"},
      {id:"revenue",   icon:"💰", label:"Revenue Status",          desc:"Total pipeline and unpaid balances"},
      {id:"conflicts", icon:"⚠️", label:"Urgent Items",            desc:"What needs action right now"},
      {id:"growth",    icon:"📈", label:"Growth Opportunity",      desc:"Top move to make this week"},
    ]
  },
  {
    id: "scheduling", icon: "📅", title: "Scheduling Agent", subtitle: "Calendar and conflict prevention",
    color: "#4a8fff", route: "/schedule",
    actions: [
      {id:"today",    icon:"☀️", label:"Today's Schedule",         desc:"What's on the calendar today"},
      {id:"optimize", icon:"🗺", label:"Optimize This Week",       desc:"Gaps, clusters, revenue opportunities"},
      {id:"bestTime", icon:"💡", label:"Best Times to Book",       desc:"Recommend open slots this week"},
      {id:"conflicts",icon:"🚨", label:"Conflict Scan",            desc:"Any overlapping events or issues"},
    ]
  },
  {
    id: "luxury", icon: "🏠", title: "All In One Luxury Agent", subtitle: "Staging operations",
    color: "#1A5CCC", route: "/luxury/dashboard",
    actions: [
      {id:"urgent",    icon:"🔥", label:"Urgent Jobs",             desc:"Expiring or overdue staging jobs"},
      {id:"collections",icon:"💰",label:"Collections",             desc:"Who owes a balance and what to say"},
      {id:"renewals",  icon:"🔄", label:"Renewals Needed",         desc:"Jobs needing 90-day extension"},
      {id:"followup",  icon:"💬", label:"Follow-Up Messages",      desc:"Agent outreach for active listings"},
    ]
  },
  {
    id: "moving", icon: "🚛", title: "Moving Agent", subtitle: "Logistics and estimates",
    color: "#4a8fff", route: "/luxury/moving",
    actions: [
      {id:"estimate",  icon:"📊", label:"Draft Estimate",          desc:"Generate moving quote message"},
      {id:"leadgen",   icon:"📨", label:"Generate Leads",          desc:"Outreach to referral sources"},
      {id:"profit",    icon:"💵", label:"Profit Analysis",         desc:"Low-margin jobs to watch"},
      {id:"referral",  icon:"🤝", label:"Referral Request",        desc:"Ask Leston or agents for moving referrals"},
    ]
  },
  {
    id: "esl", icon: "💪", title: "Elite Skillz Lab Agent", subtitle: "Athlete development",
    color: "#00d084", route: "/coach/dashboard",
    actions: [
      {id:"roster",    icon:"👥", label:"Roster Status",           desc:"Who needs sessions and renewals"},
      {id:"revenue",   icon:"💵", label:"$800 Goal Check",         desc:"Gap to weekly revenue target"},
      {id:"urgent",    icon:"🔥", label:"Urgent Renewals",         desc:"Athletes running out of sessions"},
      {id:"inactive",  icon:"🔁", label:"Re-Engage Inactive",      desc:"Bring back quiet athletes"},
    ]
  },
  {
    id: "programming", icon: "📋", title: "Programming Agent", subtitle: "Training curriculum builder",
    color: "#00d084", route: "/coach/program",
    actions: [
      {id:"build",     icon:"⚡", label:"Build Workout",           desc:"Generate elite session plan"},
      {id:"week",      icon:"📅", label:"Weekly Block",            desc:"5-day training week"},
      {id:"4week",     icon:"🗓", label:"4-Week Program",          desc:"Progressive monthly block"},
      {id:"combine",   icon:"🎯", label:"Combine Prep",            desc:"NFL/NCAA combine standards"},
    ]
  },
  {
    id: "invoice", icon: "🧾", title: "Invoice & Contracts Agent", subtitle: "Document generator",
    color: "#1A5CCC", route: "/luxury/jobs",
    actions: [
      {id:"invoice",   icon:"💸", label:"Generate Invoice",        desc:"Create invoice from job data"},
      {id:"contract",  icon:"📄", label:"Staging Agreement",       desc:"Generate liability contract"},
      {id:"balance",   icon:"⚠️", label:"Balance Reminder",        desc:"Collect outstanding payment"},
      {id:"renewal",   icon:"🔄", label:"Renewal Agreement",       desc:"90-day extension document"},
    ]
  },
  {
    id: "inventory", icon: "📦", title: "Inventory Agent", subtitle: "Asset tracking",
    color: "#9b59b6", route: "/luxury/inventory",
    actions: [
      {id:"value",     icon:"💰", label:"Inventory Value",         desc:"Total tracked asset value"},
      {id:"damaged",   icon:"⚠️", label:"Damaged Items",           desc:"Items needing attention"},
      {id:"assigned",  icon:"📍", label:"Assigned to Jobs",        desc:"What's currently deployed"},
      {id:"reorder",   icon:"🛒", label:"What to Replace",         desc:"Missing or sold items to restock"},
    ]
  },
  {
    id: "comms", icon: "💬", title: "Client Communication Agent", subtitle: "Messages and outreach",
    color: "#f39c12", route: "/luxury/clients",
    actions: [
      {id:"checkIn",   icon:"👋", label:"Agent Check-In",          desc:"Stay top of mind with realtors"},
      {id:"newListing",icon:"🏠", label:"New Listing Pitch",       desc:"Ask agents about upcoming listings"},
      {id:"thankYou",  icon:"🙏", label:"Thank You Message",       desc:"Appreciate business or referrals"},
      {id:"coldOutreach",icon:"📨",label:"Cold Outreach",          desc:"Intro to new agents or builders"},
    ]
  },
  {
    id: "task", icon: "✅", title: "Task Agent", subtitle: "Follow-up and execution",
    color: "#e74c3c", route: "/dashboard",
    actions: [
      {id:"overdue",   icon:"🚨", label:"Overdue Actions",         desc:"Tasks past their due date"},
      {id:"today",     icon:"☀️", label:"Today's Action List",     desc:"What to execute right now"},
      {id:"create",    icon:"➕", label:"Create Follow-Up Task",   desc:"Add a new task from current context"},
      {id:"revenue",   icon:"💵", label:"Revenue Tasks",           desc:"Actions tied to collecting money"},
    ]
  },
];

// ── LIVE DATA CONTEXT ──
function buildContext(jobs:any[], athletes:any[], invoices:any[], inventory:any[]) {
  const unpaid = invoices.filter((i:any)=>i.status!=="paid").reduce((a:number,i:any)=>a+Math.max(0,(i.amount||0)-(i.amountPaid||0)),0);
  const urgentAthletes = athletes.filter((a:any)=>a.status==="urgent");
  const expiring = jobs.filter((j:any)=>{if(!j.endDate)return false;const d=Math.ceil((new Date(j.endDate).getTime()-Date.now())/86400000);return d>=0&&d<=14;});
  const today = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  return `Today: ${today}. Active staging: ${jobs.filter(j=>j.status!=="completed").length} jobs ($${jobs.filter(j=>j.status!=="completed").reduce((a:number,j:any)=>a+(j.price||0),0).toLocaleString()}). Unpaid: $${unpaid.toLocaleString()}. Expiring (14d): ${expiring.map((j:any)=>j.address?.split(",")[0]).join(",")||"none"}. Athletes: ${athletes.length} total (${urgentAthletes.length} urgent). Inventory: ${inventory.filter(i=>!i.soldDisposed).length} active items.`;
}

function buildPrompt(agentId:string, actionId:string, context:string): string {
  const base = `You are the ${agentId} AI agent inside Crumley OS — Terrance Crumley's DFW business operating system.\n\nLIVE DATA: ${context}\n\n`;
  const prompts: Record<string, string> = {
    "master-brief": `${base}Generate today's executive command brief. Top 3 priorities across ALL businesses (staging, moving, coaching). What needs action RIGHT NOW? Be specific with amounts and names.`,
    "master-revenue": `${base}Revenue status report. Active staging pipeline, unpaid balances, coaching revenue gap to $800/week target. What's the fastest path to collecting money this week?`,
    "master-conflicts": `${base}What is the single most urgent item across all businesses today? Staging, coaching, collections, scheduling. One specific action to take immediately.`,
    "master-growth": `${base}Single highest-impact growth move this week across all businesses. Staging + moving + Elite Skillz Lab. ONE action with exact steps.`,
    "scheduling-today": `${base}Based on the current schedule and business context, what should today's schedule look like? Any D1 locked blocks? What appointments should be booked?`,
    "scheduling-optimize": `${base}How should this week be optimized? Cluster staging visits by area, fill coaching slots, protect D1 blocks. Specific recommendations.`,
    "scheduling-bestTime": `${base}Recommend the 3 best time slots this week to add new revenue-generating appointments. Consider D1 locks, drive time, energy management.`,
    "scheduling-conflicts": `${base}Scan for any scheduling conflicts or gaps. Check D1 blocks, back-to-back appointments, staging visits that need coordination.`,
    "luxury-urgent": `${base}Which staging jobs need immediate attention? Expiring staging periods, overdue pickups, unpaid balances. Priority order with specific addresses.`,
    "luxury-collections": `${base}Collections report. Who owes a balance, how much, and how long overdue? Write the exact text to send to the #1 collection priority right now.`,
    "luxury-renewals": `${base}Which staging jobs need 90-day renewal? List them in priority order. Write a renewal pitch for the most valuable job.`,
    "luxury-followup": `${base}Which agent or client is most overdue for a follow-up? What should Terrance say? Write the exact message.`,
    "moving-estimate": `${base}Guide Terrance on creating a moving estimate. What information to gather, how to price it, and write a professional estimate message template.`,
    "moving-leadgen": `${base}Generate a lead generation strategy for the moving company. Who to contact, what to say, how to leverage Leston Eustache's realtor network.`,
    "moving-profit": `${base}What factors should Terrance watch to ensure moving jobs are profitable? Key metrics, red flags, and pricing guidance.`,
    "moving-referral": `${base}Write a referral request message to Leston Eustache asking him to recommend the moving company to clients who are closing on homes.`,
    "esl-roster": `${base}Elite Skillz Lab roster status. Who needs sessions? Who's running low? Who's been inactive? Priority action list for today.`,
    "esl-revenue": `${base}Coach T's goal is $800/week from training. Current situation based on data. Gap analysis. Top 3 actions to close the gap this week.`,
    "esl-urgent": `${base}Urgent athlete renewals at Elite Skillz Lab. Who to contact first and what to say. Write the exact renewal text for the highest-priority athlete.`,
    "esl-inactive": `${base}Inactive athletes at Elite Skillz Lab. Who is most likely to return? Write a re-engagement message for the highest-probability athlete.`,
    "invoice-invoice": `${base}Guide Terrance on generating an invoice. Go to All In One Luxury → Jobs → tap any job → Documents tab → Generate Invoice. The invoice will auto-fill from job data.`,
    "invoice-contract": `${base}The staging agreement is ready. Go to All In One Luxury → Jobs → tap any job → Documents tab → Generate Staging Agreement. It auto-fills the property address, owner, fees, and liability terms.`,
    "invoice-balance": `${base}Write a professional balance reminder message template that Terrance can customize. Include the amount placeholder, payment methods (Zelle/Venmo/Cash), and a polite but firm tone.`,
    "invoice-renewal": `${base}Write a staging renewal offer message for an agent whose 90-day term is expiring. Professional, direct, include the $1,450 transfer rate and make it easy to say yes.`,
    "inventory-value": `${base}Inventory summary. What categories of items are tracked? Estimated total value. What should Terrance know about his inventory assets?`,
    "inventory-damaged": `${base}Any damaged or missing inventory items need immediate attention. How should Terrance handle damage claims from property owners? What's the process?`,
    "inventory-assigned": `${base}Guide Terrance on how to track which furniture is at which property. Inventory → tap item → Assign to Job. This helps prevent lost items.`,
    "inventory-reorder": `${base}What inventory does a successful staging company typically need? Categories to prioritize, approximate costs, sourcing recommendations for DFW market.`,
    "comms-checkIn": `${base}Write a warm professional check-in text to a top DFW realtor (Leston Eustache style). Stay top of mind, reference active listings, open door for new staging business. Under 4 sentences.`,
    "comms-newListing": `${base}Write a text asking a DFW real estate agent if they have upcoming listings that need staging. Reference All In One Luxury Designs. Mention $2,750 full install rate. Under 4 sentences.`,
    "comms-thankYou": `${base}Write a genuine thank you message to a realtor who just referred staging business. Specific, warm, builds the relationship. Under 3 sentences.`,
    "comms-coldOutreach": `${base}Write a cold outreach intro message to a new DFW real estate agent. Introduce All In One Luxury Designs, mention full-turnkey staging at $2,750, fast turnaround, Leston Eustache as a partner reference. Professional and confident. Under 5 sentences.`,
    "task-overdue": `${base}What actions are most overdue across all of Terrance's businesses? Staging renewals, athlete follow-ups, unpaid invoices, scheduling gaps. Priority order.`,
    "task-today": `${base}Build today's action list for Terrance. Staging, coaching, moving, communications. Numbered, specific, executable. What to do in what order.`,
    "task-create": `${base}Based on the current business state, what follow-up tasks should Terrance create today? List 5 specific actionable tasks with due dates.`,
    "task-revenue": `${base}What revenue-generating actions should Terrance prioritize today across all businesses? Rank by dollar value and ease of execution.`,
  };
  return prompts[`${agentId}-${actionId}`] || `${base}Help with: ${agentId} — ${actionId}. Provide specific, actionable guidance for Terrance Crumley's DFW businesses.`;
}

export default function AISkillsCenter() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selAgent, setSelAgent] = useState<Agent|null>(null);
  const [selAction, setSelAction] = useState<AgentAction|null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(()=>{
    try{const s=localStorage.getItem("cros_luxury_jobs_v3");if(s)setJobs(JSON.parse(s));}catch{}
    try{const s=localStorage.getItem("ct_clients");if(s)setAthletes(JSON.parse(s));}catch{}
    try{const s=localStorage.getItem("cros_invoices_v1");if(s)setInvoices(JSON.parse(s));}catch{}
    try{const s=localStorage.getItem("cros_inventory_v1");if(s)setInventory(JSON.parse(s));}catch{}
  },[]);

  async function runAction(agent:Agent, action:AgentAction) {
    setSelAgent(agent);
    setSelAction(action);
    setResult("");
    setError("");
    setLoading(true);
    const ctx = buildContext(jobs, athletes, invoices, inventory);
    const prompt = buildPrompt(agent.id, action.id, ctx);
    try {
      const res = await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});
      const data = await res.json();
      if(data.error) setError(data.message||data.error);
      else setResult(data.text);
    } catch { setError("Network error."); }
    setLoading(false);
  }

  function copy(){navigator.clipboard?.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);}

  // ── RESULT VIEW ──
  if(selAction && (result || loading || error)) return (
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>{setSelAction(null);setResult("");setError("");setLoading(false);}} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:selAgent?.color||"#1a6eff"}}>{selAgent?.icon} {selAction.icon} {selAction.label}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{selAgent?.title}</div>
        </div>
      </div>
      <div style={{padding:"16px"}}>
        {loading&&<div style={{textAlign:"center",padding:"50px 0"}}><div style={{fontSize:44,marginBottom:16}}>⚙️</div><div style={{fontSize:15,fontWeight:900,color:selAgent?.color||"#1a6eff",letterSpacing:"0.1em"}}>ANALYZING LIVE DATA...</div><div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:8}}>Reading your actual business data</div></div>}
        {error&&<div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:12,padding:"16px",color:"#ff8888",fontSize:13,lineHeight:1.6}}>{error}</div>}
        {result&&(
          <div>
            <div style={{background:"#0d0d14",border:`1px solid ${selAgent?.color||"#1a6eff"}22`,borderRadius:16,padding:"20px",fontSize:14,lineHeight:1.9,color:"#fff",whiteSpace:"pre-wrap",marginBottom:16}}>
              {result}
            </div>
            {selAgent?.route&&(
              <Link href={selAgent.route} style={{textDecoration:"none",display:"block",marginBottom:12}}>
                <div style={{background:`${selAgent.color}15`,border:`1px solid ${selAgent.color}33`,borderRadius:12,padding:"14px",textAlign:"center",fontSize:14,fontWeight:700,color:selAgent.color}}>
                  → Open {selAgent.title.replace(" Agent","").replace(" Center","")}
                </div>
              </Link>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
              <button onClick={()=>runAction(selAgent!,selAction!)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🔄 Refresh</button>
              <button onClick={copy} style={{background:copied?"#00d084":selAgent?.color||"#1a6eff",border:"none",color:copied?"#000":"#fff",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:15,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );

  // ── AGENT DETAIL ──
  if(selAgent && !selAction) return (
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setSelAgent(null)} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Agents</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:800,color:selAgent.color}}>{selAgent.icon} {selAgent.title}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{selAgent.subtitle}</div>
        </div>
        {selAgent.route?(
          <Link href={selAgent.route} style={{textDecoration:"none"}}>
            <div style={{background:`${selAgent.color}15`,border:`1px solid ${selAgent.color}33`,borderRadius:8,padding:"6px 12px",fontSize:12,color:selAgent.color,fontWeight:700}}>Open →</div>
          </Link>
        ):<div style={{width:60}}/>}
      </div>
      <div style={{padding:"16px"}}>
        <div style={{background:`${selAgent.color}10`,border:`1px solid ${selAgent.color}22`,borderRadius:14,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:32,marginBottom:8}}>{selAgent.icon}</div>
          <div style={{fontSize:18,fontWeight:900,marginBottom:4}}>{selAgent.title}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{selAgent.subtitle}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:6}}>
            Reading live data from your app • {selAgent.actions.length} actions available
          </div>
        </div>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:12}}>ACTIONS</div>
        {selAgent.actions.map(action=>(
          <div key={action.id} onClick={()=>runAction(selAgent,action)} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${selAgent.color}22`,borderRadius:14,padding:"16px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
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
  return (
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
          <Link href="/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
          <div>
            <div style={{fontSize:16,fontWeight:900}}>AI SKILLS CENTER</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{AGENTS.length} agents · reads live business data</div>
          </div>
        </div>
      </div>

      <div style={{padding:"16px"}}>
        {/* Live data summary */}
        <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.15)",borderRadius:14,padding:"14px",marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"#1a6eff",marginBottom:8}}>⚡ LIVE DATA LOADED</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
            {[{l:"JOBS",v:jobs.length},{l:"ATHLETES",v:athletes.length},{l:"INVOICES",v:invoices.length},{l:"INVENTORY",v:inventory.length}].map((s,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:900,color:"#1a6eff"}}>{s.v}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em"}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:12}}>SELECT AGENT</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {AGENTS.map(agent=>(
            <div key={agent.id} onClick={()=>setSelAgent(agent)} style={{background:`${agent.color}10`,border:`1px solid ${agent.color}33`,borderRadius:14,padding:"16px",cursor:"pointer"}}>
              <div style={{fontSize:28,marginBottom:8}}>{agent.icon}</div>
              <div style={{fontSize:13,fontWeight:800,color:agent.color,marginBottom:3,lineHeight:1.2}}>{agent.title}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{agent.subtitle}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:6}}>{agent.actions.length} actions →</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

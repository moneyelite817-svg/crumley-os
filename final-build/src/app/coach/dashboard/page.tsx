"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function CoachDashboard() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAction, setAiAction] = useState<string|null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(()=>{
    try{const s=localStorage.getItem("ct_clients");if(s)setAthletes(JSON.parse(s));}catch{}
    try{const s=localStorage.getItem("ct_sessions_v2");if(s)setSessions(JSON.parse(s));}catch{}
    try{const s=localStorage.getItem("ct_workout_completions");if(s)setCompletions(JSON.parse(s));}catch{}
  },[]);

  const urgent=athletes.filter(a=>a.status==="urgent"||(a.sessions<=2&&a.status!=="inactive"));
  const today=new Date().toISOString().split("T")[0];
  const todayStr=new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});
  const isD1Day=[2,3].includes(new Date().getDay());
  const todaySessions=sessions.filter(s=>s.date===today);
  const totalSessions=athletes.reduce((a:number,x:any)=>a+(x.sessions||0),0);

  async function runAI(action:string){
    setAiAction(action);setAiLoading(true);setAiResult("");
    const roster=athletes.map(a=>`${a.name}(${a.sessions}sess,${a.status},${a.freq}x)`).join(",");
    const urgentList=urgent.map(a=>a.name).join(",");
    const prompts:Record<string,string>={
      brief:`Coach T — Elite Skillz Lab 🧪 | D1 Hulen FW | ${todayStr} | ${isD1Day?"D1 LOCKED 5:45-7:45PM":""}\nAthletes: ${roster}\nUrgent renewals: ${urgentList||"none"}\nToday's sessions: ${todaySessions.length}\n\nTop 3 coaching priorities today. Who to contact first. What session to prioritize. Be specific with names.`,
      revenue:`Coach T | $800/week goal. $25/hr + 10% commission.\nRoster: ${roster}\nUrgent: ${urgentList||"none"}\nTotal sessions in bank: ${totalSessions}\n\nRevenue gap analysis. How close to $800/week? Top 3 actions to close the gap? Who to call first?`,
      renewals:`Coach T | Elite Skillz Lab 🧪\nUrgent athletes (≤2 sessions): ${urgentList||"none"}\nAll: ${roster}\n\nRenewal priority list. Who to contact in what order. Exact text to send to #1 renewal priority right now.`,
      content:`Coach T | Elite Skillz Lab 🧪 | DFW | ${todayStr}\nActive athletes: ${athletes.length} | Sports: ${[...new Set(athletes.map(a=>a.sport).filter(Boolean))].join(",")}\n\nGenerate 3 Instagram content ideas for today. Mix: athlete spotlight, training tip, motivational. Include hashtags. #EliteSkillzLab #D1Training #DFWAthletes`,
    };
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:prompts[action]||prompts.brief})});
      const d=await r.json();
      if(d.error)setAiResult("Error: "+d.message);else setAiResult(d.text);
    }catch{setAiResult("Network error.");}
    setAiLoading(false);
  }

  function copy(){navigator.clipboard?.writeText(aiResult);setCopied(true);setTimeout(()=>setCopied(false),2000);}

  // All routes verified before linking
  const MODULES=[
    {href:"/coach/roster",    icon:"👥",label:"ATHLETE ROSTER",  sub:`${athletes.length} athletes${urgent.length>0?` · ${urgent.length} urgent`:""}`,       color:"#1a6eff"},
    {href:"/coach/schedule",  icon:"📅",label:"SCHEDULE",        sub:todaySessions.length>0?`${todaySessions.length} session${todaySessions.length!==1?"s":""} today`:"Check calendar",color:"#4a8fff"},
    {href:"/coach/program",   icon:"💪",label:"PROGRAMMING",     sub:"Workouts · 4-week · 8-week",                                                            color:"#00d084"},
    {href:"/ai",              icon:"🤖",label:"AI SKILLS CENTER",sub:"6 agents · all businesses",                                                              color:"#9b59b6"},
  ];

  return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:40,fontFamily:"system-ui"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(150deg,#001a0a,#03060f)",borderBottom:"3px solid #00d084",padding:"28px 16px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:10,letterSpacing:"0.2em",color:"#00d084",fontWeight:700,marginBottom:4}}>ELITE SKILLZ LAB 🧪</div>
            <div style={{fontSize:26,fontWeight:900,lineHeight:1.1}}>COACHING<br/><span style={{color:"#00d084"}}>COMMAND CENTER</span></div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:4}}>{todayStr}{isD1Day?" · 🔒 D1 locked 5:45-7:45PM":""}</div>
          </div>
          <Link href="/dashboard" style={{color:"rgba(255,255,255,0.35)",textDecoration:"none",fontSize:12}}>← Master</Link>
        </div>
        {/* KPI row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
          {[
            {l:"ATHLETES",    v:athletes.length,           c:"#00d084"},
            {l:"URGENT",      v:urgent.length,             c:urgent.length>0?"#ff4444":"rgba(255,255,255,0.3)"},
            {l:"SESSIONS TODAY",v:todaySessions.length,    c:todaySessions.length>0?"#f0c040":"rgba(255,255,255,0.3)"},
            {l:"COMPLETED",   v:completions.length,        c:"#00d084"},
          ].map((s,i)=>(
            <div key={i} style={{background:`${s.c}18`,border:`1px solid ${s.c}44`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em",marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"16px"}}>
        {/* D1 lock alert */}
        {isD1Day&&(
          <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",gap:8,alignItems:"center"}}>
            <span>🔒</span><div><div style={{fontSize:13,fontWeight:700,color:"#1a6eff"}}>D1 Training LOCKED today</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>5:45–7:45 PM — book sessions outside these hours</div></div>
          </div>
        )}

        {/* Urgent athletes */}
        {urgent.length>0&&(
          <div style={{background:"rgba(255,68,68,0.05)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:14,padding:"14px",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"#ff4444",letterSpacing:"0.1em",marginBottom:10}}>⚠️ URGENT RENEWALS ({urgent.length})</div>
            {urgent.slice(0,4).map((a:any,i:number)=>(
              <Link key={i} href="/coach/roster" style={{textDecoration:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,68,68,0.08)"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{a.name}</div>
                  <div style={{fontSize:11,color:"#ff4444",fontWeight:700}}>{a.sessions} session{a.sessions!==1?"s":""} left</div>
                </div>
              </Link>
            ))}
            {urgent.length>4&&<div style={{fontSize:11,color:"rgba(255,68,68,0.6)",marginTop:6}}>+{urgent.length-4} more in Roster</div>}
          </div>
        )}

        {/* AI Coaching Brain */}
        <div style={{background:"rgba(0,208,132,0.04)",border:"1px solid rgba(0,208,132,0.2)",borderRadius:16,padding:"16px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:900,color:"#00d084"}}>⚡ AI COACHING BRAIN</div>
            {aiResult&&<button onClick={()=>{setAiResult("");setAiAction(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:11}}>← Back</button>}
          </div>
          {!aiResult&&!aiLoading&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{id:"brief",icon:"📋",l:"Today's Brief"},{id:"revenue",icon:"💵",l:"$800 Goal Check"},{id:"renewals",icon:"⚠️",l:"Urgent Renewals"},{id:"content",icon:"📱",l:"IG Content Ideas"}].map(a=>(
                <div key={a.id} onClick={()=>runAI(a.id)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>{a.icon}</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#00d084"}}>{a.l}</span>
                </div>
              ))}
            </div>
          )}
          {aiLoading&&<div style={{textAlign:"center",padding:"20px"}}><div style={{fontSize:28,marginBottom:8}}>⚙️</div><div style={{fontSize:13,fontWeight:800,color:"#00d084",letterSpacing:"0.1em"}}>ANALYZING...</div></div>}
          {aiResult&&(
            <div>
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px",fontSize:13,lineHeight:1.85,color:"#fff",whiteSpace:"pre-wrap",marginBottom:10}}>{aiResult}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
                <button onClick={()=>{if(aiAction)runAI(aiAction);}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:12}}>🔄 Redo</button>
                <button onClick={copy} style={{background:copied?"#00d084":"#1a6eff",border:"none",color:copied?"#000":"#fff",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
              </div>
            </div>
          )}
        </div>

        {/* Module nav — all routes verified */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {MODULES.map((m,i)=>(
            <Link key={i} href={m.href} style={{textDecoration:"none"}}>
              <div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${m.color}33`,borderRadius:14,padding:"18px",minHeight:95,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                <div style={{fontSize:26}}>{m.icon}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:800,color:m.color,marginBottom:3}}>{m.label}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{m.sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

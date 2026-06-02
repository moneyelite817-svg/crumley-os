"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CoachDashboard() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [aiAction, setAiAction] = useState<string|null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("ct_clients");
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) setAthletes(p); }
    } catch {}
  }, []);

  const urgent = athletes.filter(a => a.status === "urgent");
  const inactive = athletes.filter(a => a.status === "inactive");
  const active = athletes.filter(a => a.status === "active");
  const today = new Date().getDay();
  const isD1 = today === 2 || today === 3;

  const AI_ACTIONS = [
    { id:"dailyBrief",    icon:"📋", label:"Today's Coaching Brief",      desc:`${isD1?"D1 LOCKED tonight · ":""}Top priorities right now` },
    { id:"weekPlan",      icon:"📅", label:"Weekly Training Plan",         desc:"Priority plan across all athletes" },
    { id:"revenueGoal",   icon:"💵", label:"$800 Goal Check",              desc:"Gap analysis + top revenue actions" },
    { id:"urgentPlan",    icon:"🔥", label:`Renew ${urgent.length} Urgent`, desc:"Who to call first, what to say" },
    { id:"inactiveReach", icon:"🔁", label:`Re-Engage ${inactive.length} Inactive`, desc:"Highest probability returns" },
    { id:"growthMove",    icon:"📈", label:"Top Growth Move",              desc:"Single biggest opportunity this week" },
  ];

  async function generateAI(action: string) {
    setLoading(true); setResult(""); setError(""); setAiAction(action);
    const roster = athletes.map(a => `${a.name}(${a.sport},${a.sessions}sess,${a.status})`).join("|");
    const urgentList = urgent.map(a => `${a.name} ${a.sessions}left`).join(", ");
    const dayName = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

    const prompts: Record<string,string> = {
      dailyBrief: `COO AI for Coach T at Elite Skillz Lab 🧪, D1 Training Hulen Fort Worth. Today: ${dayName}. ${isD1?"🔒 D1 TRAINING LOCKED 5:45-7:45 PM — DO NOT SCHEDULE OVER THIS.":""}\n\nRoster: ${roster}\nUrgent renewals: ${urgentList||"none"}\nTotal: ${athletes.length} athletes (${active.length} active, ${urgent.length} urgent, ${inactive.length} inactive)\n\nSharp daily brief: 3 actions for today, who needs attention, #1 message to send RIGHT NOW. COO-level, no fluff.`,
      weekPlan: `Coach T — Elite Skillz Lab 🧪. D1 locked Tue/Wed 5:45-7:45PM. $800/week goal.\nRoster: ${roster}\nWeekly priority plan. Each day Mon-Fri: athlete focus, training themes, business actions. Specific.`,
      revenueGoal: `Business brain for Coach T. $25/hr + 10% commission. Goal: $800/week.\n${athletes.length} athletes. Urgent: ${urgentList||"none"}.\nCurrent revenue status? Top 3 actions to hit $800? Who to contact today? Direct with numbers.`,
      urgentPlan: `${urgent.length} urgent renewals: ${urgentList||"none"}. Each = $25/hr+. Action plan: who first, what to say, exact order. Write the TEXT for the #1 priority right now.`,
      inactiveReach: `${inactive.length} inactive athletes: ${inactive.map(a=>`${a.name}(${a.notes||"no notes"})`).join(", ")||"none"}. Who comes back? Outreach order? Write the first message to highest-probability inactive athlete.`,
      growthMove: `Elite Skillz Lab 🧪 — ${athletes.length} athletes, ${urgent.length} urgent, $800/week target. Single highest-impact growth move THIS WEEK. Consider: adds, frequency increases, D1 promos, referrals, IG content. ONE specific action with exact steps.`,
    };

    try {
      const res = await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:prompts[action]})});
      const data = await res.json();
      if(data.error) setError(data.message||data.error); else setResult(data.text);
    } catch { setError("Network error."); }
    setLoading(false);
  }

  function copy(){navigator.clipboard?.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);}

  return (
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:40,fontFamily:"system-ui"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(150deg,#001133,#000)",borderBottom:"3px solid #1a6eff",padding:"28px 16px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:11,letterSpacing:"0.2em",color:"#1a6eff",fontWeight:700}}>D1 TRAINING · HULEN FORT WORTH</div>
          <Link href="/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:12}}>⚡ Master</Link>
        </div>
        <div style={{fontSize:28,fontWeight:900,lineHeight:1}}>ELITE SKILLZ<br/><span style={{color:"#1a6eff"}}>LAB 🧪</span></div>
        {mounted && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginTop:16}}>
            {[{l:"ATHLETES",v:athletes.length,c:"#1a6eff"},{l:"URGENT",v:urgent.length,c:"#ff4444"},{l:"ACTIVE",v:active.length,c:"#00d084"},{l:"INACTIVE",v:inactive.length,c:"rgba(255,255,255,0.35)"}].map((s,i)=>(
              <div key={i} style={{background:`${s.c}18`,border:`1px solid ${s.c}44`,borderRadius:10,padding:"10px 6px",textAlign:"center" as const}}>
                <div style={{fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em",marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{padding:"16px"}}>
        {isD1 && (
          <div style={{background:"rgba(26,110,255,0.08)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:18}}>🔒</span>
            <div><div style={{fontSize:12,fontWeight:700,color:"#1a6eff"}}>D1 TRAINING LOCKED 5:45–7:45 PM</div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>Protected commitment — 2 group classes</div></div>
          </div>
        )}

        {/* AI Brain */}
        <div style={{background:"rgba(26,110,255,0.04)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:16,padding:"16px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:900,color:"#1a6eff"}}>⚡ AI COACHING BRAIN</div>
            {(result||loading)&&<button onClick={()=>{setResult("");setError("");setAiAction(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:11}}>← Back</button>}
          </div>
          {!result&&!loading&&AI_ACTIONS.map(a=>(
            <div key={a.id} onClick={()=>generateAI(a.id)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"11px 12px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>{a.icon}</span>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#1a6eff",marginBottom:1}}>{a.label}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{a.desc}</div></div>
              <span style={{color:"rgba(255,255,255,0.2)"}}>›</span>
            </div>
          ))}
          {loading&&<div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:32,marginBottom:10}}>⚙️</div><div style={{fontSize:14,fontWeight:800,color:"#1a6eff",letterSpacing:"0.1em"}}>GENERATING...</div></div>}
          {error&&<div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10,padding:"12px",color:"#ff8888",fontSize:13}}>{error}</div>}
          {result&&(
            <div>
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px",fontSize:13,lineHeight:1.8,color:"#fff",whiteSpace:"pre-wrap",marginBottom:12}}>{result}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
                <button onClick={()=>{setResult("");setError("");if(aiAction)generateAI(aiAction);}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:12}}>🔄 Redo</button>
                <button onClick={copy} style={{background:copied?"#00d084":"#1a6eff",border:"none",color:copied?"#000":"#fff",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
              </div>
            </div>
          )}
        </div>

        {/* Nav grid — ALL 6 modules */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[
            {href:"/coach/roster",   icon:"👥",l:"ROSTER",    s:`${athletes.length} athletes`,    c:"#1a6eff"},
            {href:"/coach/schedule", icon:"📅",l:"SCHEDULE",  s:"Book sessions",                   c:"#4a8fff"},
            {href:"/coach/program",  icon:"📋",l:"PROGRAMMING",s:"Build workouts",                 c:"#00d084"},
            {href:"/coach/agent",    icon:"⚡",l:"AI AGENT",  s:"35 skills",                        c:"#1a6eff"},
          ].map((c,i)=>(
            <Link key={i} href={c.href} style={{textDecoration:"none"}}>
              <div style={{background:"#111",border:`1px solid ${c.c}33`,borderRadius:14,padding:"16px"}}>
                <div style={{fontSize:24,marginBottom:8}}>{c.icon}</div>
                <div style={{fontSize:13,fontWeight:800,color:c.c,marginBottom:3}}>{c.l}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{c.s}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Urgent */}
        {mounted && urgent.length > 0 && (
          <div style={{background:"rgba(255,68,68,0.06)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:14,padding:"14px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#ff4444",letterSpacing:"0.1em",marginBottom:10}}>🔥 URGENT RENEWALS</div>
            {urgent.map((a:any)=>(
              <Link key={a.id} href="/coach/agent" style={{textDecoration:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,68,68,0.08)"}}>
                  <div style={{fontSize:13,fontWeight:700}}>{a.name}</div>
                  <div style={{fontSize:11,color:"#ff4444"}}>{a.sessions} left → ⚡ Renew</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* D1 locked */}
        <div style={{background:"rgba(26,110,255,0.04)",border:"1px solid rgba(26,110,255,0.15)",borderRadius:14,padding:"14px"}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#1a6eff",marginBottom:10}}>🔒 LOCKED D1 COMMITMENTS</div>
          {[{d:"TUESDAY",t:"5:45–7:45 PM"},{d:"WEDNESDAY",t:"5:45–7:45 PM"}].map((b,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<1?"1px solid rgba(26,110,255,0.08)":"none"}}>
              <span style={{fontSize:11,fontWeight:700,color:"#1a6eff"}}>{b.d}</span>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{b.t}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

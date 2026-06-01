"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function RevenuePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [moves, setMoves] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [aiAction, setAiAction] = useState<string|null>(null);
  const [showAI, setShowAI] = useState(false);

  useEffect(()=>{
    try{setJobs(JSON.parse(localStorage.getItem("cros_luxury_jobs_v3")||"[]"));}catch{}
    try{setMoves(JSON.parse(localStorage.getItem("cros_moving_jobs_v1")||"[]"));}catch{}
    try{setInvoices(JSON.parse(localStorage.getItem("cros_invoices_v1")||"[]"));}catch{}
  },[]);

  const activeJobs = jobs.filter((j:any)=>j.status!=="completed");
  const stagingRev = activeJobs.reduce((a:number,j:any)=>a+(j.price||j.value||0),0);
  const movingRev = moves.filter((m:any)=>m.status!=="cancelled").reduce((a:number,m:any)=>a+(m.totalPrice||0),0);
  const totalRev = stagingRev + movingRev;
  const unpaid = invoices.filter((i:any)=>i.status!=="paid").reduce((a:number,i:any)=>a+Math.max(0,(i.amount||0)-(i.amountPaid||0)),0);
  const collected = invoices.filter((i:any)=>i.status==="paid").reduce((a:number,i:any)=>a+(i.amount||0),0);

  const AI_ACTIONS = [
    {id:"growth",icon:"📈",label:"Growth Strategy",desc:"AI analyzes your numbers and suggests top growth moves"},
    {id:"pricing",icon:"💰",label:"Pricing Analysis",desc:"Should you raise prices? When and how much?"},
    {id:"forecast",icon:"🔮",label:"Revenue Forecast",desc:"What could next 90 days look like?"},
    {id:"collections",icon:"⚠️",label:"Collections Plan",desc:`Strategy to collect $${unpaid.toLocaleString()} unpaid`},
    {id:"moving",icon:"🚛",label:"Moving Biz Opportunity",desc:"How to scale moving revenue with Leston partnership"},
  ];

  async function generate(action: string) {
    setLoading(true); setResult(""); setError(""); setAiAction(action);
    const prompts: Record<string,string> = {
      growth: `You are the COO AI for All In One Luxury Designs, Terrance Crumley's DFW home staging and moving company. Current data: ${activeJobs.length} active staging jobs ($${stagingRev.toLocaleString()} value), ${moves.filter((m:any)=>m.status!=="cancelled").length} moving jobs ($${movingRev.toLocaleString()}), $${unpaid.toLocaleString()} unpaid. Give 3 specific, high-impact growth actions Terrance can take THIS WEEK to increase revenue. Be direct, specific, not generic. Think like a chief operating officer who knows DFW real estate.`,
      pricing: `COO AI for All In One Luxury Designs. Current pricing: Full install $2,750/90 days, Transfer $1,450/90 days. Active jobs: ${activeJobs.length}. DFW market context: competitive luxury staging market, strong demand from top realtors. Analyze whether Terrance should raise prices, by how much, and when. Give a specific recommendation with reasoning. Under 6 sentences.`,
      forecast: `COO AI for All In One Luxury Designs. Current: ${activeJobs.length} staging jobs ($${stagingRev.toLocaleString()}), ${moves.filter((m:any)=>m.status!=="cancelled").length} moving jobs. Give a realistic 90-day revenue forecast based on: current jobs expiring and needing renewal, moving business scaling, and typical DFW real estate seasonality. Give 3 scenarios: conservative, likely, and aggressive. Be specific with numbers.`,
      collections: `COO AI for All In One Luxury Designs. Outstanding unpaid balance: $${unpaid.toLocaleString()} across ${invoices.filter((i:any)=>i.status!=="paid").length} invoices. Create a specific 3-step collections action plan for this week. Include what to say, when to say it, and what happens if no response. Think like a professional collections strategist, not a pushover.`,
      moving: `COO AI. Terrance Crumley is developing a moving company partnership with Leston Eustache (top DFW realtor). Terrance runs 100% operations, Leston promotes/refers. Current staging jobs: ${activeJobs.length}. Analyze the opportunity and give a specific 4-week action plan to generate the first 5 moving clients using Leston's realtor network and existing staging relationships. Be specific about who to contact and what to say.`,
    };
    try {
      const res = await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:prompts[action]})});
      const data = await res.json();
      if(data.error) setError(data.message||data.error); else setResult(data.text);
    } catch { setError("Network error."); }
    setLoading(false);
  }

  function copy(){navigator.clipboard?.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);}

  return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",gap:12}}>
        <Link href="/luxury/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
        <div style={{flex:1}}><div style={{fontSize:16,fontWeight:800}}>REVENUE</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>All In One Luxury Designs</div></div>
        <button onClick={()=>setShowAI(!showAI)} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>⚡ AI INSIGHTS</button>
      </div>

      <div style={{padding:"16px"}}>
        {/* Hero number */}
        <div style={{background:"linear-gradient(135deg,#0a1020,#03060f)",border:"2px solid #1a6eff",borderRadius:16,padding:"22px",textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:11,letterSpacing:"0.15em",color:"rgba(255,255,255,0.3)",marginBottom:8}}>TOTAL ACTIVE PIPELINE</div>
          <div style={{fontSize:52,fontWeight:900,color:"#1a6eff"}}>${totalRev.toLocaleString()}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:4}}>staging + moving · live inventory</div>
        </div>

        {/* Stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[{l:"ACTIVE STAGING",v:`$${stagingRev.toLocaleString()}`,s:`${activeJobs.length} properties`,c:"#1a6eff"},{l:"MOVING PIPELINE",v:`$${movingRev.toLocaleString()}`,s:`${moves.filter((m:any)=>m.status!=="cancelled").length} jobs`,c:"#4a8fff"},{l:"UNPAID BALANCE",v:`$${unpaid.toLocaleString()}`,s:"collect now",c:unpaid>0?"#f0c040":"#00d084"},{l:"COLLECTED",v:`$${collected.toLocaleString()}`,s:"from invoices",c:"#00d084"}].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${s.c}33`,borderRadius:14,padding:"16px"}}>
              <div style={{fontSize:22,fontWeight:900,color:s.c,marginBottom:4}}>{s.v}</div>
              <div style={{fontSize:9,letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase",marginBottom:2}}>{s.l}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>{s.s}</div>
            </div>
          ))}
        </div>

        {/* AI Insights Panel */}
        {showAI&&(
          <div style={{background:"rgba(26,110,255,0.04)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:16,padding:"18px",marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:900,color:"#1a6eff",marginBottom:14}}>⚡ AI REVENUE INSIGHTS</div>
            {!result&&!loading&&(
              <div>
                {AI_ACTIONS.map(a=>(
                  <div key={a.id} onClick={()=>generate(a.id)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:22}}>{a.icon}</span>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#1a6eff",marginBottom:1}}>{a.label}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{a.desc}</div></div>
                    <span style={{color:"rgba(255,255,255,0.2)"}}>›</span>
                  </div>
                ))}
              </div>
            )}
            {loading&&<div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:28,marginBottom:10}}>🤖</div><div style={{fontSize:14,fontWeight:800,color:"#1a6eff",letterSpacing:"0.1em"}}>ANALYZING...</div></div>}
            {error&&<div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10,padding:"12px",color:"#ff8888",fontSize:13}}>{error}</div>}
            {result&&(
              <div>
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px",fontSize:14,lineHeight:1.8,color:"#fff",whiteSpace:"pre-wrap",marginBottom:12}}>{result}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <button onClick={()=>{setResult("");setError("");setAiAction(null);}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:12}}>← More Insights</button>
                  <button onClick={copy} style={{background:copied?"#00d084":"#1a6eff",border:"none",color:copied?"#000":"#fff",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing structure */}
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"16px"}}>
          <div style={{fontSize:11,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",fontWeight:700,textTransform:"uppercase",marginBottom:14}}>💰 PRICING STRUCTURE</div>
          {[{l:"Full Turnkey Install",v:"$2,750",s:"90 days · design, furnish, accessorize"},{l:"Transfer to New Listing",v:"$1,450",s:"90 days · fill open inventory"},{l:"Moving Job (estimate)",v:"$600–$2,000",s:"crew × hours + trucks"},{l:"90-Day Extension",v:"Negotiate",s:"furniture stays, easy revenue"}].map((item,i)=>(
            <div key={i} style={{padding:"10px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:14,fontWeight:700}}>{item.l}</div>
                <div style={{fontSize:16,fontWeight:900,color:"#1a6eff"}}>{item.v}</div>
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>{item.s}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

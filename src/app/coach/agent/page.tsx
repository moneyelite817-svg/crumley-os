"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
const STORAGE = "ct_clients";
const ACTIONS = [
  {id:"session",label:"SESSION PLAN",icon:"🏋️",desc:"Build today's personalized workout"},
  {id:"message",label:"PARENT MESSAGE",icon:"💬",desc:"Draft a text to send to parent"},
  {id:"renewal",label:"RENEWAL PITCH",icon:"💰",desc:"Re-sign this client"},
  {id:"progress",label:"PROGRESS NOTE",icon:"📈",desc:"4-week update to parent"},
  {id:"reengage",label:"RE-ENGAGE",icon:"🔁",desc:"Bring inactive athlete back"},
];
function buildPrompt(athlete: any, action: string, extra: string) {
  const maxes = Object.entries(athlete.maxes||{}).filter(([,v])=>v).map(([k,v])=>`${k}:${v}`).join(", ");
  const base = `You are Coach T's AI at D1 Training Hulen Fort Worth TX. Elite Skillz Lab 🧪. 60-min sessions, dumbbells+bands only, mixed ages. Coach T earns $25/hr + 10% commission. $800/week goal.\n\nATHLETE: ${athlete.name} | Sport: ${athlete.sport||"General"} | Age: ${athlete.age||"?"} | ${athlete.weight||"?"}lbs | Goal: ${athlete.goal||"athletic development"} | Injuries: ${athlete.injuries||"none"} | ${athlete.sessions} sessions left | Maxes: ${maxes||"not recorded"}${athlete.notes?` | Notes: ${athlete.notes}`:""}${extra?`\nINSTRUCTION: ${extra}`:""}`;
  if (action==="session") return `${base}\n\nGenerate a complete 60-min session. Format for phone:\n**ACTIVATION (5 min)**\n1. Exercise\n3x10\n• cue\n\nThen POWER (15min), STRENGTH (25min), ACCESSORY (10min). End with **COACH T CUE** and **NEXT SESSION**. DB/bands only. Specific weights from maxes.`;
  if (action==="message") return `${base}\n\nShort warm professional text to parent about their athlete. Reference specifics. Under 4 sentences.`;
  if (action==="renewal") return `${base}\n\n${athlete.sessions} sessions left. Confident warm renewal pitch referencing progress. Under 5 sentences.`;
  if (action==="progress") return `${base}\n\n4-week progress update: 1 strength win, 1 movement gain, 1 character note, next focus. Under 6 sentences.`;
  if (action==="reengage") return `${base}\n\nRe-engagement text for absent athlete. Warm. End with availability question. Under 3 sentences.`;
  return base;
}
export default function Page() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selAthlete, setSelAthlete] = useState<any>(null);
  const [selAction, setSelAction] = useState<string|null>(null);
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { try { const s = localStorage.getItem(STORAGE); if(s) setAthletes(JSON.parse(s)); } catch {} }, []);
  async function generate() {
    if (!selAthlete || !selAction) return;
    setLoading(true); setResult(""); setError("");
    try {
      const res = await fetch("/api/ai", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ prompt: buildPrompt(selAthlete, selAction, extra) }) });
      const data = await res.json();
      if (data.error) setError(data.message || data.error);
      else setResult(data.text);
    } catch { setError("Connection error."); }
    setLoading(false);
  }
  function copy() { navigator.clipboard?.writeText(result); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  const urgent = athletes.filter(a=>a.status==="urgent");
  const inactive = athletes.filter(a=>a.status==="inactive");
  if (!selAthlete) return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", gap:12 }}>
        <Link href="/coach/dashboard" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"none", fontSize:20 }}>←</Link>
        <div><div style={{ fontSize:16, fontWeight:800 }}>AI AGENT ⚡</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Elite Skillz Lab 🧪</div></div>
      </div>
      <div style={{ padding:"16px" }}>
        {urgent.length>0&&<div style={{ background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:12, padding:"14px", marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:"#ff4444", marginBottom:10 }}>🔥 URGENT — ACT NOW</div>
          {urgent.map(a=>(
            <div key={a.id} onClick={()=>setSelAthlete(a)} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,68,68,0.1)", cursor:"pointer" }}>
              <div style={{ fontSize:14, fontWeight:700 }}>{a.name}</div>
              <div style={{ fontSize:12, color:"#ff4444" }}>{a.sessions} session{a.sessions!==1?"s":""} left → Renew</div>
            </div>
          ))}
        </div>}
        <div style={{ fontSize:11, letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)", fontWeight:700, textTransform:"uppercase", marginBottom:14 }}>SELECT ATHLETE</div>
        {athletes.map(a=>{
          const colors: Record<string,string> = {urgent:"#ff4444",inactive:"rgba(255,255,255,0.3)",active:"#1a6eff"};
          const c = colors[a.status]||"#1a6eff";
          return (
            <div key={a.id} onClick={()=>setSelAthlete(a)} style={{ background:"#111", border:`1px solid #222`, borderLeft:`3px solid ${c}`, borderRadius:10, padding:"12px 14px", marginBottom:8, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><div style={{ fontSize:14, fontWeight:700 }}>{a.name}</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{a.sport} · {a.sessions} sessions</div></div>
              <div style={{ fontSize:9, padding:"3px 8px", background:`${c}22`, color:c, borderRadius:4, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>{a.status}</div>
            </div>
          );
        })}
      </div>
    </main>
  );
  if (!selAction) return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={()=>setSelAthlete(null)} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Athletes</button>
        <span style={{ fontSize:14, fontWeight:700 }}>{selAthlete.name}</span>
        <div style={{ width:60 }}/>
      </div>
      <div style={{ padding:"16px" }}>
        <div style={{ background:"rgba(26,110,255,0.08)", border:"1px solid rgba(26,110,255,0.2)", borderRadius:12, padding:"14px", marginBottom:16, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[{l:"SESSIONS",v:selAthlete.sessions},{l:"FREQ/WK",v:`${selAthlete.freq}x`},{l:"STATUS",v:selAthlete.status.toUpperCase()}].map((s,i)=>(
            <div key={i} style={{ textAlign:"center" }}><div style={{ fontSize:16, fontWeight:900, color:"#1a6eff" }}>{s.v}</div><div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", marginTop:2 }}>{s.l}</div></div>
          ))}
        </div>
        <div style={{ fontSize:11, letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)", fontWeight:700, textTransform:"uppercase", marginBottom:14 }}>SELECT ACTION</div>
        {ACTIONS.map(action=>(
          <div key={action.id} onClick={()=>setSelAction(action.id)} style={{ background:"#111", border:"1px solid #222", borderRadius:12, padding:"16px", marginBottom:10, cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
            <span style={{ fontSize:26 }}>{action.icon}</span>
            <div style={{ flex:1 }}><div style={{ fontSize:15, fontWeight:700, color:"#1a6eff" }}>{action.label}</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{action.desc}</div></div>
            <span style={{ color:"rgba(255,255,255,0.3)", fontSize:18 }}>›</span>
          </div>
        ))}
      </div>
    </main>
  );
  const action = ACTIONS.find(a=>a.id===selAction);
  return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={()=>{setSelAction(null);setResult("");setError("");}} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Back</button>
        <div><div style={{ fontSize:14, fontWeight:700, color:"#1a6eff" }}>{action?.icon} {action?.label}</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{selAthlete.name}</div></div>
      </div>
      <div style={{ padding:"16px" }}>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:4 }}>💬 SPECIFIC INSTRUCTION (optional)</label>
          <textarea value={extra} onChange={e=>setExtra(e.target.value)} placeholder="e.g. He tweaked his knee · Focus on speed · Remind about payment" style={{ width:"100%", padding:"10px 12px", background:"#111", border:"1px solid #333", borderRadius:10, color:"#fff", fontFamily:"system-ui", fontSize:14, outline:"none", height:70, resize:"none", boxSizing:"border-box" }}/>
        </div>
        {!result&&!loading&&<button onClick={generate} style={{ width:"100%", background:"#1a6eff", border:"none", color:"#fff", borderRadius:12, padding:"16px", fontSize:16, fontWeight:900, cursor:"pointer", letterSpacing:"0.05em" }}>GENERATE</button>}
        {loading&&<div style={{ textAlign:"center", padding:"40px 0" }}><div style={{ fontSize:36, marginBottom:12 }}>⚙️</div><div style={{ fontSize:16, fontWeight:700, color:"#1a6eff", letterSpacing:"0.1em" }}>BUILDING...</div></div>}
        {error&&<div style={{ background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:10, padding:"14px", color:"#ff8888", fontSize:13, lineHeight:1.6 }}>{error}</div>}
        {result&&<>
          <div style={{ background:"#111", border:"1px solid #222", borderRadius:12, padding:"18px", fontSize:14, lineHeight:1.8, color:"#fff", whiteSpace:"pre-wrap", marginBottom:12 }}>{result}</div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>{setResult("");generate();}} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid #333", color:"rgba(255,255,255,0.5)", borderRadius:8, padding:"12px", cursor:"pointer", fontSize:13 }}>🔄 Redo</button>
            <button onClick={copy} style={{ flex:2, background:copied?"#00d084":"#1a6eff", border:"none", color:"#fff", borderRadius:8, padding:"12px", fontSize:14, fontWeight:900, cursor:"pointer" }}>{copied?"✓ COPIED!":"📋 COPY"}</button>
          </div>
          <div style={{ marginTop:16, fontSize:11, letterSpacing:"0.1em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:10 }}>Run Another</div>
          {ACTIONS.filter(a=>a.id!==selAction).map(a=>(
            <div key={a.id} onClick={()=>{setSelAction(a.id);setResult("");setError("");}} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid #222", borderRadius:8, padding:"10px 14px", marginBottom:8, cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
              <span>{a.icon}</span><span style={{ fontSize:13, fontWeight:700, color:"#1a6eff" }}>{a.label}</span><span style={{ marginLeft:"auto", color:"rgba(255,255,255,0.3)" }}>›</span>
            </div>
          ))}
        </>}
      </div>
    </main>
  );
}

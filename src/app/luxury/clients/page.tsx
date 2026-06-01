"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE = "cros_clients_v1";
const SEED = [
  {id:"1",name:"Leston Eustache",type:"agent",phone:"",email:"",company:"@iamlestacks",notes:"Top DFW producer. Primary referral partner. 4 active listings.",totalJobs:4,totalRevenue:11000,createdAt:""},
  {id:"2",name:"KC",type:"agent",phone:"",email:"",company:"",notes:"2 active listings on Dennison St.",totalJobs:2,totalRevenue:5500,createdAt:""},
];
const BLANK = {name:"",type:"agent",phone:"",email:"",company:"",notes:"",totalJobs:0,totalRevenue:0};
const TC: Record<string,string> = {agent:"#1a6eff",builder:"#00d084",developer:"#f0c040",homeowner:"rgba(255,255,255,0.4)"};
const inp: any = {width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10};
const lbl: any = {display:"block",fontFamily:"system-ui",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",marginBottom:4};

function AIPanel({ client, onClose }: { client: any; onClose: ()=>void }) {
  const [action, setAction] = useState<string|null>(null);
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const actions = [
    {id:"checkIn",icon:"👋",label:"Check-In Text",desc:"Warm reach out to stay top of mind"},
    {id:"newListing",icon:"🏠",label:"New Listing Pitch",desc:"Ask if they have listings that need staging"},
    {id:"thankYou",icon:"🙏",label:"Thank You Message",desc:"Appreciate the business or referral"},
    {id:"referralAsk",icon:"🤝",label:"Referral Ask",desc:"Ask them to recommend you to their network"},
    {id:"coldOutreach",icon:"📨",label:"Cold Outreach",desc:"First-time intro to a new agent or builder"},
  ];

  function buildPrompt() {
    const base = `You are the AI agent for All In One Luxury Designs — Terrance Crumley's premium DFW home staging. Full installs at $2,750, transfers at $1,450.

Client: ${client?.name||"the contact"}
Type: ${client?.type||"agent"}
Company: ${client?.company||"not specified"}
Total jobs: ${client?.totalJobs||0}
Total revenue: $${(client?.totalRevenue||0).toLocaleString()}
Notes: ${client?.notes||"none"}
${extra?`\nSpecific context: ${extra}`:""}`;

    if(action==="checkIn") return `${base}\n\nWrite a warm professional check-in text to ${client?.name||"them"}. Stay top of mind, ask how their listings are performing, open the door for new business. Under 4 sentences.`;
    if(action==="newListing") return `${base}\n\nWrite a text asking ${client?.name||"them"} if they have any upcoming listings that need staging. Reference your track record and quick turnaround. Mention your $2,750 install rate. Confident, not desperate. Under 4 sentences.`;
    if(action==="thankYou") return `${base}\n\nWrite a genuine thank you message to ${client?.name||"them"} for their business${client?.totalJobs>1?` (${client.totalJobs} jobs together)`:""} or a recent referral. Make them feel valued. Under 3 sentences.`;
    if(action==="referralAsk") return `${base}\n\nWrite a professional text asking ${client?.name||"them"} to recommend All In One Luxury Designs to agents in their network. Reference the value we've delivered. Make it easy for them to refer. Under 4 sentences.`;
    if(action==="coldOutreach") return `${base}\n\nWrite a cold outreach intro text to ${client?.name||"this new contact"}, a DFW ${client?.type||"agent/builder"}. Introduce All In One Luxury Designs — premium full-turnkey staging owned and operated by Terrance Crumley. Mention $2,750 full installs, 90-day terms, fast turnaround. Short, confident, professional. Under 5 sentences.`;
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
          <div>
            <div style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>⚡ AI AGENT</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>{client?.name||"Client AI"}</div>
          </div>
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

export default function ClientsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [view, setView] = useState("list");
  const [sel, setSel] = useState<any>(null);
  const [form, setForm] = useState<any>({...BLANK});
  const [search, setSearch] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [aiClient, setAiClient] = useState<any>(null);

  useEffect(()=>{try{const s=localStorage.getItem(STORAGE);setItems(s?JSON.parse(s):SEED);}catch{setItems(SEED);}}, []);
  function persist(data: any[]) {setItems(data);try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch{}}
  function f(k:string,v:any){setForm((p:any)=>({...p,[k]:v}));}

  function submit() {
    if(!form.name?.trim()) return;
    if(view==="edit"&&sel){const u=items.map((c:any)=>c.id===sel.id?{...c,...form}:c);persist(u);setSel({...sel,...form});setView("detail");}
    else{persist([...items,{...form,id:Date.now().toString(),createdAt:new Date().toISOString()}]);setForm({...BLANK});setView("list");}
  }

  const shown = items.filter((c:any)=>c.name.toLowerCase().includes(search.toLowerCase()));
  const totalRev = items.reduce((a:number,c:any)=>a+(c.totalRevenue||0),0);

  if(view==="add"||view==="edit") return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>{setView(view==="edit"?"detail":"list");setForm({...BLANK});}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Cancel</button>
        <span style={{fontSize:14,fontWeight:800}}>{view==="edit"?"EDIT CLIENT":"NEW CLIENT"}</span>
        <button onClick={submit} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
      </div>
      <div style={{padding:"20px 16px"}}>
        {[{l:"NAME *",k:"name"},{l:"COMPANY",k:"company"},{l:"PHONE",k:"phone"},{l:"EMAIL",k:"email"},{l:"NOTES",k:"notes"}].map(field=>(
          <div key={field.k}><label style={lbl}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} style={inp}/></div>
        ))}
        <label style={lbl}>TYPE</label>
        <select value={form.type} onChange={e=>f("type",e.target.value)} style={{...inp}}>
          {["agent","builder","developer","homeowner"].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={lbl}>TOTAL JOBS</label><input type="number" value={form.totalJobs||0} onChange={e=>f("totalJobs",parseInt(e.target.value)||0)} style={inp}/></div>
          <div><label style={lbl}>REVENUE $</label><input type="number" value={form.totalRevenue||0} onChange={e=>f("totalRevenue",parseFloat(e.target.value)||0)} style={inp}/></div>
        </div>
      </div>
    </main>
  );

  if(view==="detail"&&sel) {
    const color = TC[sel.type]||"#fff";
    return(
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Clients</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiClient(sel);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...sel});setView("edit");}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>✏️ Edit</button>
          </div>
        </div>
        <div style={{padding:"20px 16px"}}>
          <div style={{background:`${color}15`,border:`1px solid ${color}33`,borderRadius:14,padding:"20px",marginBottom:14}}>
            <div style={{fontSize:24,fontWeight:900,marginBottom:4}}>{sel.name}</div>
            {sel.company&&<div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:6}}>{sel.company}</div>}
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color,textTransform:"uppercase"}}>{sel.type}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
              {[{l:"TOTAL JOBS",v:sel.totalJobs},{l:"TOTAL REVENUE",v:`$${(sel.totalRevenue||0).toLocaleString()}`}].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.05)",borderRadius:10,padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:900,color}}>{s.v}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          {[{l:"PHONE",v:sel.phone},{l:"EMAIL",v:sel.email},{l:"NOTES",v:sel.notes}].filter(i=>i.v).map((item,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"14px",marginBottom:8}}>
              <div style={{...lbl,marginBottom:4}}>{item.l}</div>
              <div style={{fontSize:14,color:"#fff"}}>{item.v}</div>
            </div>
          ))}
          <button onClick={()=>{setAiClient(sel);setShowAI(true);}} style={{width:"100%",marginTop:14,background:"linear-gradient(135deg,#1a6eff,#0d4fd4)",border:"none",color:"#fff",borderRadius:12,padding:"16px",cursor:"pointer",fontSize:15,fontWeight:900}}>⚡ AI AGENT — Generate Message</button>
          <button onClick={()=>{if(!confirm("Delete?"))return;persist(items.filter((c:any)=>c.id!==sel.id));setView("list");setSel(null);}} style={{width:"100%",marginTop:10,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🗑 DELETE</button>
        </div>
        {showAI&&<AIPanel client={aiClient} onClose={()=>{setShowAI(false);setAiClient(null);}}/>}
      </main>
    );
  }

  return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Link href="/luxury/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
            <div><div style={{fontSize:16,fontWeight:800}}>CLIENTS & AGENTS</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{items.length} contacts · ${totalRev.toLocaleString()} lifetime</div></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiClient(null);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ ADD</button>
          </div>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...inp,marginBottom:0}}/>
      </div>
      <div style={{padding:"14px 16px"}}>
        {shown.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.25)",fontSize:14}}>No clients.<br/><button onClick={()=>{setForm({...BLANK});setView("add");}} style={{marginTop:16,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13}}>+ Add Client</button></div>}
        {shown.map((c:any)=>{
          const color=TC[c.type]||"#fff";
          return(
            <div key={c.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`3px solid ${color}`,borderRadius:14,padding:"14px",marginBottom:10,cursor:"pointer"}}
              onClick={()=>{setSel(c);setView("detail");}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div><div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{c.name}</div>{c.company&&<div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{c.company}</div>}</div>
                <div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:900,color:"#1a6eff"}}>${(c.totalRevenue||0).toLocaleString()}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2}}>{c.totalJobs} jobs</div></div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <span style={{fontSize:10,background:`${color}18`,borderRadius:100,padding:"3px 9px",color,fontWeight:700,textTransform:"uppercase"}}>{c.type}</span>
                <button onClick={e=>{e.stopPropagation();setAiClient(c);setShowAI(true);}} style={{fontSize:10,background:"rgba(26,110,255,0.12)",borderRadius:100,padding:"3px 9px",color:"#1a6eff",fontWeight:700,border:"1px solid rgba(26,110,255,0.25)",cursor:"pointer"}}>⚡ AI</button>
              </div>
            </div>
          );
        })}
      </div>
      {showAI&&<AIPanel client={aiClient} onClose={()=>{setShowAI(false);setAiClient(null);}}/>}
    </main>
  );
}

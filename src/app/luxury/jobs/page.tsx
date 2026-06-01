"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ── Types ──
type JobStatus = "active"|"expiring"|"overdue"|"pickup"|"completed";
type JobType = "install"|"transfer"|"moving";
interface Job {
  id: string; address: string; client: string; agent: string; phone: string;
  jobType: JobType; installDate: string; endDate: string; price: number;
  deposit: number; rooms: string; notes: string; referral: string;
  status: JobStatus; createdAt: string;
}

const STORAGE = "cros_luxury_jobs_v3";
const SEED: Job[] = [
  {id:"1",address:"3031 Valentine St, Dallas TX",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"Leston listing",referral:"Leston Eustache",status:"active",createdAt:""},
  {id:"2",address:"3524 Spring Ave, Dallas TX 75210",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"Leston listing",referral:"Leston Eustache",status:"active",createdAt:""},
  {id:"3",address:"3610 Durango Dr, Dallas TX",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"Leston listing",referral:"Leston Eustache",status:"active",createdAt:""},
  {id:"4",address:"4009 Finis St, Dallas TX 75212",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"Leston listing",referral:"Leston Eustache",status:"active",createdAt:""},
  {id:"5",address:"1509 Dennison St, Dallas TX",client:"",agent:"KC",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"KC listing",referral:"KC",status:"active",createdAt:""},
  {id:"6",address:"1507 Dennison St, Dallas TX",client:"",agent:"KC",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"KC listing",referral:"KC",status:"active",createdAt:""},
];
const BLANK: Omit<Job,"id"|"createdAt"> = {address:"",client:"",agent:"",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"",referral:"",status:"active"};
const SC: Record<JobStatus,{color:string;bg:string;label:string}> = {
  active:{color:"#00d084",bg:"rgba(0,208,132,0.1)",label:"ACTIVE"},
  expiring:{color:"#f0c040",bg:"rgba(240,192,64,0.1)",label:"EXPIRING"},
  overdue:{color:"#ff4444",bg:"rgba(255,68,68,0.1)",label:"OVERDUE"},
  pickup:{color:"#1a6eff",bg:"rgba(26,110,255,0.1)",label:"PICKUP"},
  completed:{color:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)",label:"DONE"},
};
function computeStatus(j: Job): JobStatus {
  if(j.status==="completed"||j.status==="pickup") return j.status;
  if(!j.endDate) return "active";
  const d = Math.ceil((new Date(j.endDate).getTime()-Date.now())/86400000);
  if(d<0) return "overdue"; if(d<=14) return "expiring"; return "active";
}
function daysLeft(endDate: string) {
  if(!endDate) return null;
  return Math.ceil((new Date(endDate).getTime()-Date.now())/86400000);
}

const inp: any = {width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10};
const lbl: any = {display:"block",fontFamily:"system-ui",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",marginBottom:4};

// ── AI PANEL COMPONENT ──
function AIPanel({ job, onClose }: { job: Job|null; onClose: ()=>void }) {
  const [action, setAction] = useState<string|null>(null);
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const balance = job ? Math.max(0,(job.price||0)-(job.deposit||0)) : 0;
  const days = job ? daysLeft(job.endDate) : null;

  const actions = [
    {id:"followup",icon:"💬",label:"Follow-Up Text",desc:"Check in on listing, reaffirm staging value"},
    {id:"renewal",icon:"🔄",label:"90-Day Renewal",desc:"Pitch extension or transfer to new listing"},
    {id:"collections",icon:"💰",label:"Collections Text",desc:`Collect $${balance.toLocaleString()} outstanding balance`},
    {id:"pickup",icon:"📦",label:"Schedule Pickup",desc:"Coordinate furniture removal professionally"},
    {id:"instagram",icon:"📸",label:"Instagram Caption",desc:"Post content about this staged property"},
  ];

  function buildPrompt() {
    const base = `You are the AI agent for All In One Luxury Designs — Terrance Crumley's premium DFW home staging company. Full turnkey installs at $2,750 (90 days) and transfers at $1,450.

Property: ${job?.address || "the property"}
Agent/Client: ${job?.agent || "the agent"}${job?.client ? ` (${job.client})` : ""}
Job type: ${job?.jobType === "transfer" ? "Transfer ($1,450)" : "Full Install ($2,750)"}
Price: $${job?.price?.toLocaleString()}
Deposit paid: $${job?.deposit?.toLocaleString()}
Balance due: $${balance.toLocaleString()}
Days remaining: ${days !== null ? (days < 0 ? `${Math.abs(days)} days OVERDUE` : `${days} days`) : "End date not set"}
Rooms staged: ${job?.rooms || "not specified"}
Notes: ${job?.notes || "none"}
${extra ? `\nSpecific context: ${extra}` : ""}`;

    if(action==="followup") return `${base}\n\nWrite a warm professional follow-up text to ${job?.agent||"the agent"} about this staging. Check in on listing performance, reaffirm the value of the staging, open the door for conversation. Sound like a successful business owner — not a salesperson. Under 5 sentences.`;
    if(action==="renewal") return `${base}\n\nThe staging ${days!==null&&days<=14?"is expiring soon":"has been in place a while"}. Write a confident renewal text to ${job?.agent||"the agent"} pitching a 90-day extension or transfer to their next listing at $1,450. Reference the furniture already being there as easy revenue. Under 4 sentences.`;
    if(action==="collections") return `${base}\n\nThere is an outstanding balance of $${balance.toLocaleString()}. Write a professional but firm collections text to ${job?.client||job?.agent||"the client"}. State the balance clearly. Request payment via Zelle, Venmo, or Cash. Mention furniture pickup if unpaid. Professional, not aggressive. Under 4 sentences.`;
    if(action==="pickup") return `${base}\n\nWrite a professional text to ${job?.agent||"the agent"} to coordinate scheduling the furniture pickup from ${job?.address}. Confirm their timeline, offer available dates, keep it smooth and easy. Under 4 sentences.`;
    if(action==="instagram") return `${base}\n\nWrite an Instagram caption for a staging post about this property. Tone: premium, aspirational. Mention the transformation, the design approach, the result. Tag angle for DFW real estate agents. Under 8 sentences. Include 4-5 hashtags: #AllInOneLuxury #DFWStaging #HomeStaging #DFWRealEstate and one more relevant.`;
    return base;
  }

  async function generate() {
    setLoading(true); setResult(""); setError("");
    try {
      const res = await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:buildPrompt()})});
      const data = await res.json();
      if(data.error) setError(data.message||data.error);
      else setResult(data.text);
    } catch { setError("Network error. Check connection."); }
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
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>{job?.address?.split(",")[0]||"Job AI"}</div>
          </div>
          <button onClick={()=>{if(action){setAction(null);setResult("");setError("");}else onClose();}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>
            {action?"← Back":"✕"}
          </button>
        </div>

        {!action && (
          <div>
            {actions.map(a=>(
              <div key={a.id} onClick={()=>setAction(a.id)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>{a.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1a6eff",marginBottom:2}}>{a.label}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{a.desc}</div>
                </div>
                <span style={{color:"rgba(255,255,255,0.2)",fontSize:16}}>›</span>
              </div>
            ))}
          </div>
        )}

        {action && !result && !loading && (
          <div>
            <label style={lbl}>Additional context (optional)</label>
            <textarea value={extra} onChange={e=>setExtra(e.target.value)} placeholder="Any specific notes to include..." style={{...inp,height:60,resize:"none"}}/>
            <button onClick={generate} style={{width:"100%",background:"#1a6eff",border:"none",color:"#fff",borderRadius:12,padding:"16px",fontSize:15,fontWeight:900,cursor:"pointer"}}>⚡ GENERATE</button>
          </div>
        )}

        {loading && <div style={{textAlign:"center",padding:"30px 0"}}><div style={{fontSize:32,marginBottom:12}}>🤖</div><div style={{fontSize:14,fontWeight:800,color:"#1a6eff",letterSpacing:"0.1em"}}>GENERATING...</div></div>}
        {error && <div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10,padding:"12px",color:"#ff8888",fontSize:13}}>{error}</div>}
        {result && (
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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [view, setView] = useState<"list"|"detail"|"add"|"edit">("list");
  const [sel, setSel] = useState<Job|null>(null);
  const [form, setForm] = useState<any>({...BLANK});
  const [filter, setFilter] = useState("all");
  const [aiJob, setAiJob] = useState<Job|null>(null);
  const [showAI, setShowAI] = useState(false);

  useEffect(()=>{ try{const s=localStorage.getItem(STORAGE);setJobs(s?JSON.parse(s):SEED);}catch{setJobs(SEED);} },[]);
  function persist(data: Job[]) { setJobs(data); try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch{} }
  function f(k:string,v:any){setForm((p:any)=>({...p,[k]:v}));}

  function addJob(){if(!form.address?.trim()){alert("Address required");return;}persist([...jobs,{...form,id:Date.now().toString(),createdAt:new Date().toISOString()}]);setForm({...BLANK});setView("list");}
  function saveEdit(){if(!sel)return;const u=jobs.map(j=>j.id===sel.id?{...j,...form}:j);persist(u);setSel({...sel,...form});setView("detail");}
  function deleteJob(id:string){if(!confirm("Delete?"))return;persist(jobs.filter(j=>j.id!==id));setView("list");setSel(null);}

  const displayed = jobs.map(j=>({...j,status:computeStatus(j)})).filter(j=>filter==="all"||j.status===filter||(filter==="unpaid"&&j.price-j.deposit>0));
  const totalActive = jobs.filter(j=>computeStatus(j)!=="completed").reduce((a,j)=>a+j.price,0);
  const totalUnpaid = jobs.reduce((a,j)=>a+Math.max(0,j.price-j.deposit),0);

  // ADD / EDIT FORM
  if(view==="add"||view==="edit") return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>{setView(view==="edit"?"detail":"list");setForm({...BLANK});}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Cancel</button>
        <span style={{fontSize:14,fontWeight:800}}>{view==="edit"?"EDIT JOB":"NEW JOB"}</span>
        <button onClick={view==="edit"?saveEdit:addJob} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
      </div>
      <div style={{padding:"20px 16px"}}>
        <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:12,padding:"16px",marginBottom:12}}>
          <div style={{fontSize:9,letterSpacing:"0.15em",color:"rgba(255,255,255,0.3)",marginBottom:8}}>JOB TYPE</div>
          <div style={{display:"flex",gap:8}}>
            {(["install","transfer","moving"] as const).map(t=>(
              <button key={t} onClick={()=>{f("jobType",t);f("price",t==="transfer"?1450:t==="moving"?800:2750);}} style={{flex:1,padding:"10px 6px",borderRadius:10,background:form.jobType===t?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${form.jobType===t?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:form.jobType===t?"#fff":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:11,fontWeight:700,textTransform:"capitalize"}}>
                {t==="install"?"Install\n$2,750":t==="transfer"?"Transfer\n$1,450":"Moving"}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
            <div><label style={lbl}>PRICE $</label><input type="number" value={form.price} onChange={e=>f("price",parseFloat(e.target.value)||0)} style={inp}/></div>
            <div><label style={lbl}>DEPOSIT $</label><input type="number" value={form.deposit} onChange={e=>f("deposit",parseFloat(e.target.value)||0)} style={inp}/></div>
          </div>
          <div style={{background:"rgba(26,110,255,0.08)",borderRadius:8,padding:"8px 12px",display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Balance Due</span>
            <span style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>${Math.max(0,(form.price||0)-(form.deposit||0)).toLocaleString()}</span>
          </div>
        </div>
        {[{l:"PROPERTY ADDRESS *",k:"address",p:"123 Main St, Dallas TX"},{l:"CLIENT NAME",k:"client",p:"John Smith"},{l:"AGENT",k:"agent",p:"Leston Eustache"},{l:"PHONE",k:"phone",p:"(214) 555-0000"},{l:"REFERRAL SOURCE",k:"referral",p:"Who referred?"},{l:"ROOMS STAGED",k:"rooms",p:"Living, Dining, Master"},{l:"NOTES",k:"notes",p:"Any notes..."}].map(field=>(
          <div key={field.k}><label style={lbl}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} placeholder={field.p} style={inp}/></div>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={lbl}>INSTALL DATE</label><input type="date" value={form.installDate||""} onChange={e=>f("installDate",e.target.value)} style={inp}/></div>
          <div><label style={lbl}>END DATE</label><input type="date" value={form.endDate||""} onChange={e=>f("endDate",e.target.value)} style={inp}/></div>
        </div>
        <label style={lbl}>STATUS</label>
        <select value={form.status} onChange={e=>f("status",e.target.value)} style={{...inp,marginBottom:0}}>
          {["active","expiring","overdue","pickup","completed"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        {view==="edit"&&<button onClick={()=>deleteJob(sel!.id)} style={{width:"100%",marginTop:14,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🗑 DELETE JOB</button>}
      </div>
    </main>
  );

  // DETAIL VIEW
  if(view==="detail"&&sel) {
    const job = {...sel,status:computeStatus(sel)};
    const s = SC[job.status]; const days = daysLeft(job.endDate); const balance = Math.max(0,job.price-job.deposit);
    return(
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Jobs</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiJob(job);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...job});setView("edit");}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>✏️ Edit</button>
          </div>
        </div>
        <div style={{padding:"20px 16px"}}>
          <div style={{background:s.bg,border:`1px solid rgba(255,255,255,0.08)`,borderLeft:`4px solid ${s.color}`,borderRadius:12,padding:"14px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:s.color}}>{s.label}</div>
            <div style={{fontSize:14,fontWeight:700,color:s.color}}>{days===null?"No end date":days<0?`${Math.abs(days)}d OVERDUE`:`${days}d remaining`}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[{l:"PRICE",v:`$${job.price.toLocaleString()}`,c:"#fff"},{l:"DEPOSIT",v:`$${job.deposit.toLocaleString()}`,c:"#00d084"},{l:"BALANCE",v:`$${balance.toLocaleString()}`,c:balance>0?"#f0c040":"#00d084"}].map((item,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px",textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:900,color:item.c}}>{item.v}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",marginTop:2}}>{item.l}</div>
              </div>
            ))}
          </div>
          {[{l:"ADDRESS",v:job.address},{l:"AGENT",v:job.agent||"—"},{l:"CLIENT",v:job.client||"—"},{l:"PHONE",v:job.phone||"—"},{l:"JOB TYPE",v:job.jobType==="transfer"?"Transfer ($1,450)":"Full Install ($2,750)"},{l:"INSTALL DATE",v:job.installDate||"Not set"},{l:"END DATE",v:job.endDate||"Not set"},{l:"ROOMS",v:job.rooms||"—"},{l:"REFERRAL",v:job.referral||"—"},{l:"NOTES",v:job.notes||"—"}].map((item,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
              <div style={{...lbl,marginBottom:3}}>{item.l}</div>
              <div style={{fontSize:14,color:item.v==="Not set"||item.v==="—"?"rgba(255,255,255,0.25)":"#fff"}}>{item.v}</div>
            </div>
          ))}
          <div style={{display:"grid",gap:10,marginTop:14}}>
            <button onClick={()=>{setAiJob(job);setShowAI(true);}} style={{background:"linear-gradient(135deg,#1a6eff,#0d4fd4)",border:"none",color:"#fff",borderRadius:12,padding:"16px",cursor:"pointer",fontSize:15,fontWeight:900}}>⚡ AI AGENT — Generate Message</button>
            <button onClick={()=>{persist(jobs.map(j=>j.id===job.id?{...j,status:"completed"}:j));setView("list");setSel(null);}} style={{background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.25)",color:"#00d084",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ MARK COMPLETED</button>
          </div>
        </div>
        {showAI&&<AIPanel job={aiJob} onClose={()=>{setShowAI(false);setAiJob(null);}}/>}
      </main>
    );
  }

  // LIST VIEW
  return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Link href="/luxury/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
            <div>
              <div style={{fontSize:16,fontWeight:800}}>STAGING JOBS</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>${totalActive.toLocaleString()} active · ${totalUnpaid.toLocaleString()} unpaid</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiJob(null);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ NEW</button>
          </div>
        </div>
        <div style={{display:"flex",gap:8,overflowX:"auto"}}>
          {["all","active","expiring","overdue","pickup","completed","unpaid"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:100,background:filter===f?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${filter===f?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:filter===f?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:"0.1em",cursor:"pointer",whiteSpace:"nowrap",textTransform:"uppercase"}}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {displayed.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.25)",fontSize:14}}>No jobs here.<br/><button onClick={()=>{setForm({...BLANK});setView("add");}} style={{marginTop:16,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13}}>+ Add Job</button></div>}
        {displayed.map((job,i)=>{
          const s=SC[job.status]; const days=daysLeft(job.endDate); const balance=Math.max(0,job.price-job.deposit);
          return(
            <div key={job.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`3px solid ${s.color}`,borderRadius:14,padding:"14px",marginBottom:10,cursor:"pointer"}}
              onClick={()=>{setSel(job);setView("detail");}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:2}}>{job.address}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{job.agent||"No agent"}{job.client?` · ${job.client}`:""}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                  <div style={{fontSize:17,fontWeight:900,color:"#1a6eff"}}>${job.price.toLocaleString()}</div>
                  {balance>0&&<div style={{fontSize:10,color:"#f0c040",fontWeight:700}}>${balance.toLocaleString()} DUE</div>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:10,background:s.bg,borderRadius:100,padding:"3px 9px",color:s.color,fontWeight:700}}>{s.label}</span>
                {days!==null&&<span style={{fontSize:10,background:"rgba(255,255,255,0.04)",borderRadius:100,padding:"3px 9px",color:days<0?"#ff4444":days<=14?"#f0c040":"rgba(255,255,255,0.35)"}}>{days<0?`${Math.abs(days)}d overdue`:`${days}d left`}</span>}
                <button onClick={e=>{e.stopPropagation();setAiJob(job);setShowAI(true);}} style={{fontSize:10,background:"rgba(26,110,255,0.12)",borderRadius:100,padding:"3px 9px",color:"#1a6eff",fontWeight:700,border:"1px solid rgba(26,110,255,0.25)",cursor:"pointer"}}>⚡ AI</button>
              </div>
            </div>
          );
        })}
      </div>
      {showAI&&<AIPanel job={aiJob} onClose={()=>{setShowAI(false);setAiJob(null);}}/>}
    </main>
  );
}

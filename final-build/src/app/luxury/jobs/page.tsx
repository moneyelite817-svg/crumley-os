"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Types ──
type JobStatus = "active"|"expiring"|"overdue"|"pickup"|"completed";
type JobType = "install"|"transfer"|"moving";
interface Job {
  id:string;address:string;client:string;agent:string;phone:string;
  jobType:JobType;installDate:string;endDate:string;price:number;
  deposit:number;rooms:string;notes:string;referral:string;
  status:JobStatus;createdAt:string;
}
interface JobDoc {
  id:string;jobId:string;docType:string;title:string;
  generatedAt:string;status:"draft"|"sent"|"signed"|"paid"|"archived";data:any;
}

const STORAGE = "cros_luxury_jobs_v3";
const DOCS_KEY = "cros_job_documents_v1";
const DOC_KEY  = "cros_active_doc_v1";

const SEED: Job[] = [
  {id:"1",address:"3031 Valentine St, Dallas TX",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"Leston listing",referral:"Leston Eustache",status:"active",createdAt:""},
  {id:"2",address:"3524 Spring Ave, Dallas TX 75210",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"Leston listing",referral:"Leston Eustache",status:"active",createdAt:""},
  {id:"3",address:"3610 Durango Dr, Dallas TX",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"Leston listing",referral:"Leston Eustache",status:"active",createdAt:""},
  {id:"4",address:"4009 Finis St, Dallas TX 75212",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:1450,rooms:"",notes:"Leston listing",referral:"Leston Eustache",status:"active",createdAt:""},
  {id:"5",address:"1509 Dennison St, Dallas TX",client:"",agent:"KC",phone:"",jobType:"transfer",installDate:"",endDate:"",price:1450,deposit:0,rooms:"",notes:"KC listing",referral:"KC",status:"active",createdAt:""},
  {id:"6",address:"1507 Dennison St, Dallas TX",client:"",agent:"KC",phone:"",jobType:"transfer",installDate:"",endDate:"",price:1450,deposit:0,rooms:"",notes:"KC listing",referral:"KC",status:"active",createdAt:""},
];
const BLANK: Omit<Job,"id"|"createdAt"> = {address:"",client:"",agent:"",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"",referral:"",status:"active"};
const SC: Record<JobStatus,{color:string;bg:string;label:string}> = {
  active:{color:"#00d084",bg:"rgba(0,208,132,0.1)",label:"ACTIVE"},
  expiring:{color:"#f0c040",bg:"rgba(240,192,64,0.1)",label:"EXPIRING"},
  overdue:{color:"#ff4444",bg:"rgba(255,68,68,0.1)",label:"OVERDUE"},
  pickup:{color:"#1a6eff",bg:"rgba(26,110,255,0.1)",label:"PICKUP"},
  completed:{color:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)",label:"DONE"},
};
function computeStatus(j:Job):JobStatus{if(j.status==="completed"||j.status==="pickup")return j.status;if(!j.endDate)return"active";const d=Math.ceil((new Date(j.endDate).getTime()-Date.now())/86400000);if(d<0)return"overdue";if(d<=14)return"expiring";return"active";}
function daysLeft(endDate:string){if(!endDate)return null;return Math.ceil((new Date(endDate).getTime()-Date.now())/86400000);}
const inp:any={width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10};
const lbl:any={display:"block",fontFamily:"system-ui",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:4};

// ── AI PANEL ──
function AIPanel({job,onClose}:{job:Job|null;onClose:()=>void}){
  const [action,setAction]=useState<string|null>(null);
  const [extra,setExtra]=useState("");
  const [result,setResult]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [copied,setCopied]=useState(false);
  const balance=job?Math.max(0,(job.price||0)-(job.deposit||0)):0;
  const days=job?daysLeft(job.endDate):null;
  const actions=[
    {id:"followup",icon:"💬",label:"Follow-Up Text",desc:"Check in on listing, reaffirm value"},
    {id:"renewal",icon:"🔄",label:"90-Day Renewal",desc:"Pitch extension or transfer"},
    {id:"collections",icon:"💰",label:"Collect $"+balance.toLocaleString(),desc:"Professional payment collection"},
    {id:"pickup",icon:"📦",label:"Schedule Pickup",desc:"Coordinate furniture removal"},
    {id:"instagram",icon:"📸",label:"Instagram Caption",desc:"Premium staging post content"},
  ];
  function buildPrompt(){
    const base=`All In One Luxury Designs agent. Owner: Terrance Crumley. Premium DFW staging. Install $2,750, transfer $1,450, 90 days.\nProperty: ${job?.address}. Agent: ${job?.agent}. Type: ${job?.jobType}. Price: $${job?.price}. Deposit: $${job?.deposit}. Balance: $${balance}. Days left: ${days!==null?(days<0?Math.abs(days)+"d OVERDUE":days+"d remaining"):"not set"}. Notes: ${job?.notes||"none"}.\n${extra?`Context: ${extra}`:""}`;
    if(action==="followup")return`${base}\nWarm professional follow-up to ${job?.agent}. Under 5 sentences.`;
    if(action==="renewal")return`${base}\nConfident renewal pitch to ${job?.agent}. Reference furniture already on site. Under 4 sentences.`;
    if(action==="collections")return`${base}\nProfessional collections text for $${balance}. State balance, request Zelle/Venmo/Cash, mention pickup if unpaid. Under 4 sentences.`;
    if(action==="pickup")return`${base}\nCoordinate pickup from ${job?.address}. Professional, easy, confirm timeline. Under 4 sentences.`;
    if(action==="instagram")return`${base}\nInstagram caption for staged property. Premium, aspirational, tag DFW agents. #AllInOneLuxury #DFWStaging #HomeStaging. Under 8 sentences.`;
    return base;
  }
  async function generate(){
    setLoading(true);setResult("");setError("");
    try{const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:buildPrompt()})});const d=await r.json();if(d.error)setError(d.message||d.error);else setResult(d.text);}
    catch{setError("Network error.");}
    setLoading(false);
  }
  function copy(){navigator.clipboard?.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);}
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.75)"}}/>
      <div style={{position:"relative",background:"#0d1628",borderRadius:"20px 20px 0 0",border:"1px solid rgba(26,110,255,0.3)",padding:"20px 16px 48px",maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><div style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>⚡ AI AGENT</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{job?.address?.split(",")[0]}</div></div>
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
            <textarea value={extra} onChange={e=>setExtra(e.target.value)} placeholder="Any specific notes..." style={{...inp,height:60,resize:"none" as const}}/>
            <button onClick={generate} style={{width:"100%",background:"#1a6eff",border:"none",color:"#fff",borderRadius:12,padding:"16px",fontSize:15,fontWeight:900,cursor:"pointer"}}>⚡ GENERATE</button>
          </div>
        )}
        {loading&&<div style={{textAlign:"center",padding:"30px 0"}}><div style={{fontSize:32,marginBottom:12}}>🤖</div><div style={{fontSize:14,fontWeight:800,color:"#1a6eff",letterSpacing:"0.1em"}}>GENERATING...</div></div>}
        {error&&<div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10,padding:"12px",color:"#ff8888",fontSize:13}}>{error}</div>}
        {result&&(
          <div>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px",fontSize:14,lineHeight:1.8,color:"#fff",whiteSpace:"pre-wrap",marginBottom:12}}>{result}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
              <button onClick={()=>{setResult("");setError("");}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13}}>🔄 Redo</button>
              <button onClick={copy} style={{background:copied?"#00d084":"#1a6eff",border:"none",color:copied?"#000":"#fff",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:14,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── DOCUMENTS TAB ──
function JobDocuments({job}:{job:Job}){
  const router = useRouter();
  const [docs,setDocs]=useState<JobDoc[]>([]);

  useEffect(()=>{
    try{const all=JSON.parse(localStorage.getItem(DOCS_KEY)||"[]");setDocs(all.filter((d:JobDoc)=>d.jobId===job.id));}catch{}
  },[job.id]);

  function openDoc(type:"invoice"|"contract"){
    try{localStorage.setItem(DOC_KEY,JSON.stringify(job));}catch{}
    router.push(`/luxury/${type}`);
  }

  function updateStatus(docId:string, status:string){
    try{
      const all=JSON.parse(localStorage.getItem(DOCS_KEY)||"[]");
      const updated=all.map((d:JobDoc)=>d.id===docId?{...d,status}:d);
      localStorage.setItem(DOCS_KEY,JSON.stringify(updated));
      setDocs(updated.filter((d:JobDoc)=>d.jobId===job.id));
    }catch{}
  }

  function deleteDoc(docId:string){
    if(!confirm("Delete this document?"))return;
    try{
      const all=JSON.parse(localStorage.getItem(DOCS_KEY)||"[]");
      const updated=all.filter((d:JobDoc)=>d.id!==docId);
      localStorage.setItem(DOCS_KEY,JSON.stringify(updated));
      setDocs(updated.filter((d:JobDoc)=>d.jobId===job.id));
    }catch{}
  }

  const balance=Math.max(0,job.price-job.deposit);
  const statusColors:Record<string,{c:string;bg:string}> = {
    draft:{c:"rgba(255,255,255,0.5)",bg:"rgba(255,255,255,0.06)"},
    sent:{c:"#1a6eff",bg:"rgba(26,110,255,0.12)"},
    signed:{c:"#00d084",bg:"rgba(0,208,132,0.12)"},
    paid:{c:"#00d084",bg:"rgba(0,208,132,0.15)"},
    archived:{c:"rgba(255,255,255,0.25)",bg:"rgba(255,255,255,0.03)"},
  };

  return(
    <div style={{padding:"16px"}}>
      {/* Quick info strip */}
      <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.15)",borderRadius:12,padding:"12px 14px",marginBottom:16,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[{l:"PRICE",v:`$${job.price.toLocaleString()}`,c:"#fff"},{l:"DEPOSIT",v:`$${job.deposit.toLocaleString()}`,c:"#00d084"},{l:"BALANCE",v:`$${balance.toLocaleString()}`,c:balance>0?"#f0c040":"#00d084"}].map((s,i)=>(
          <div key={i} style={{textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginTop:1}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Generate buttons */}
      <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:12}}>GENERATE DOCUMENT</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {[
          {icon:"📄",label:"Staging Agreement",sub:"Full liability contract",color:"#1A5CCC",action:()=>openDoc("contract")},
          {icon:"🧾",label:"Invoice",sub:`$${job.price.toLocaleString()} — generate + print`,color:"#1A5CCC",action:()=>openDoc("invoice")},
          {icon:"💰",label:"Balance Invoice",sub:`$${balance.toLocaleString()} balance due`,color:balance>0?"#f0c040":"rgba(255,255,255,0.3)",action:()=>openDoc("invoice")},
          {icon:"📋",label:"Renewal Agreement",sub:"90-day extension",color:"#00d084",action:()=>openDoc("contract")},
        ].map((btn,i)=>(
          <div key={i} onClick={btn.action} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${btn.color}33`,borderRadius:12,padding:"14px 12px",cursor:"pointer"}}>
            <div style={{fontSize:22,marginBottom:6}}>{btn.icon}</div>
            <div style={{fontSize:13,fontWeight:700,color:btn.color,marginBottom:2}}>{btn.label}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{btn.sub}</div>
          </div>
        ))}
      </div>

      {/* Saved documents */}
      {docs.length > 0 && (
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:12}}>SAVED DOCUMENTS ({docs.length})</div>
          {docs.map(doc=>{
            const sc=statusColors[doc.status]||statusColors.draft;
            return(
              <div key={doc.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"14px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{doc.title}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{new Date(doc.generatedAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:10,padding:"3px 9px",background:sc.bg,color:sc.c,borderRadius:100,fontWeight:700,textTransform:"uppercase" as const}}>{doc.status}</span>
                    <button onClick={()=>deleteDoc(doc.id)} style={{background:"rgba(255,68,68,0.1)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11}}>🗑</button>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                  {["sent","signed","paid","archived"].map(s=>(
                    <button key={s} onClick={()=>updateStatus(doc.id,s)} style={{fontSize:10,background:doc.status===s?"rgba(26,110,255,0.2)":"rgba(255,255,255,0.04)",border:`1px solid ${doc.status===s?"rgba(26,110,255,0.4)":"rgba(255,255,255,0.08)"}`,color:doc.status===s?"#1a6eff":"rgba(255,255,255,0.4)",borderRadius:6,padding:"4px 10px",cursor:"pointer",textTransform:"capitalize" as const}}>
                      Mark {s}
                    </button>
                  ))}
                  <button onClick={()=>{
                    const docData=doc.data;
                    try{localStorage.setItem(DOC_KEY,JSON.stringify({...job,...(docData?.fields||{})}));}catch{}
                    router.push(`/luxury/${doc.docType==="invoice"?"invoice":"contract"}`);
                  }} style={{fontSize:10,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.25)",color:"#1a6eff",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:700}}>
                    👁 View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {docs.length===0&&(
        <div style={{textAlign:"center",padding:"30px 0",color:"rgba(255,255,255,0.2)",fontSize:13,lineHeight:1.8}}>
          No documents yet.<br/>Tap a button above to generate your first document.
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  const [jobs,setJobs]=useState<Job[]>([]);
  const [view,setView]=useState<"list"|"detail"|"add"|"edit">("list");
  const [sel,setSel]=useState<Job|null>(null);
  const [form,setForm]=useState<any>({...BLANK});
  const [filter,setFilter]=useState("all");
  const [aiJob,setAiJob]=useState<Job|null>(null);
  const [showAI,setShowAI]=useState(false);
  const [detailTab,setDetailTab]=useState<"info"|"docs">("info");

  useEffect(()=>{try{const s=localStorage.getItem(STORAGE);setJobs(s?JSON.parse(s):SEED);}catch{setJobs(SEED);}}, []);
  function persist(data:Job[]){setJobs(data);try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch{}}
  function f(k:string,v:any){setForm((p:any)=>({...p,[k]:v}));}
  function addJob(){if(!form.address?.trim()){alert("Address required");return;}persist([...jobs,{...form,id:Date.now().toString(),createdAt:new Date().toISOString()}]);setForm({...BLANK});setView("list");}
  function saveEdit(){if(!sel)return;const u=jobs.map(j=>j.id===sel.id?{...j,...form}:j);persist(u);setSel({...sel,...form});setView("detail");}
  function deleteJob(id:string){if(!confirm("Delete?"))return;persist(jobs.filter(j=>j.id!==id));setView("list");setSel(null);}

  const displayed=jobs.map(j=>({...j,status:computeStatus(j)})).filter(j=>filter==="all"||j.status===filter||(filter==="unpaid"&&j.price-j.deposit>0));
  const totalActive=jobs.filter(j=>computeStatus(j)!=="completed").reduce((a,j)=>a+j.price,0);
  const totalUnpaid=jobs.reduce((a,j)=>a+Math.max(0,j.price-j.deposit),0);

  // ADD/EDIT form
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
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {(["install","transfer","moving"] as const).map(t=>(
              <button key={t} onClick={()=>{f("jobType",t);f("price",t==="transfer"?1450:t==="moving"?800:2750);}} style={{flex:1,padding:"10px 6px",borderRadius:10,background:form.jobType===t?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${form.jobType===t?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:form.jobType===t?"#fff":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:11,fontWeight:700,textTransform:"capitalize" as const}}>
                {t==="install"?"Install\n$2,750":t==="transfer"?"Transfer\n$1,450":"Moving"}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={lbl}>PRICE $</label><input type="number" value={form.price} onChange={e=>f("price",parseFloat(e.target.value)||0)} style={inp}/></div>
            <div><label style={lbl}>DEPOSIT $</label><input type="number" value={form.deposit} onChange={e=>f("deposit",parseFloat(e.target.value)||0)} style={inp}/></div>
          </div>
          <div style={{background:"rgba(26,110,255,0.08)",borderRadius:8,padding:"8px 12px",display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Balance Due</span>
            <span style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>${Math.max(0,(form.price||0)-(form.deposit||0)).toLocaleString()}</span>
          </div>
        </div>
        {[{l:"PROPERTY ADDRESS *",k:"address"},{l:"CLIENT NAME",k:"client"},{l:"AGENT",k:"agent"},{l:"PHONE",k:"phone"},{l:"REFERRAL SOURCE",k:"referral"},{l:"ROOMS STAGED",k:"rooms"},{l:"NOTES",k:"notes"}].map(field=>(
          <div key={field.k}><label style={lbl}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} style={inp}/></div>
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
  if(view==="detail"&&sel){
    const job={...sel,status:computeStatus(sel)};
    const s=SC[job.status]; const days=daysLeft(job.endDate); const balance=Math.max(0,job.price-job.deposit);
    return(
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("list");setSel(null);setDetailTab("info");}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Jobs</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiJob(job);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...job});setView("edit");}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13}}>✏️</button>
          </div>
        </div>

        {/* Job header */}
        <div style={{padding:"16px 16px 0"}}>
          <div style={{background:s.bg,border:"1px solid rgba(255,255,255,0.06)",borderLeft:`4px solid ${s.color}`,borderRadius:12,padding:"14px",marginBottom:14}}>
            <div style={{fontSize:18,fontWeight:900,marginBottom:4}}>{job.address}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{job.agent||"No agent"}{job.client?` · ${job.client}`:""}</div>
            <div style={{display:"flex",gap:6,marginTop:10}}>
              <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",background:s.bg,color:s.color,borderRadius:100,textTransform:"uppercase" as const}}>{s.label}</span>
              {days!==null&&<span style={{fontSize:10,padding:"3px 9px",background:"rgba(255,255,255,0.04)",borderRadius:100,color:days<0?"#ff4444":days<=14?"#f0c040":"rgba(255,255,255,0.4)"}}>{days<0?`${Math.abs(days)}d overdue`:`${days}d left`}</span>}
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:8,marginBottom:0}}>
            {[{id:"info",label:"📋 Job Info"},{id:"docs",label:"📄 Documents"}].map(t=>(
              <button key={t.id} onClick={()=>setDetailTab(t.id as any)} style={{flex:1,padding:"10px",borderRadius:10,background:detailTab===t.id?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${detailTab===t.id?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:detailTab===t.id?"#fff":"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:13,fontWeight:700}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {detailTab==="info" && (
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[{l:"PRICE",v:`$${job.price.toLocaleString()}`,c:"#fff"},{l:"DEPOSIT",v:`$${job.deposit.toLocaleString()}`,c:"#00d084"},{l:"BALANCE",v:`$${balance.toLocaleString()}`,c:balance>0?"#f0c040":"#00d084"}].map((item,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:18,fontWeight:900,color:item.c}}>{item.v}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",marginTop:2}}>{item.l}</div>
                </div>
              ))}
            </div>
            {[{l:"JOB TYPE",v:job.jobType==="transfer"?"Transfer ($1,450)":job.jobType==="moving"?"Moving":"Full Install ($2,750)"},{l:"INSTALL DATE",v:job.installDate||"Not set"},{l:"END DATE",v:job.endDate||"Not set"},{l:"ROOMS",v:job.rooms||"—"},{l:"REFERRAL",v:job.referral||"—"},{l:"NOTES",v:job.notes||"—"}].map((item,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                <div style={{...lbl,marginBottom:3}}>{item.l}</div>
                <div style={{fontSize:14,color:item.v==="Not set"||item.v==="—"?"rgba(255,255,255,0.25)":"#fff"}}>{item.v}</div>
              </div>
            ))}
            <div style={{display:"grid",gap:10,marginTop:14}}>
              <button onClick={()=>setDetailTab("docs")} style={{background:"linear-gradient(135deg,#1A5CCC,#0d3fa0)",border:"none",color:"#fff",borderRadius:12,padding:"16px",cursor:"pointer",fontSize:15,fontWeight:900}}>📄 Documents & Invoices</button>
              <button onClick={()=>{persist(jobs.map(j=>j.id===job.id?{...j,status:"completed"}:j));setView("list");setSel(null);}} style={{background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.25)",color:"#00d084",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ MARK COMPLETED</button>
            </div>
          </div>
        )}

        {detailTab==="docs" && <JobDocuments job={job}/>}

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
            <button onClick={()=>{setAiJob(null);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ NEW</button>
          </div>
        </div>
        <div style={{display:"flex",gap:8,overflowX:"auto"}}>
          {["all","active","expiring","overdue","pickup","completed","unpaid"].map(fv=>(
            <button key={fv} onClick={()=>setFilter(fv)} style={{padding:"5px 12px",borderRadius:100,background:filter===fv?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${filter===fv?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:filter===fv?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:"0.1em",cursor:"pointer",whiteSpace:"nowrap" as const,textTransform:"uppercase" as const}}>{fv}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {displayed.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.25)",fontSize:14}}>No jobs.<br/><button onClick={()=>{setForm({...BLANK});setView("add");}} style={{marginTop:16,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13}}>+ Add Job</button></div>}
        {displayed.map((job)=>{
          const s=SC[job.status]; const days=daysLeft(job.endDate); const balance=Math.max(0,job.price-job.deposit);
          return(
            <div key={job.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`3px solid ${s.color}`,borderRadius:14,padding:"14px",marginBottom:10,cursor:"pointer"}} onClick={()=>{setSel(job);setView("detail");setDetailTab("info");}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap" as const,overflow:"hidden",textOverflow:"ellipsis",marginBottom:2}}>{job.address}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{job.agent||"No agent"}{job.client?` · ${job.client}`:""}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                  <div style={{fontSize:17,fontWeight:900,color:"#1a6eff"}}>${job.price.toLocaleString()}</div>
                  {balance>0&&<div style={{fontSize:10,color:"#f0c040",fontWeight:700}}>${balance.toLocaleString()} DUE</div>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                <span style={{fontSize:10,background:s.bg,borderRadius:100,padding:"3px 9px",color:s.color,fontWeight:700,textTransform:"uppercase" as const}}>{s.label}</span>
                {days!==null&&<span style={{fontSize:10,background:"rgba(255,255,255,0.04)",borderRadius:100,padding:"3px 9px",color:days<0?"#ff4444":days<=14?"#f0c040":"rgba(255,255,255,0.35)"}}>{days<0?`${Math.abs(days)}d overdue`:`${days}d left`}</span>}
                <button onClick={e=>{e.stopPropagation();setAiJob(job);setShowAI(true);}} style={{fontSize:10,background:"rgba(26,110,255,0.12)",borderRadius:100,padding:"3px 9px",color:"#1a6eff",fontWeight:700,border:"1px solid rgba(26,110,255,0.25)",cursor:"pointer"}}>⚡ AI</button>
                <button onClick={e=>{e.stopPropagation();setSel(job);setView("detail");setDetailTab("docs");}} style={{fontSize:10,background:"rgba(26,92,204,0.12)",borderRadius:100,padding:"3px 9px",color:"#1A5CCC",fontWeight:700,border:"1px solid rgba(26,92,204,0.25)",cursor:"pointer"}}>📄 Docs</button>
              </div>
            </div>
          );
        })}
      </div>
      {showAI&&<AIPanel job={aiJob} onClose={()=>{setShowAI(false);setAiJob(null);}}/>}
    </main>
  );
}

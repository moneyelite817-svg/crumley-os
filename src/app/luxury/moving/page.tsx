"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE = "cros_moving_jobs_v1";
const BLANK = {clientName:"",clientPhone:"",referralSource:"Leston Eustache",pickupAddress:"",dropoffAddress:"",moveDate:"",moveTime:"8:00 AM",estimatedHours:4,crewNeeded:2,trucksNeeded:1,specialItems:"",totalPrice:800,deposit:0,payStatus:"unpaid",status:"estimate",notes:""};
const SS: Record<string,{color:string;bg:string;label:string}> = {estimate:{color:"#f0c040",bg:"rgba(240,192,64,0.1)",label:"ESTIMATE"},scheduled:{color:"#1a6eff",bg:"rgba(26,110,255,0.1)",label:"SCHEDULED"},in_progress:{color:"#00d084",bg:"rgba(0,208,132,0.1)",label:"IN PROGRESS"},completed:{color:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)",label:"DONE"},cancelled:{color:"rgba(255,68,68,0.5)",bg:"rgba(255,68,68,0.06)",label:"CANCELLED"}};
const inp: any = {width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10};
const lbl: any = {display:"block",fontFamily:"system-ui",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",marginBottom:4};

function AIPanel({ job, onClose }: { job: any; onClose: ()=>void }) {
  const [action, setAction] = useState<string|null>(null);
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const balance = job ? Math.max(0,(job.totalPrice||0)-(job.deposit||0)) : 0;

  const actions = [
    {id:"estimate",icon:"📊",label:"Send Estimate",desc:"Professional estimate message to the client"},
    {id:"confirm",icon:"✅",label:"Booking Confirmation",desc:"Confirm the move date and details"},
    {id:"dayBefore",icon:"📅",label:"Day-Before Reminder",desc:"Remind client of tomorrow's move"},
    {id:"leadGen",icon:"🚛",label:"Lead Generation",desc:"Outreach to generate new moving leads"},
    {id:"referral",icon:"🤝",label:"Referral Request",desc:"Ask Leston or agents to refer moving clients"},
    {id:"collections",icon:"💰",label:"Payment Collection",desc:`Collect $${balance.toLocaleString()} outstanding`},
  ];

  function buildPrompt() {
    const base = `You are the AI agent for a premium DFW moving company co-run by Terrance Crumley (operations) and Leston Eustache (top DFW realtor, @iamlestacks). Professional residential moving in the DFW Metroplex.

Client: ${job?.clientName||"the client"}
Phone: ${job?.clientPhone||"on file"}
Pickup: ${job?.pickupAddress||"not set"}
Dropoff: ${job?.dropoffAddress||"not set"}
Move date: ${job?.moveDate||"TBD"}
Crew: ${job?.crewNeeded||2} crew · ${job?.trucksNeeded||1} truck · ${job?.estimatedHours||4} hours
Total price: $${job?.totalPrice?.toLocaleString()||0}
Deposit: $${job?.deposit?.toLocaleString()||0}
Balance: $${balance.toLocaleString()}
Referral source: ${job?.referralSource||"not noted"}
Special items: ${job?.specialItems||"none"}
Notes: ${job?.notes||"none"}
${extra?`\nContext: ${extra}`:""}`;

    if(action==="estimate") return `${base}\n\nWrite a professional moving estimate text to ${job?.clientName||"the client"}. Include the price of $${job?.totalPrice?.toLocaleString()}, crew size, truck, and estimated duration. Sound like a trusted premium service backed by a top DFW realtor. Include a deposit ask. Under 6 sentences.`;
    if(action==="confirm") return `${base}\n\nWrite a booking confirmation text to ${job?.clientName||"the client"} confirming their move on ${job?.moveDate||"the scheduled date"}. Include pickup/dropoff, time, crew info. Sound professional and reassuring. Under 5 sentences.`;
    if(action==="dayBefore") return `${base}\n\nWrite a day-before reminder text to ${job?.clientName||"the client"}. Remind them of tomorrow's move, confirm arrival time of ${job?.moveTime||"8:00 AM"}, and ask if there are any last-minute items to note. Under 4 sentences.`;
    if(action==="leadGen") return `${base}\n\nWrite an outreach text to generate new moving business in DFW. Target: realtors, builders, or homeowners in ${job?.pickupAddress?.split(",").slice(-2).join(",").trim()||"DFW"}. Position the company as premium, reliable, and backed by Leston Eustache's real estate network. Under 5 sentences.`;
    if(action==="referral") return `${base}\n\nWrite a referral request text to Leston Eustache or another DFW agent. Ask them to recommend our moving company to clients who are closing or moving soon. Make it easy and specific. Under 4 sentences.`;
    if(action==="collections") return `${base}\n\nWrite a professional payment collection text to ${job?.clientName||"the client"} for the outstanding balance of $${balance.toLocaleString()}. Firm but respectful. State payment methods. Under 4 sentences.`;
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
          <div><div style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>⚡ AI AGENT</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>{job?.clientName||"Moving AI"}</div></div>
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

export default function MovingPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [view, setView] = useState<"list"|"detail"|"add"|"edit">("list");
  const [sel, setSel] = useState<any>(null);
  const [form, setForm] = useState<any>({...BLANK});
  const [filter, setFilter] = useState("all");
  const [showAI, setShowAI] = useState(false);
  const [aiJob, setAiJob] = useState<any>(null);

  useEffect(()=>{try{const s=localStorage.getItem(STORAGE);setJobs(s?JSON.parse(s):[]);}catch{setJobs([]);}},[]);
  function persist(data: any[]) {setJobs(data);try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch{}}
  function f(k:string,v:any){setForm((p:any)=>({...p,[k]:v}));}
  function calcPrice(h:number,c:number,t:number){return Math.round((h*c*45)+(t*150));}

  function save() {
    if(!form.pickupAddress?.trim()){alert("Pickup address required");return;}
    if(view==="edit"&&sel){persist(jobs.map(j=>j.id===sel.id?{...j,...form}:j));setSel({...sel,...form});setView("detail");}
    else{persist([...jobs,{...form,id:Date.now().toString(),createdAt:new Date().toISOString()}]);setForm({...BLANK});setView("list");}
  }

  const displayed = jobs.filter(j=>filter==="all"||j.status===filter||(filter==="unpaid"&&j.payStatus!=="paid"));
  const totalRev = jobs.filter(j=>j.status!=="cancelled").reduce((a:number,j:any)=>a+(j.totalPrice||0),0);
  const totalUnpaid = jobs.filter(j=>j.payStatus!=="paid"&&j.status!=="cancelled").reduce((a:number,j:any)=>a+Math.max(0,(j.totalPrice||0)-(j.deposit||0)),0);

  if(view==="add"||view==="edit") {
    const estPrice = calcPrice(form.estimatedHours||4,form.crewNeeded||2,form.trucksNeeded||1);
    const balance = Math.max(0,(form.totalPrice||estPrice)-(form.deposit||0));
    return(
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView(view==="edit"?"detail":"list");setForm({...BLANK});}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Cancel</button>
          <span style={{fontSize:14,fontWeight:800}}>{view==="edit"?"EDIT MOVE":"NEW MOVE"}</span>
          <button onClick={save} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
        </div>
        <div style={{padding:"20px 16px"}}>
          <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:12,padding:"14px",marginBottom:14,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
            {[{l:"TOTAL",v:`$${(form.totalPrice||estPrice).toLocaleString()}`},{l:"DEPOSIT",v:`$${(form.deposit||0).toLocaleString()}`},{l:"BALANCE",v:`$${balance.toLocaleString()}`}].map((s,i)=>(
              <div key={i}><div style={{fontSize:20,fontWeight:900,color:i===0?"#1a6eff":i===1?"#00d084":balance>0?"#f0c040":"#00d084"}}>{s.v}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginTop:2}}>{s.l}</div></div>
            ))}
          </div>
          {[{l:"CLIENT NAME",k:"clientName"},{l:"CLIENT PHONE",k:"clientPhone"},{l:"REFERRAL SOURCE",k:"referralSource"},{l:"PICKUP ADDRESS *",k:"pickupAddress"},{l:"DROPOFF ADDRESS",k:"dropoffAddress"}].map(field=>(
            <div key={field.k}><label style={lbl}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} style={inp}/></div>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={lbl}>MOVE DATE</label><input type="date" value={form.moveDate||""} onChange={e=>f("moveDate",e.target.value)} style={inp}/></div>
            <div><label style={lbl}>START TIME</label><input value={form.moveTime||""} onChange={e=>f("moveTime",e.target.value)} placeholder="8:00 AM" style={inp}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div><label style={lbl}>HOURS</label><input type="number" value={form.estimatedHours} onChange={e=>{const v=parseInt(e.target.value)||4;f("estimatedHours",v);f("totalPrice",calcPrice(v,form.crewNeeded||2,form.trucksNeeded||1));}} style={inp}/></div>
            <div><label style={lbl}>CREW</label><input type="number" value={form.crewNeeded} onChange={e=>{const v=parseInt(e.target.value)||2;f("crewNeeded",v);f("totalPrice",calcPrice(form.estimatedHours||4,v,form.trucksNeeded||1));}} style={inp}/></div>
            <div><label style={lbl}>TRUCKS</label><input type="number" value={form.trucksNeeded} onChange={e=>{const v=parseInt(e.target.value)||1;f("trucksNeeded",v);f("totalPrice",calcPrice(form.estimatedHours||4,form.crewNeeded||2,v));}} style={inp}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={lbl}>TOTAL PRICE $</label><input type="number" value={form.totalPrice||estPrice} onChange={e=>f("totalPrice",parseFloat(e.target.value)||0)} style={inp}/></div>
            <div><label style={lbl}>DEPOSIT $</label><input type="number" value={form.deposit||0} onChange={e=>f("deposit",parseFloat(e.target.value)||0)} style={inp}/></div>
          </div>
          <label style={lbl}>SPECIAL ITEMS</label><input value={form.specialItems||""} onChange={e=>f("specialItems",e.target.value)} placeholder="Piano, safe, fragile items..." style={inp}/>
          <label style={lbl}>STATUS</label>
          <select value={form.status} onChange={e=>f("status",e.target.value)} style={{...inp}}>
            {["estimate","scheduled","in_progress","completed","cancelled"].map(s=><option key={s} value={s}>{SS[s]?.label||s}</option>)}
          </select>
          <label style={lbl}>PAYMENT STATUS</label>
          <select value={form.payStatus} onChange={e=>f("payStatus",e.target.value)} style={{...inp}}>
            {["unpaid","deposit","paid"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <label style={lbl}>NOTES</label><textarea value={form.notes||""} onChange={e=>f("notes",e.target.value)} style={{...inp,height:70,resize:"none"}}/>
        </div>
      </main>
    );
  }

  if(view==="detail"&&sel) {
    const s=SS[sel.status]||SS.estimate; const balance=Math.max(0,(sel.totalPrice||0)-(sel.deposit||0));
    const profit=Math.round((sel.totalPrice||0)-((sel.crewNeeded||2)*(sel.estimatedHours||4)*25)-((sel.trucksNeeded||1)*100));
    return(
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Moving</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiJob(sel);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...sel});setView("edit");}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>✏️</button>
          </div>
        </div>
        <div style={{padding:"20px 16px"}}>
          <div style={{background:s.bg,borderLeft:`4px solid ${s.color}`,border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:s.color}}>{s.label}</span>
            {sel.moveDate&&<span style={{fontSize:13,color:"rgba(255,255,255,0.6)"}}>{sel.moveDate} {sel.moveTime}</span>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[{l:"PRICE",v:`$${(sel.totalPrice||0).toLocaleString()}`,c:"#1a6eff"},{l:"BALANCE",v:`$${balance.toLocaleString()}`,c:balance>0?"#f0c040":"#00d084"},{l:"PROFIT",v:`$${profit.toLocaleString()}`,c:"#00d084"}].map((s2,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px",textAlign:"center"}}>
                <div style={{fontSize:17,fontWeight:900,color:s2.c}}>{s2.v}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginTop:2}}>{s2.l}</div>
              </div>
            ))}
          </div>
          {[{l:"CLIENT",v:sel.clientName||"—"},{l:"PHONE",v:sel.clientPhone||"—"},{l:"REFERRAL",v:sel.referralSource||"—"},{l:"PICKUP",v:sel.pickupAddress||"—"},{l:"DROPOFF",v:sel.dropoffAddress||"—"},{l:"CREW",v:`${sel.crewNeeded||2} crew · ${sel.trucksNeeded||1} truck · ${sel.estimatedHours||4}hrs`},{l:"SPECIAL ITEMS",v:sel.specialItems||"—"},{l:"PAYMENT",v:sel.payStatus?.toUpperCase()||"—"},{l:"NOTES",v:sel.notes||"—"}].map((item,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
              <div style={{...lbl,marginBottom:3}}>{item.l}</div><div style={{fontSize:14,color:item.v==="—"?"rgba(255,255,255,0.25)":"#fff"}}>{item.v}</div>
            </div>
          ))}
          <button onClick={()=>{setAiJob(sel);setShowAI(true);}} style={{width:"100%",marginTop:10,background:"linear-gradient(135deg,#1a6eff,#0d4fd4)",border:"none",color:"#fff",borderRadius:12,padding:"16px",cursor:"pointer",fontSize:15,fontWeight:900}}>⚡ AI AGENT — Generate Message</button>
          <button onClick={()=>{if(!confirm("Delete?"))return;persist(jobs.filter(j=>j.id!==sel.id));setView("list");setSel(null);}} style={{width:"100%",marginTop:10,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🗑 DELETE</button>
        </div>
        {showAI&&<AIPanel job={aiJob} onClose={()=>{setShowAI(false);setAiJob(null);}}/>}
      </main>
    );
  }

  return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Link href="/luxury/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
            <div><div style={{fontSize:16,fontWeight:800}}>MOVING</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>${totalRev.toLocaleString()} total · ${totalUnpaid.toLocaleString()} unpaid</div></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiJob(null);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ NEW</button>
          </div>
        </div>
        <div style={{display:"flex",gap:8,overflowX:"auto"}}>
          {["all","estimate","scheduled","in_progress","completed","unpaid"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:100,background:filter===f?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${filter===f?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:filter===f?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:"0.08em",cursor:"pointer",whiteSpace:"nowrap",textTransform:"uppercase"}}>{f.replace("_"," ")}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {displayed.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.25)",fontSize:14,lineHeight:1.8}}>No moving jobs yet.<br/><button onClick={()=>{setForm({...BLANK});setView("add");}} style={{marginTop:16,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13}}>+ Create First Move</button></div>}
        {displayed.map((job:any)=>{
          const s=SS[job.status]||SS.estimate; const balance=Math.max(0,(job.totalPrice||0)-(job.deposit||0));
          return(
            <div key={job.id} onClick={()=>{setSel(job);setView("detail");}} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`3px solid ${s.color}`,borderRadius:14,padding:"14px",marginBottom:10,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{job.clientName||"No client"}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{job.pickupAddress||"No pickup"} → {job.dropoffAddress||"?"}</div></div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}><div style={{fontSize:17,fontWeight:900,color:"#1a6eff"}}>${(job.totalPrice||0).toLocaleString()}</div>{balance>0&&<div style={{fontSize:10,color:"#f0c040",fontWeight:700}}>${balance.toLocaleString()} DUE</div>}</div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:10,background:s.bg,borderRadius:100,padding:"3px 9px",color:s.color,fontWeight:700}}>{s.label}</span>
                {job.moveDate&&<span style={{fontSize:10,background:"rgba(255,255,255,0.04)",borderRadius:100,padding:"3px 9px",color:"rgba(255,255,255,0.4)"}}>{job.moveDate}</span>}
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

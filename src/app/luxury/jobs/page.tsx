"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

type JobStatus = "active"|"expiring"|"overdue"|"pickup"|"completed";
type JobType = "install"|"transfer"|"moving";

interface Job {
  id: string;
  address: string;
  client: string;
  agent: string;
  phone: string;
  jobType: JobType;
  installDate: string;
  endDate: string;
  price: number;
  deposit: number;
  rooms: string;
  notes: string;
  referral: string;
  status: JobStatus;
  createdAt: string;
}

const STORAGE = "cros_luxury_jobs_v3";

const SEED: Job[] = [
  { id:"1", address:"3031 Valentine St, Dallas TX", client:"", agent:"Leston Eustache", phone:"", jobType:"install", installDate:"", endDate:"", price:2750, deposit:0, rooms:"", notes:"Leston listing", referral:"Leston Eustache", status:"active", createdAt:new Date().toISOString() },
  { id:"2", address:"3524 Spring Ave, Dallas TX 75210", client:"", agent:"Leston Eustache", phone:"", jobType:"install", installDate:"", endDate:"", price:2750, deposit:0, rooms:"", notes:"Leston listing", referral:"Leston Eustache", status:"active", createdAt:new Date().toISOString() },
  { id:"3", address:"3610 Durango Dr, Dallas TX", client:"", agent:"Leston Eustache", phone:"", jobType:"install", installDate:"", endDate:"", price:2750, deposit:0, rooms:"", notes:"Leston listing", referral:"Leston Eustache", status:"active", createdAt:new Date().toISOString() },
  { id:"4", address:"4009 Finis St, Dallas TX 75212", client:"", agent:"Leston Eustache", phone:"", jobType:"install", installDate:"", endDate:"", price:2750, deposit:0, rooms:"", notes:"Leston listing", referral:"Leston Eustache", status:"active", createdAt:new Date().toISOString() },
  { id:"5", address:"1509 Dennison St, Dallas TX", client:"", agent:"KC", phone:"", jobType:"install", installDate:"", endDate:"", price:2750, deposit:0, rooms:"", notes:"KC listing", referral:"KC", status:"active", createdAt:new Date().toISOString() },
  { id:"6", address:"1507 Dennison St, Dallas TX", client:"", agent:"KC", phone:"", jobType:"install", installDate:"", endDate:"", price:2750, deposit:0, rooms:"", notes:"KC listing", referral:"KC", status:"active", createdAt:new Date().toISOString() },
];

const BLANK: Omit<Job,"id"|"createdAt"> = { address:"", client:"", agent:"", phone:"", jobType:"install", installDate:"", endDate:"", price:2750, deposit:0, rooms:"", notes:"", referral:"", status:"active" };

const S: Record<JobStatus,{color:string;bg:string;label:string}> = {
  active:    {color:"#00d084",bg:"rgba(0,208,132,0.1)",label:"ACTIVE"},
  expiring:  {color:"#f0c040",bg:"rgba(240,192,64,0.1)",label:"EXPIRING"},
  overdue:   {color:"#ff4444",bg:"rgba(255,68,68,0.1)",label:"OVERDUE"},
  pickup:    {color:"#1a6eff",bg:"rgba(26,110,255,0.1)",label:"PICKUP"},
  completed: {color:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)",label:"DONE"},
};

function computeStatus(job: Job): JobStatus {
  if (job.status === "completed" || job.status === "pickup") return job.status;
  if (!job.endDate) return "active";
  const days = Math.ceil((new Date(job.endDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return "overdue";
  if (days <= 14) return "expiring";
  return "active";
}

function daysLeft(endDate: string): number | null {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

const inp: React.CSSProperties = { width:"100%", padding:"10px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", fontFamily:"system-ui", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 };
const lbl: React.CSSProperties = { display:"block", fontFamily:"system-ui", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:4 };
const card: React.CSSProperties = { background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"16px" };

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [view, setView] = useState<"list"|"detail"|"add"|"edit">("list");
  const [sel, setSel] = useState<Job|null>(null);
  const [form, setForm] = useState<any>({...BLANK});
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE);
      setJobs(s ? JSON.parse(s) : SEED);
    } catch { setJobs(SEED); }
    setLoading(false);
  }, []);

  function persist(data: Job[]) {
    setJobs(data);
    try { localStorage.setItem(STORAGE, JSON.stringify(data)); } catch {}
  }

  function addJob() {
    if (!form.address?.trim()) { alert("Address is required"); return; }
    const j: Job = { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() };
    persist([...jobs, j]);
    setForm({...BLANK}); setView("list");
  }

  function saveEdit() {
    if (!sel) return;
    const updated = jobs.map(j => j.id === sel.id ? { ...j, ...form } : j);
    persist(updated);
    setSel({ ...sel, ...form }); setView("detail");
  }

  function deleteJob(id: string) {
    if (!confirm("Delete this job?")) return;
    persist(jobs.filter(j => j.id !== id));
    setView("list"); setSel(null);
  }

  function f(k: string, v: any) { setForm((p:any) => ({ ...p, [k]: v })); }

  const displayed = jobs.map(j => ({...j, status: computeStatus(j)}))
    .filter(j => filter === "all" || j.status === filter || (filter === "unpaid" && j.price - j.deposit > 0));

  const totalActive = jobs.filter(j => computeStatus(j) !== "completed").reduce((a,j) => a+j.price, 0);
  const totalUnpaid = jobs.reduce((a,j) => a + Math.max(0, j.price - j.deposit), 0);
  const urgent = jobs.filter(j => computeStatus(j) === "expiring" || computeStatus(j) === "overdue").length;

  if (loading) return <main style={{minHeight:"100vh",background:"#03060f",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontFamily:"system-ui"}}>Loading...</main>;

  // ── ADD FORM ──
  if (view === "add" || view === "edit") {
    const isEdit = view === "edit";
    return (
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={() => { setView(isEdit?"detail":"list"); setForm({...BLANK}); }} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Cancel</button>
          <span style={{fontSize:14,fontWeight:800,letterSpacing:"0.05em"}}>{isEdit?"EDIT JOB":"NEW STAGING JOB"}</span>
          <button onClick={isEdit ? saveEdit : addJob} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
        </div>
        <div style={{padding:"20px 16px"}}>
          {/* Job type + price */}
          <div style={{...card,marginBottom:12}}>
            <label style={lbl}>JOB TYPE</label>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {(["install","transfer","moving"] as const).map(t => (
                <button key={t} onClick={() => { f("jobType",t); if(t==="install") f("price",2750); if(t==="transfer") f("price",1450); }} style={{flex:1,padding:"10px 6px",borderRadius:10,background:form.jobType===t?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${form.jobType===t?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:form.jobType===t?"#fff":"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:12,fontWeight:700,letterSpacing:"0.05em",textTransform:"capitalize"}}>
                  {t === "install" ? "Install ($2,750)" : t === "transfer" ? "Transfer ($1,450)" : "Moving Job"}
                </button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>TOTAL PRICE</label><input value={form.price} onChange={e=>f("price",parseFloat(e.target.value)||0)} type="number" style={inp}/></div>
              <div><label style={lbl}>DEPOSIT PAID</label><input value={form.deposit} onChange={e=>f("deposit",parseFloat(e.target.value)||0)} type="number" style={inp}/></div>
            </div>
            <div style={{background:"rgba(26,110,255,0.08)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>Balance Due</span>
              <span style={{fontSize:16,fontWeight:900,color:"#1a6eff"}}>${Math.max(0,(form.price||0)-(form.deposit||0)).toLocaleString()}</span>
            </div>
          </div>

          {/* Property + Client */}
          <div style={{...card,marginBottom:12}}>
            <label style={lbl}>PROPERTY ADDRESS *</label>
            <input value={form.address} onChange={e=>f("address",e.target.value)} placeholder="123 Main St, Dallas TX" style={inp}/>
            <label style={lbl}>CLIENT NAME</label>
            <input value={form.client} onChange={e=>f("client",e.target.value)} placeholder="John Smith" style={inp}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>AGENT</label><input value={form.agent} onChange={e=>f("agent",e.target.value)} placeholder="Leston Eustache" style={inp}/></div>
              <div><label style={lbl}>CLIENT PHONE</label><input value={form.phone} onChange={e=>f("phone",e.target.value)} placeholder="(214) 555-0000" style={inp}/></div>
            </div>
            <label style={lbl}>REFERRAL SOURCE</label>
            <input value={form.referral} onChange={e=>f("referral",e.target.value)} placeholder="Who referred this job?" style={inp}/>
          </div>

          {/* Dates */}
          <div style={{...card,marginBottom:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>INSTALL DATE</label><input type="date" value={form.installDate} onChange={e=>f("installDate",e.target.value)} style={inp}/></div>
              <div><label style={lbl}>END DATE (90 days)</label><input type="date" value={form.endDate} onChange={e=>f("endDate",e.target.value)} style={inp}/></div>
            </div>
            <label style={lbl}>STATUS</label>
            <select value={form.status} onChange={e=>f("status",e.target.value)} style={{...inp,marginBottom:0}}>
              <option value="active">Active</option>
              <option value="expiring">Expiring</option>
              <option value="overdue">Overdue</option>
              <option value="pickup">Needs Pickup</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Details */}
          <div style={{...card}}>
            <label style={lbl}>ROOMS STAGED</label>
            <input value={form.rooms} onChange={e=>f("rooms",e.target.value)} placeholder="Living, Dining, Master, Office" style={inp}/>
            <label style={lbl}>NOTES</label>
            <textarea value={form.notes} onChange={e=>f("notes",e.target.value)} placeholder="Any notes about this job..." style={{...inp,height:80,resize:"none"}}/>
          </div>

          {isEdit && (
            <button onClick={()=>deleteJob(sel!.id)} style={{width:"100%",marginTop:14,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🗑 DELETE JOB</button>
          )}
        </div>
      </main>
    );
  }

  // ── JOB DETAIL ──
  if (view === "detail" && sel) {
    const job = {...sel, status: computeStatus(sel)};
    const s = S[job.status];
    const days = daysLeft(job.endDate);
    const balance = Math.max(0, job.price - job.deposit);

    return (
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Jobs</button>
          <button onClick={()=>{setForm({...job});setView("edit");}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>✏️ Edit</button>
        </div>
        <div style={{padding:"20px 16px"}}>
          {/* Status + days */}
          <div style={{background:s.bg,border:`1px solid rgba(255,255,255,0.08)`,borderLeft:`4px solid ${s.color}`,borderRadius:12,padding:"14px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:s.color}}>{s.label}</div>
            <div style={{fontSize:14,fontWeight:700,color:s.color}}>
              {days===null ? "No end date" : days<0 ? `${Math.abs(days)}d OVERDUE` : `${days}d remaining`}
            </div>
          </div>

          {/* Financial summary */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[{l:"PRICE",v:`$${job.price.toLocaleString()}`,c:"#fff"},{l:"DEPOSIT",v:`$${job.deposit.toLocaleString()}`,c:"#00d084"},{l:"BALANCE",v:`$${balance.toLocaleString()}`,c:balance>0?"#f0c040":"#00d084"}].map((s2,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:900,color:s2.c}}>{s2.v}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",marginTop:3}}>{s2.l}</div>
              </div>
            ))}
          </div>

          {/* Info cards */}
          {[
            {l:"ADDRESS",v:job.address},
            {l:"CLIENT",v:job.client||"—"},
            {l:"AGENT",v:job.agent||"—"},
            {l:"PHONE",v:job.phone||"—"},
            {l:"JOB TYPE",v:job.jobType==="transfer"?"Transfer ($1,450)":job.jobType==="moving"?"Moving Job":`Full Install ($2,750)`},
            {l:"INSTALL DATE",v:job.installDate||"Not set"},
            {l:"END DATE",v:job.endDate||"Not set"},
            {l:"ROOMS",v:job.rooms||"—"},
            {l:"REFERRAL SOURCE",v:job.referral||"—"},
            {l:"NOTES",v:job.notes||"—"},
          ].map((item,i)=>(
            <div key={i} style={{...card,marginBottom:8}}>
              <div style={{...lbl,marginBottom:4}}>{item.l}</div>
              <div style={{fontSize:14,color:item.v==="Not set"||item.v==="—"?"rgba(255,255,255,0.25)":"#fff",fontStyle:item.v==="Not set"?"italic":"normal"}}>{item.v}</div>
            </div>
          ))}

          <div style={{marginTop:16,display:"grid",gap:10}}>
            <button onClick={()=>{persist(jobs.map(j=>j.id===job.id?{...j,status:"completed"}:j));setView("list");setSel(null);}} style={{background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.25)",color:"#00d084",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ MARK COMPLETED</button>
            <button onClick={()=>{persist(jobs.map(j=>j.id===job.id?{...j,status:"pickup"}:j));setSel({...job,status:"pickup"});}} style={{background:"rgba(26,110,255,0.08)",border:"1px solid rgba(26,110,255,0.25)",color:"#1a6eff",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>📦 SCHEDULE PICKUP</button>
          </div>
        </div>
      </main>
    );
  }

  // ── JOB LIST ──
  return (
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Link href="/luxury/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
            <div>
              <div style={{fontSize:16,fontWeight:800,letterSpacing:"0.02em"}}>STAGING JOBS</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>
                ${totalActive.toLocaleString()} active · ${totalUnpaid.toLocaleString()} unpaid{urgent>0?` · ${urgent} urgent`:""}
              </div>
            </div>
          </div>
          <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"9px 16px",cursor:"pointer",fontSize:12,fontWeight:700,letterSpacing:"0.05em"}}>+ NEW JOB</button>
        </div>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
          {["all","active","expiring","overdue","pickup","completed","unpaid"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:100,background:filter===f?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${filter===f?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:filter===f?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:"0.1em",cursor:"pointer",whiteSpace:"nowrap",textTransform:"uppercase"}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"14px 16px"}}>
        {displayed.length === 0 && (
          <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.25)",fontSize:14}}>
            No jobs in this view.<br/>
            <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{marginTop:16,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13}}>+ Add your first job</button>
          </div>
        )}
        {displayed.map((job,i)=>{
          const s = S[job.status];
          const days = daysLeft(job.endDate);
          const balance = Math.max(0,job.price-job.deposit);
          return (
            <div key={job.id} onClick={()=>{setSel(job);setView("detail");}} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`3px solid ${s.color}`,borderRadius:14,padding:"16px",marginBottom:10,cursor:"pointer",transition:"background 0.2s"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:2}}>{job.address}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>
                    {job.agent||"No agent"}{job.client?` · ${job.client}`:""}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                  <div style={{fontSize:17,fontWeight:900,color:"#1a6eff"}}>${job.price.toLocaleString()}</div>
                  {balance>0&&<div style={{fontSize:10,color:"#f0c040",fontWeight:700,letterSpacing:"0.08em"}}>${balance.toLocaleString()} DUE</div>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:10,background:s.bg,borderRadius:100,padding:"3px 9px",color:s.color,fontWeight:700,letterSpacing:"0.08em"}}>{s.label}</span>
                {days!==null&&<span style={{fontSize:10,background:"rgba(255,255,255,0.04)",borderRadius:100,padding:"3px 9px",color:days<0?"#ff4444":days<=14?"#f0c040":"rgba(255,255,255,0.4)"}}>{days<0?`${Math.abs(days)}d overdue`:`${days}d left`}</span>}
                <span style={{fontSize:10,background:"rgba(255,255,255,0.04)",borderRadius:100,padding:"3px 9px",color:"rgba(255,255,255,0.3)",textTransform:"capitalize"}}>{job.jobType}</span>
                {!job.installDate&&<span style={{fontSize:10,background:"rgba(255,68,68,0.08)",borderRadius:100,padding:"3px 9px",color:"rgba(255,100,100,0.7)"}}>No date set</span>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

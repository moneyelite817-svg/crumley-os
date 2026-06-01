"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

type MoveStatus = "estimate"|"scheduled"|"in_progress"|"completed"|"cancelled";
type PayStatus = "unpaid"|"deposit"|"paid";

interface MoveJob {
  id: string;
  clientName: string;
  clientPhone: string;
  referralSource: string;
  pickupAddress: string;
  dropoffAddress: string;
  moveDate: string;
  moveTime: string;
  estimatedHours: number;
  crewNeeded: number;
  trucksNeeded: number;
  specialItems: string;
  totalPrice: number;
  deposit: number;
  payStatus: PayStatus;
  status: MoveStatus;
  notes: string;
  createdAt: string;
}

const STORAGE = "cros_moving_jobs_v1";
const BLANK: Omit<MoveJob,"id"|"createdAt"> = {
  clientName:"", clientPhone:"", referralSource:"Leston Eustache",
  pickupAddress:"", dropoffAddress:"", moveDate:"", moveTime:"8:00 AM",
  estimatedHours:4, crewNeeded:2, trucksNeeded:1, specialItems:"",
  totalPrice:800, deposit:0, payStatus:"unpaid", status:"estimate", notes:""
};

const STATUS_S: Record<MoveStatus,{color:string;bg:string;label:string}> = {
  estimate:    {color:"#f0c040",bg:"rgba(240,192,64,0.1)",label:"ESTIMATE"},
  scheduled:   {color:"#1a6eff",bg:"rgba(26,110,255,0.1)",label:"SCHEDULED"},
  in_progress: {color:"#00d084",bg:"rgba(0,208,132,0.1)",label:"IN PROGRESS"},
  completed:   {color:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)",label:"DONE"},
  cancelled:   {color:"rgba(255,68,68,0.5)",bg:"rgba(255,68,68,0.06)",label:"CANCELLED"},
};

const inp: React.CSSProperties = { width:"100%", padding:"10px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", fontFamily:"system-ui", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 };
const lbl: React.CSSProperties = { display:"block", fontFamily:"system-ui", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:4 };
const card: React.CSSProperties = { background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"16px", marginBottom:12 };

export default function MovingPage() {
  const [jobs, setJobs] = useState<MoveJob[]>([]);
  const [view, setView] = useState<"list"|"detail"|"add"|"edit">("list");
  const [sel, setSel] = useState<MoveJob|null>(null);
  const [form, setForm] = useState<any>({...BLANK});
  const [filter, setFilter] = useState("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(()=>{
    try { const s=localStorage.getItem(STORAGE); setJobs(s?JSON.parse(s):[]); } catch { setJobs([]); }
    setLoaded(true);
  },[]);

  function persist(data: MoveJob[]) {
    setJobs(data);
    try { localStorage.setItem(STORAGE, JSON.stringify(data)); } catch {}
  }

  function f(k:string,v:any) { setForm((p:any)=>({...p,[k]:v})); }

  // Auto-calculate price
  function calcPrice(hours: number, crew: number, trucks: number): number {
    return Math.round((hours * crew * 45) + (trucks * 150));
  }

  function addJob() {
    if (!form.pickupAddress?.trim()) { alert("Pickup address required"); return; }
    persist([...jobs, {...form, id:Date.now().toString(), createdAt:new Date().toISOString()}]);
    setForm({...BLANK}); setView("list");
  }

  function saveEdit() {
    if (!sel) return;
    const updated = jobs.map(j=>j.id===sel.id?{...j,...form}:j);
    persist(updated); setSel({...sel,...form}); setView("detail");
  }

  const displayed = jobs.filter(j=>filter==="all"||j.status===filter||(filter==="unpaid"&&j.payStatus!=="paid"));
  const totalRevenue = jobs.filter(j=>j.status!=="cancelled").reduce((a,j)=>a+j.totalPrice,0);
  const totalUnpaid = jobs.filter(j=>j.payStatus!=="paid"&&j.status!=="cancelled").reduce((a,j)=>a+Math.max(0,j.totalPrice-j.deposit),0);

  if (!loaded) return <main style={{minHeight:"100vh",background:"#03060f",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontFamily:"system-ui"}}>Loading...</main>;

  // ── ADD / EDIT FORM ──
  if (view==="add"||view==="edit") {
    const isEdit = view==="edit";
    const estPrice = calcPrice(form.estimatedHours||4, form.crewNeeded||2, form.trucksNeeded||1);
    const balance = Math.max(0,(form.totalPrice||estPrice)-(form.deposit||0));
    return (
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView(isEdit?"detail":"list");setForm({...BLANK});}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Cancel</button>
          <span style={{fontSize:14,fontWeight:800}}>{isEdit?"EDIT MOVE":"NEW MOVING JOB"}</span>
          <button onClick={isEdit?saveEdit:addJob} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
        </div>
        <div style={{padding:"20px 16px"}}>
          {/* Price preview */}
          <div style={{...card,background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.2)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#1a6eff"}}>${(form.totalPrice||estPrice).toLocaleString()}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em"}}>TOTAL</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#00d084"}}>${(form.deposit||0).toLocaleString()}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em"}}>DEPOSIT</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:balance>0?"#f0c040":"#00d084"}}>${balance.toLocaleString()}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em"}}>BALANCE</div></div>
            </div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>Est: {form.estimatedHours}hr × {form.crewNeeded} crew × $45 + {form.trucksNeeded} truck(s)</div>
          </div>

          {/* Client info */}
          <div style={card}>
            <label style={lbl}>CLIENT NAME</label><input value={form.clientName} onChange={e=>f("clientName",e.target.value)} style={inp}/>
            <label style={lbl}>CLIENT PHONE</label><input value={form.clientPhone} onChange={e=>f("clientPhone",e.target.value)} style={inp}/>
            <label style={lbl}>REFERRAL SOURCE</label><input value={form.referralSource} onChange={e=>f("referralSource",e.target.value)} placeholder="Leston Eustache, self, etc." style={inp}/>
          </div>

          {/* Addresses */}
          <div style={card}>
            <label style={lbl}>PICKUP ADDRESS *</label><input value={form.pickupAddress} onChange={e=>f("pickupAddress",e.target.value)} style={inp}/>
            <label style={lbl}>DROPOFF ADDRESS *</label><input value={form.dropoffAddress} onChange={e=>f("dropoffAddress",e.target.value)} style={inp}/>
          </div>

          {/* Schedule */}
          <div style={card}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>MOVE DATE</label><input type="date" value={form.moveDate} onChange={e=>f("moveDate",e.target.value)} style={inp}/></div>
              <div><label style={lbl}>START TIME</label><input value={form.moveTime} onChange={e=>f("moveTime",e.target.value)} placeholder="8:00 AM" style={inp}/></div>
            </div>
          </div>

          {/* Crew + equipment */}
          <div style={card}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <div><label style={lbl}>EST HOURS</label><input type="number" value={form.estimatedHours} onChange={e=>{const v=parseInt(e.target.value)||4;f("estimatedHours",v);f("totalPrice",calcPrice(v,form.crewNeeded||2,form.trucksNeeded||1));}} style={inp}/></div>
              <div><label style={lbl}>CREW NEEDED</label><input type="number" value={form.crewNeeded} onChange={e=>{const v=parseInt(e.target.value)||2;f("crewNeeded",v);f("totalPrice",calcPrice(form.estimatedHours||4,v,form.trucksNeeded||1));}} style={inp}/></div>
              <div><label style={lbl}>TRUCKS</label><input type="number" value={form.trucksNeeded} onChange={e=>{const v=parseInt(e.target.value)||1;f("trucksNeeded",v);f("totalPrice",calcPrice(form.estimatedHours||4,form.crewNeeded||2,v));}} style={inp}/></div>
            </div>
            <label style={lbl}>SPECIAL ITEMS / NOTES</label>
            <textarea value={form.specialItems} onChange={e=>f("specialItems",e.target.value)} placeholder="Piano, safe, fragile items, stairs, etc." style={{...inp,height:70,resize:"none"}}/>
          </div>

          {/* Payment */}
          <div style={card}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>TOTAL PRICE</label><input type="number" value={form.totalPrice||estPrice} onChange={e=>f("totalPrice",parseFloat(e.target.value)||0)} style={inp}/></div>
              <div><label style={lbl}>DEPOSIT PAID</label><input type="number" value={form.deposit} onChange={e=>f("deposit",parseFloat(e.target.value)||0)} style={inp}/></div>
            </div>
            <label style={lbl}>PAYMENT STATUS</label>
            <select value={form.payStatus} onChange={e=>f("payStatus",e.target.value)} style={{...inp}}>
              <option value="unpaid">Unpaid</option>
              <option value="deposit">Deposit Paid</option>
              <option value="paid">Fully Paid</option>
            </select>
            <label style={lbl}>JOB STATUS</label>
            <select value={form.status} onChange={e=>f("status",e.target.value)} style={{...inp,marginBottom:0}}>
              {(["estimate","scheduled","in_progress","completed","cancelled"] as const).map(s=><option key={s} value={s}>{STATUS_S[s].label}</option>)}
            </select>
          </div>

          <div style={card}><label style={lbl}>NOTES</label><textarea value={form.notes} onChange={e=>f("notes",e.target.value)} style={{...inp,height:80,resize:"none",marginBottom:0}}/></div>
        </div>
      </main>
    );
  }

  // ── DETAIL ──
  if (view==="detail"&&sel) {
    const s = STATUS_S[sel.status];
    const balance = Math.max(0,sel.totalPrice-sel.deposit);
    const profit = Math.round(sel.totalPrice - (sel.crewNeeded*sel.estimatedHours*25) - (sel.trucksNeeded*100));
    return (
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Moving</button>
          <button onClick={()=>{setForm({...sel});setView("edit");}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>✏️ Edit</button>
        </div>
        <div style={{padding:"20px 16px"}}>
          <div style={{background:s.bg,borderLeft:`4px solid ${s.color}`,border:`1px solid rgba(255,255,255,0.06)`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:s.color}}>{s.label}</span>
            {sel.moveDate&&<span style={{fontSize:13,color:"rgba(255,255,255,0.6)"}}>{sel.moveDate} {sel.moveTime}</span>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[{l:"PRICE",v:`$${sel.totalPrice.toLocaleString()}`,c:"#1a6eff"},{l:"BALANCE",v:`$${balance.toLocaleString()}`,c:balance>0?"#f0c040":"#00d084"},{l:"EST PROFIT",v:`$${profit.toLocaleString()}`,c:"#00d084"}].map((s2,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 8px",textAlign:"center"}}>
                <div style={{fontSize:17,fontWeight:900,color:s2.c}}>{s2.v}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginTop:2}}>{s2.l}</div>
              </div>
            ))}
          </div>
          {[
            {l:"CLIENT",v:sel.clientName||"—"},{l:"PHONE",v:sel.clientPhone||"—"},{l:"REFERRAL",v:sel.referralSource||"—"},
            {l:"PICKUP",v:sel.pickupAddress||"—"},{l:"DROPOFF",v:sel.dropoffAddress||"—"},
            {l:"CREW",v:`${sel.crewNeeded} crew · ${sel.trucksNeeded} truck(s) · ${sel.estimatedHours}hrs`},
            {l:"SPECIAL ITEMS",v:sel.specialItems||"—"},{l:"PAYMENT",v:sel.payStatus.replace("_"," ").toUpperCase()},
            {l:"NOTES",v:sel.notes||"—"},
          ].map((item,i)=>(
            <div key={i} style={{...card,marginBottom:8}}>
              <div style={{...lbl,marginBottom:4}}>{item.l}</div>
              <div style={{fontSize:14,color:item.v==="—"?"rgba(255,255,255,0.25)":"#fff"}}>{item.v}</div>
            </div>
          ))}
          <button onClick={()=>{if(!confirm("Delete?"))return;persist(jobs.filter(j=>j.id!==sel.id));setView("list");setSel(null);}} style={{width:"100%",marginTop:8,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🗑 DELETE</button>
        </div>
      </main>
    );
  }

  // ── LIST ──
  return (
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Link href="/luxury/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
            <div>
              <div style={{fontSize:16,fontWeight:800,letterSpacing:"0.02em"}}>MOVING OPERATIONS</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>
                ${totalRevenue.toLocaleString()} total · ${totalUnpaid.toLocaleString()} unpaid
              </div>
            </div>
          </div>
          <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"9px 16px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ NEW MOVE</button>
        </div>
        <div style={{display:"flex",gap:8,overflowX:"auto"}}>
          {["all","estimate","scheduled","in_progress","completed","unpaid"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:100,background:filter===f?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${filter===f?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:filter===f?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:"0.08em",cursor:"pointer",whiteSpace:"nowrap",textTransform:"uppercase"}}>
              {f.replace("_"," ")}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {displayed.length===0&&(
          <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.25)",fontSize:14,lineHeight:1.8}}>
            No moving jobs yet.<br/>
            Tap + NEW MOVE to create your first estimate.<br/>
            <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{marginTop:16,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13}}>+ Create First Move</button>
          </div>
        )}
        {displayed.map((job,i)=>{
          const s = STATUS_S[job.status];
          const balance = Math.max(0,job.totalPrice-job.deposit);
          return (
            <div key={job.id} onClick={()=>{setSel(job);setView("detail");}} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`3px solid ${s.color}`,borderRadius:14,padding:"16px",marginBottom:10,cursor:"pointer",transition:"background 0.2s"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{job.clientName||"No client name"}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{job.pickupAddress||"No address"} → {job.dropoffAddress||"?"}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                  <div style={{fontSize:17,fontWeight:900,color:"#1a6eff"}}>${job.totalPrice.toLocaleString()}</div>
                  {balance>0&&<div style={{fontSize:10,color:"#f0c040",fontWeight:700}}>${balance.toLocaleString()} DUE</div>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:10,background:s.bg,borderRadius:100,padding:"3px 9px",color:s.color,fontWeight:700}}>{s.label}</span>
                {job.moveDate&&<span style={{fontSize:10,background:"rgba(255,255,255,0.04)",borderRadius:100,padding:"3px 9px",color:"rgba(255,255,255,0.4)"}}>{job.moveDate}</span>}
                <span style={{fontSize:10,background:"rgba(255,255,255,0.04)",borderRadius:100,padding:"3px 9px",color:"rgba(255,255,255,0.3)"}}>{job.crewNeeded} crew · {job.trucksNeeded} truck</span>
                {job.referralSource&&<span style={{fontSize:10,background:"rgba(26,110,255,0.06)",borderRadius:100,padding:"3px 9px",color:"rgba(26,110,255,0.8)"}}>{job.referralSource}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

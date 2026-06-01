"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
export default function Page() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [moves, setMoves] = useState<any[]>([]);
  useEffect(() => {
    try { setJobs(JSON.parse(localStorage.getItem("cros_luxury_jobs_v3")||"[]")); } catch {}
    try { setInvoices(JSON.parse(localStorage.getItem("cros_invoices_v1")||"[]")); } catch {}
    try { setMoves(JSON.parse(localStorage.getItem("cros_moving_jobs_v1")||"[]")); } catch {}
  }, []);
  const activeJobs = jobs.filter((j:any) => j.status !== "completed");
  const stagingRevenue = activeJobs.reduce((a:number,j:any) => a+(j.price||j.value||0), 0);
  const movingRevenue = moves.filter((m:any)=>m.status!=="cancelled").reduce((a:number,m:any)=>a+(m.totalPrice||0),0);
  const totalRevenue = stagingRevenue + movingRevenue;
  const unpaidInvoices = invoices.filter((i:any)=>i.status!=="paid").reduce((a:number,i:any)=>a+Math.max(0,(i.amount||0)-(i.amountPaid||0)),0);
  const collectedInvoices = invoices.filter((i:any)=>i.status==="paid").reduce((a:number,i:any)=>a+(i.amount||0),0);
  const stats = [
    {l:"ACTIVE STAGING",v:`$${stagingRevenue.toLocaleString()}`,s:`${activeJobs.length} properties`,c:"#1a6eff"},
    {l:"MOVING PIPELINE",v:`$${movingRevenue.toLocaleString()}`,s:`${moves.filter((m:any)=>m.status!=="cancelled").length} jobs`,c:"#4a8fff"},
    {l:"TOTAL ACTIVE",v:`$${totalRevenue.toLocaleString()}`,s:"combined pipeline",c:"#00d084"},
    {l:"UNPAID BALANCE",v:`$${unpaidInvoices.toLocaleString()}`,s:"collect now",c:unpaidInvoices>0?"#f0c040":"#00d084"},
    {l:"COLLECTED",v:`$${collectedInvoices.toLocaleString()}`,s:"from invoices",c:"#00d084"},
    {l:"TOTAL JOBS",v:`${jobs.length + moves.length}`,s:"staging + moving",c:"rgba(255,255,255,0.6)"},
  ];
  const targets = [
    {l:"Current monthly (8 staging jobs)",v:`$${Math.round(stagingRevenue*0.33).toLocaleString()}`,c:"rgba(255,255,255,0.4)"},
    {l:"Target — 12 active staging jobs",v:"$10,000+/mo",c:"#1a6eff"},
    {l:"Target — 20 active jobs",v:"$18,000+/mo",c:"#4a8fff"},
    {l:"With moving business (Leston)",v:"$25,000+/mo",c:"#00d084"},
  ];
  return (
    <main style={{ minHeight:"100vh", background:"#03060f", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(3,6,15,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", gap:12 }}>
        <Link href="/luxury/dashboard" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"none", fontSize:20 }}>←</Link>
        <div><div style={{ fontSize:16, fontWeight:800 }}>REVENUE</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>All In One Luxury Designs</div></div>
      </div>
      <div style={{ padding:"16px" }}>
        <div style={{ background:"linear-gradient(135deg,#0a1020,#03060f)", border:"2px solid #1a6eff", borderRadius:16, padding:"22px", textAlign:"center", marginBottom:16 }}>
          <div style={{ fontSize:11, letterSpacing:"0.15em", color:"rgba(255,255,255,0.3)", marginBottom:8 }}>TOTAL ACTIVE INVENTORY VALUE</div>
          <div style={{ fontSize:52, fontWeight:900, color:"#1a6eff" }}>${totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:4 }}>staging + moving · live pipeline</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {stats.map((s,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${s.c}33`, borderRadius:14, padding:"16px" }}>
              <div style={{ fontSize:22, fontWeight:900, color:s.c, marginBottom:4 }}>{s.v}</div>
              <div style={{ fontSize:9, letterSpacing:"0.12em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:2 }}>{s.l}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>{s.s}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"16px", marginBottom:16 }}>
          <div style={{ fontSize:11, letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)", fontWeight:700, textTransform:"uppercase", marginBottom:14 }}>📈 GROWTH TARGETS</div>
          {targets.map((t,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none" }}>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>{t.l}</div>
              <div style={{ fontSize:15, fontWeight:900, color:t.c }}>{t.v}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"16px" }}>
          <div style={{ fontSize:11, letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)", fontWeight:700, textTransform:"uppercase", marginBottom:14 }}>💰 PRICING STRUCTURE</div>
          {[{l:"Full Turnkey Install",v:"$2,750",s:"90 days · design, furnish, accessorize"},{l:"Transfer to New Listing",v:"$1,450",s:"90 days · fill open inventory"},{l:"Moving Job (est.)",v:"$600–$2,000",s:"based on crew, hours, distance"},{l:"90-Day Extension",v:"Negotiate",s:"easy money — furniture stays"},{l:"Early Removal Incentive",v:"Discount",s:"move to next listing before storage"}].map((item,i)=>(
            <div key={i} style={{ padding:"10px 0", borderBottom:i<4?"1px solid rgba(255,255,255,0.04)":"none" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{item.l}</div>
                <div style={{ fontSize:16, fontWeight:900, color:"#1a6eff" }}>{item.v}</div>
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{item.s}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

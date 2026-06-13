"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const STORAGE  = "cros_inventory_v1";
const JOBS_KEY = "cros_luxury_jobs_v3";

interface InventoryItem {
  id:string; name:string; category:string; quantity:number;
  condition:"new"|"good"|"fair"|"damaged"|"missing"|"sold";
  purchasePrice:number; currentValue:number; purchaseDate:string;
  vendor:string; currentLocation:string; assignedJob:string;
  photoUrl:string; damageNotes:string; repairNeeded:boolean;
  soldDisposed:boolean; notes:string; createdAt:string;
}

const CATEGORIES=[
  {id:"sofa",label:"Sofas",icon:"🛋"},{id:"bed",label:"Beds & Bedding",icon:"🛏"},
  {id:"table",label:"Tables",icon:"🪑"},{id:"chair",label:"Chairs",icon:"🪑"},
  {id:"rug",label:"Rugs",icon:"🟫"},{id:"artwork",label:"Artwork & Mirrors",icon:"🖼"},
  {id:"lamp",label:"Lamps & Lighting",icon:"💡"},{id:"decor",label:"Décor & Accessories",icon:"🏺"},
  {id:"staging",label:"Staging Kits",icon:"📦"},{id:"moving",label:"Moving Equipment",icon:"🚛"},
  {id:"other",label:"Other",icon:"📋"},
];
const CONDITIONS=[
  {id:"new",label:"NEW",color:"#00d084",bg:"rgba(0,208,132,0.12)"},
  {id:"good",label:"GOOD",color:"#1a6eff",bg:"rgba(26,110,255,0.12)"},
  {id:"fair",label:"FAIR",color:"#f0c040",bg:"rgba(240,192,64,0.12)"},
  {id:"damaged",label:"DAMAGED",color:"#ff4444",bg:"rgba(255,68,68,0.12)"},
  {id:"missing",label:"MISSING",color:"#ff4444",bg:"rgba(255,68,68,0.08)"},
  {id:"sold",label:"SOLD",color:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)"},
];

const inp:any={width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:8};
const lbl:any={display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:3};
const BLANK:Omit<InventoryItem,"id"|"createdAt">={name:"",category:"sofa",quantity:1,condition:"good",purchasePrice:0,currentValue:0,purchaseDate:"",vendor:"",currentLocation:"Storage",assignedJob:"",photoUrl:"",damageNotes:"",repairNeeded:false,soldDisposed:false,notes:""};

// ── PHOTO UPLOAD COMPONENT ─────────────────────────
function PhotoUploadButton({photoUrl,onUpload,onRemove}:{photoUrl:string;onUpload:(url:string)=>void;onRemove:()=>void;}){
  const fileRef=useRef<HTMLInputElement>(null);
  const [loading,setLoading]=useState(false);

  async function handleFile(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return;
    setLoading(true);
    const reader=new FileReader();
    reader.onload=()=>{onUpload(reader.result as string);setLoading(false);};
    reader.readAsDataURL(file);
    if(fileRef.current)fileRef.current.value="";
  }

  if(photoUrl) return(
    <div style={{marginBottom:10}}>
      <img src={photoUrl} alt="" style={{width:"100%",height:160,objectFit:"cover",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)"}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:6}}>
        <button onClick={()=>fileRef.current?.click()} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",borderRadius:8,padding:"7px",cursor:"pointer",fontSize:11}}>🔄 Replace</button>
        <button onClick={onRemove} style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:8,padding:"7px",cursor:"pointer",fontSize:11}}>🗑 Remove</button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:"none"}}/>
    </div>
  );

  return(
    <div style={{marginBottom:10}}>
      <button onClick={()=>fileRef.current?.click()} disabled={loading} style={{width:"100%",background:"rgba(255,255,255,0.03)",border:"2px dashed rgba(255,255,255,0.12)",borderRadius:10,padding:"20px",cursor:"pointer",textAlign:"center" as const,color:"rgba(255,255,255,0.4)",fontSize:13}}>
        {loading?"Uploading…":"📷 Add Item Photo"}
      </button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:"none"}}/>
    </div>
  );
}

export default function InventoryPage(){
  const [items,setItems]=useState<InventoryItem[]>([]);
  const [jobs,setJobs]=useState<any[]>([]);
  const [view,setView]=useState<"dashboard"|"list"|"add"|"detail"|"edit">("dashboard");
  const [sel,setSel]=useState<InventoryItem|null>(null);
  const [form,setForm]=useState<any>({...BLANK});
  const [catFilter,setCatFilter]=useState("all");
  const [condFilter,setCondFilter]=useState("all");
  const [search,setSearch]=useState("");

  useEffect(()=>{
    try{const s=localStorage.getItem(STORAGE);if(s)setItems(JSON.parse(s));}catch{}
    try{const s=localStorage.getItem(JOBS_KEY);if(s)setJobs(JSON.parse(s));}catch{}
  },[]);

  function persist(data:InventoryItem[]){setItems(data);try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch{}}
  function f(k:string,v:any){setForm((p:any)=>({...p,[k]:v}));}

  function save(){
    if(!form.name?.trim()){alert("Item name required");return;}
    if(view==="edit"&&sel){persist(items.map(i=>i.id===sel.id?{...i,...form}:i));setSel({...sel,...form});setView("detail");}
    else{persist([...items,{...form,id:`inv-${Date.now()}`,createdAt:new Date().toISOString()}]);setForm({...BLANK});setView("list");}
  }

  function quickAction(id:string,action:string){
    const upd:Record<string,Partial<InventoryItem>>={damaged:{condition:"damaged"},missing:{condition:"missing"},repaired:{condition:"good",repairNeeded:false,damageNotes:""},sold:{condition:"sold",soldDisposed:true}};
    persist(items.map(i=>i.id===id?{...i,...upd[action]}:i));
    if(sel?.id===id)setSel(p=>p?{...p,...upd[action]}:p);
  }

  const activeItems=items.filter(i=>!i.soldDisposed);
  const totalValue=activeItems.reduce((a,i)=>a+((i.currentValue||i.purchasePrice||0)*i.quantity),0);
  const damaged=activeItems.filter(i=>i.condition==="damaged").length;
  const missing=activeItems.filter(i=>i.condition==="missing").length;

  const shown=items.filter(i=>{
    if(catFilter!=="all"&&i.category!==catFilter)return false;
    if(condFilter!=="all"&&i.condition!==condFilter)return false;
    if(search&&!i.name.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });

  // ── ADD / EDIT ──
  if(view==="add"||view==="edit") return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>{setView(view==="edit"?"detail":"list");setForm({...BLANK});}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Cancel</button>
        <span style={{fontSize:14,fontWeight:800}}>{view==="edit"?"EDIT ITEM":"ADD ITEM"}</span>
        <button onClick={save} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
      </div>
      <div style={{padding:"20px 16px"}}>
        {/* Photo */}
        <PhotoUploadButton photoUrl={form.photoUrl||""} onUpload={url=>f("photoUrl",url)} onRemove={()=>f("photoUrl","")}/>

        <label style={lbl}>ITEM NAME *</label><input value={form.name} onChange={e=>f("name",e.target.value)} placeholder="e.g. Gray Sectional Sofa" style={inp}/>

        <label style={lbl}>CATEGORY</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
          {CATEGORIES.map(cat=>(
            <div key={cat.id} onClick={()=>f("category",cat.id)} style={{background:form.category===cat.id?"rgba(26,110,255,0.2)":"rgba(255,255,255,0.03)",border:`1px solid ${form.category===cat.id?"rgba(26,110,255,0.4)":"rgba(255,255,255,0.06)"}`,borderRadius:10,padding:"8px",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:18}}>{cat.icon}</div>
              <div style={{fontSize:9,color:form.category===cat.id?"#1a6eff":"rgba(255,255,255,0.5)",marginTop:3,fontWeight:form.category===cat.id?700:400}}>{cat.label}</div>
            </div>
          ))}
        </div>

        <label style={lbl}>CONDITION</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap" as const,marginBottom:10}}>
          {CONDITIONS.map(c=>(
            <button key={c.id} onClick={()=>f("condition",c.id)} style={{padding:"6px 13px",borderRadius:100,background:form.condition===c.id?c.bg:"rgba(255,255,255,0.04)",border:`1px solid ${form.condition===c.id?c.color:"rgba(255,255,255,0.08)"}`,color:form.condition===c.id?c.color:"rgba(255,255,255,0.4)",fontSize:11,fontWeight:700,cursor:"pointer"}}>{c.label}</button>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={lbl}>QUANTITY</label><input type="number" value={form.quantity} onChange={e=>f("quantity",parseInt(e.target.value)||1)} style={inp}/></div>
          <div><label style={lbl}>PURCHASE $ </label><input type="number" value={form.purchasePrice} onChange={e=>f("purchasePrice",parseFloat(e.target.value)||0)} style={inp}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={lbl}>CURRENT VALUE $</label><input type="number" value={form.currentValue} onChange={e=>f("currentValue",parseFloat(e.target.value)||0)} style={inp}/></div>
          <div><label style={lbl}>PURCHASE DATE</label><input type="date" value={form.purchaseDate} onChange={e=>f("purchaseDate",e.target.value)} style={inp}/></div>
        </div>
        {[{l:"VENDOR",k:"vendor",p:"Where purchased"},{l:"LOCATION",k:"currentLocation",p:"Storage, 3031 Valentine…"},{l:"NOTES",k:"notes",p:"Additional notes"}].map(field=>(
          <div key={field.k}><label style={lbl}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} placeholder={field.p} style={inp}/></div>
        ))}
        <label style={lbl}>ASSIGN TO JOB</label>
        <select value={form.assignedJob} onChange={e=>f("assignedJob",e.target.value)} style={{...inp}}>
          <option value="">Unassigned (In Storage)</option>
          {jobs.filter(j=>j.status!=="completed").map(j=><option key={j.id} value={j.id}>{j.address?.split(",")[0]}</option>)}
        </select>
        {form.condition==="damaged"&&(
          <div>
            <label style={lbl}>DAMAGE NOTES</label>
            <textarea value={form.damageNotes} onChange={e=>f("damageNotes",e.target.value)} placeholder="Describe damage…" style={{...inp,height:55,resize:"none" as const}}/>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div onClick={()=>f("repairNeeded",!form.repairNeeded)} style={{width:20,height:20,borderRadius:4,background:form.repairNeeded?"#f0c040":"rgba(255,255,255,0.1)",border:`1px solid ${form.repairNeeded?"#f0c040":"rgba(255,255,255,0.2)"}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {form.repairNeeded&&<span style={{color:"#000",fontSize:12}}>✓</span>}
              </div>
              <span style={{fontSize:13,color:"rgba(255,255,255,0.6)"}}>Repair needed</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );

  // ── DETAIL ──
  if(view==="detail"&&sel){
    const cond=CONDITIONS.find(c=>c.id===sel.condition)||CONDITIONS[1];
    const cat=CATEGORIES.find(c=>c.id===sel.category)||CATEGORIES[0];
    const assignedJobName=sel.assignedJob?jobs.find(j=>j.id===sel.assignedJob)?.address?.split(",")[0]:"In Storage";
    return(
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:60,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Inventory</button>
          <button onClick={()=>{setForm({...sel});setView("edit");}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>✏️ Edit</button>
        </div>
        <div style={{padding:"20px 16px"}}>
          {/* Item photo */}
          {sel.photoUrl&&(
            <img src={sel.photoUrl} alt={sel.name} style={{width:"100%",height:200,objectFit:"cover",borderRadius:14,border:"1px solid rgba(255,255,255,0.08)",marginBottom:14}}/>
          )}
          <div style={{background:cond.bg,borderLeft:`4px solid ${cond.color}`,border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"16px",marginBottom:14}}>
            <div style={{fontSize:28,marginBottom:8}}>{cat.icon}</div>
            <div style={{fontSize:22,fontWeight:900,marginBottom:4}}>{sel.name}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{cat.label} · Qty: {sel.quantity}</div>
            <div style={{display:"flex",gap:6,marginTop:10}}>
              <span style={{fontSize:11,padding:"3px 10px",background:cond.bg,color:cond.color,borderRadius:100,fontWeight:700}}>{cond.label}</span>
              {sel.assignedJob&&<span style={{fontSize:11,padding:"3px 10px",background:"rgba(26,110,255,0.12)",color:"#1a6eff",borderRadius:100,fontWeight:700}}>📍 {assignedJobName}</span>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[{l:"PURCHASE",v:`$${(sel.purchasePrice||0).toLocaleString()}`},{l:"VALUE",v:`$${(sel.currentValue||sel.purchasePrice||0).toLocaleString()}`,bold:true},{l:"QTY",v:sel.quantity}].map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px",textAlign:"center"}}>
                <div style={{fontSize:17,fontWeight:900,color:i===1?"#1a6eff":"#fff"}}>{s.v}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
          {sel.damageNotes&&(
            <div style={{background:"rgba(255,68,68,0.06)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:12,padding:"14px",marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:"rgba(255,68,68,0.7)",marginBottom:4}}>DAMAGE NOTES</div>
              <div style={{fontSize:13,color:"#ff8888"}}>{sel.damageNotes}</div>
              {sel.repairNeeded&&<div style={{fontSize:11,color:"#f0c040",marginTop:6,fontWeight:700}}>⚠️ Repair needed</div>}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:6}}>
            {sel.condition!=="damaged"&&<button onClick={()=>quickAction(sel.id,"damaged")} style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:700}}>⚠️ Mark Damaged</button>}
            {sel.condition!=="missing"&&<button onClick={()=>quickAction(sel.id,"missing")} style={{background:"rgba(255,68,68,0.06)",border:"1px solid rgba(255,68,68,0.15)",color:"#ff8888",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:700}}>❓ Mark Missing</button>}
            {sel.condition==="damaged"&&<button onClick={()=>quickAction(sel.id,"repaired")} style={{background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.25)",color:"#00d084",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ Mark Repaired</button>}
            <button onClick={()=>quickAction(sel.id,"sold")} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:700}}>📤 Mark Sold</button>
          </div>
          <button onClick={()=>{if(!confirm("Delete item?"))return;persist(items.filter(i=>i.id!==sel.id));setView("list");setSel(null);}} style={{width:"100%",marginTop:10,background:"rgba(255,68,68,0.06)",border:"1px solid rgba(255,68,68,0.15)",color:"#ff6b6b",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:700}}>🗑 Delete</button>
        </div>
      </main>
    );
  }

  // ── DASHBOARD ──
  if(view==="dashboard") return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Link href="/luxury/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
          <div><div style={{fontSize:16,fontWeight:800}}>INVENTORY</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{activeItems.length} active items</div></div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setView("list")} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:12}}>All Items</button>
          <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ ADD</button>
        </div>
      </div>
      <div style={{padding:"16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[{l:"TOTAL VALUE",v:`$${totalValue.toLocaleString()}`,s:`${activeItems.length} items`,c:"#1a6eff"},{l:"DAMAGED / MISSING",v:damaged+missing,s:`${damaged} damaged · ${missing} missing`,c:damaged+missing>0?"#ff4444":"#00d084"}].map((s,i)=>(
            <div key={i} style={{background:`${s.c}12`,border:`1px solid ${s.c}33`,borderRadius:14,padding:"16px"}}>
              <div style={{fontSize:22,fontWeight:900,color:s.c,marginBottom:4}}>{s.v}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",marginBottom:2}}>{s.l}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{s.s}</div>
            </div>
          ))}
        </div>
        {/* Category grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          {CATEGORIES.map(cat=>{
            const catItems=activeItems.filter(i=>i.category===cat.id);
            if(!catItems.length)return null;
            const catValue=catItems.reduce((a,i)=>a+((i.currentValue||i.purchasePrice||0)*i.quantity),0);
            return(
              <div key={cat.id} onClick={()=>{setCatFilter(cat.id);setView("list");}} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:20,marginBottom:4}}>{cat.icon}</div>
                <div style={{fontSize:16,fontWeight:900,color:"#1a6eff"}}>{catItems.reduce((a,i)=>a+i.quantity,0)}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:1}}>{cat.label}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:1}}>${catValue.toLocaleString()}</div>
              </div>
            );
          }).filter(Boolean)}
        </div>
        {/* Alerts */}
        {(damaged>0||missing>0)&&(
          <div style={{background:"rgba(255,68,68,0.06)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:14,padding:"14px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#ff4444",letterSpacing:"0.1em",marginBottom:10}}>⚠️ NEEDS ATTENTION</div>
            {items.filter(i=>i.condition==="damaged"||i.condition==="missing").slice(0,5).map(i=>{
              const cond=CONDITIONS.find(c=>c.id===i.condition)!;
              return(
                <div key={i.id} onClick={()=>{setSel(i);setView("detail");}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,68,68,0.08)",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {i.photoUrl&&<img src={i.photoUrl} alt="" style={{width:36,height:36,objectFit:"cover",borderRadius:6}}/>}
                    <div><div style={{fontSize:13,fontWeight:700}}>{i.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{i.currentLocation||"Storage"}</div></div>
                  </div>
                  <span style={{fontSize:9,padding:"2px 7px",background:cond.bg,color:cond.color,borderRadius:4,fontWeight:700}}>{cond.label}</span>
                </div>
              );
            })}
          </div>
        )}
        <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{width:"100%",background:"linear-gradient(135deg,#1a6eff,#0d3fa0)",border:"none",color:"#fff",borderRadius:12,padding:"16px",cursor:"pointer",fontSize:15,fontWeight:900}}>+ ADD INVENTORY ITEM</button>
      </div>
    </main>
  );

  // ── LIST ──
  return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setView("dashboard")} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:20}}>←</button>
            <div><div style={{fontSize:16,fontWeight:800}}>ALL ITEMS</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{shown.length} items · ${totalValue.toLocaleString()} value</div></div>
          </div>
          <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ ADD</button>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items…" style={{...inp,marginBottom:8}}/>
        <div style={{display:"flex",gap:6,overflowX:"auto"}}>
          {["all",...CONDITIONS.map(c=>c.id)].map(c=>(
            <button key={c} onClick={()=>setCondFilter(c)} style={{padding:"5px 12px",borderRadius:100,background:condFilter===c?"rgba(26,110,255,0.2)":"rgba(255,255,255,0.04)",border:`1px solid ${condFilter===c?"rgba(26,110,255,0.4)":"rgba(255,255,255,0.08)"}`,color:condFilter===c?"#1a6eff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" as const,textTransform:"capitalize" as const}}>{c==="all"?"ALL":c}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {shown.length===0&&<div style={{textAlign:"center",padding:"50px 0",color:"rgba(255,255,255,0.25)",fontSize:13}}>No items found.<br/><button onClick={()=>{setForm({...BLANK});setView("add");}} style={{marginTop:16,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13}}>+ Add First Item</button></div>}
        {shown.map(item=>{
          const cond=CONDITIONS.find(c=>c.id===item.condition)||CONDITIONS[1];
          const cat=CATEGORIES.find(c=>c.id===item.category)||CATEGORIES[0];
          return(
            <div key={item.id} onClick={()=>{setSel(item);setView("detail");}} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`4px solid ${cond.color}`,borderRadius:14,padding:"14px",marginBottom:10,cursor:"pointer"}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                {/* Item thumbnail */}
                {item.photoUrl?(
                  <img src={item.photoUrl} alt={item.name} style={{width:52,height:52,objectFit:"cover",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",flexShrink:0}}/>
                ):(
                  <div style={{width:52,height:52,borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cat.icon}</div>
                )}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{item.name}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{cat.label} · Qty {item.quantity}{item.currentLocation?` · ${item.currentLocation}`:""}</div>
                  {item.damageNotes&&<div style={{fontSize:11,color:"#ff8888",marginTop:2,fontStyle:"italic"}}>{item.damageNotes}</div>}
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>${((item.currentValue||item.purchasePrice||0)*item.quantity).toLocaleString()}</div>
                  <span style={{fontSize:9,padding:"2px 8px",background:cond.bg,color:cond.color,borderRadius:4,fontWeight:700,display:"block",marginTop:4}}>{cond.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

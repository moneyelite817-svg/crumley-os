"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Storage ──────────────────────────────────────────
const JOBS_KEY  = "cros_luxury_jobs_v3";
const DOCS_KEY  = "cros_job_documents_v1";
const PHOTO_KEY = "cros_job_photos_v1";
const DOC_NAV   = "cros_active_doc_v1";

const SEED = [
  {id:"1",address:"3031 Valentine St, Dallas TX",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"",referral:"Leston Eustache",status:"active",createdAt:""},
  {id:"2",address:"3524 Spring Ave, Dallas TX",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"",referral:"Leston Eustache",status:"active",createdAt:""},
  {id:"3",address:"3610 Durango Dr, Dallas TX",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"",referral:"Leston Eustache",status:"active",createdAt:""},
  {id:"4",address:"4009 Finis St, Dallas TX",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:1450,rooms:"",notes:"",referral:"Leston Eustache",status:"active",createdAt:""},
  {id:"5",address:"1509 Dennison St, Dallas TX",client:"",agent:"KC",phone:"",jobType:"transfer",installDate:"",endDate:"",price:1450,deposit:0,rooms:"",notes:"",referral:"KC",status:"active",createdAt:""},
  {id:"6",address:"1507 Dennison St, Dallas TX",client:"",agent:"KC",phone:"",jobType:"transfer",installDate:"",endDate:"",price:1450,deposit:0,rooms:"",notes:"",referral:"KC",status:"active",createdAt:""},
  {id:"7",address:"2212 Marburg St, Dallas TX",client:"",agent:"Leston Eustache",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"Builder's risk noted",referral:"Leston Eustache",status:"active",createdAt:""},
];

interface Job {
  id:string; address:string; client:string; agent:string; phone:string;
  jobType:"install"|"transfer"|"moving"; installDate:string; endDate:string;
  price:number; deposit:number; rooms:string; notes:string; referral:string;
  status:"active"|"expiring"|"overdue"|"pickup"|"completed"; createdAt:string;
}

interface JobPhoto {
  id:string; jobId:string; photoUrl:string; category:string; caption:string; notes:string; uploadedAt:string;
}

interface JobDoc {
  id:string; jobId:string; docType:string; title:string; status:"draft"|"sent"|"signed"|"paid"|"archived"; generatedAt:string; notes:string; data?:any;
}

const PHOTO_CATEGORIES = [
  {id:"before",label:"Before",icon:"📷",c:"#f0c040"},
  {id:"after",label:"After",icon:"✨",c:"#00d084"},
  {id:"install",label:"Install",icon:"🏠",c:"#1a6eff"},
  {id:"pickup",label:"Pickup",icon:"📦",c:"#9b59b6"},
  {id:"damage",label:"Damage",icon:"⚠️",c:"#ff4444"},
  {id:"inventory",label:"Inventory",icon:"📋",c:"#4a8fff"},
  {id:"marketing",label:"Marketing",icon:"📸",c:"#00d084"},
];

const DOC_STATUS_COLORS:Record<string,{c:string;bg:string}> = {
  draft:{c:"rgba(255,255,255,0.5)",bg:"rgba(255,255,255,0.06)"},
  sent:{c:"#1a6eff",bg:"rgba(26,110,255,0.12)"},
  signed:{c:"#00d084",bg:"rgba(0,208,132,0.12)"},
  paid:{c:"#00d084",bg:"rgba(0,208,132,0.15)"},
  archived:{c:"rgba(255,255,255,0.25)",bg:"rgba(255,255,255,0.03)"},
};

// ── Helpers ──────────────────────────────────────────
function addDays(dateStr:string, days:number):string {
  const d = new Date(dateStr+"T12:00:00");
  d.setDate(d.getDate()+days);
  return d.toISOString().split("T")[0];
}
function daysBetween(d:string):number { return Math.ceil((new Date(d+"T12:00:00").getTime()-Date.now())/86400000); }
function statusOf(j:Job):"active"|"expiring"|"overdue"|"pickup"|"completed" {
  if(j.status==="completed"||j.status==="pickup") return j.status;
  if(!j.endDate) return "active";
  const d=daysBetween(j.endDate);
  if(d<0) return "overdue";
  if(d<=14) return "expiring";
  return "active";
}
const SC:Record<string,{c:string;bg:string;l:string}> = {
  active:{c:"#00d084",bg:"rgba(0,208,132,0.1)",l:"ACTIVE"},
  expiring:{c:"#f0c040",bg:"rgba(240,192,64,0.1)",l:"EXPIRING"},
  overdue:{c:"#ff4444",bg:"rgba(255,68,68,0.1)",l:"OVERDUE"},
  pickup:{c:"#1a6eff",bg:"rgba(26,110,255,0.1)",l:"PICKUP"},
  completed:{c:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)",l:"DONE"},
};
const inp:any={width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:8};
const lbl:any={display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:3};
const BLANK:Omit<Job,"id"|"createdAt">={address:"",client:"",agent:"",phone:"",jobType:"install",installDate:"",endDate:"",price:2750,deposit:0,rooms:"",notes:"",referral:"",status:"active"};

// ── JOB PHOTOS TAB ───────────────────────────────────
function JobPhotosTab({job}:{job:Job}){
  const [photos,setPhotos]=useState<JobPhoto[]>([]);
  const [uploading,setUploading]=useState(false);
  const [selCat,setSelCat]=useState("install");
  const [caption,setCaption]=useState("");
  const [enlarged,setEnlarged]=useState<JobPhoto|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    try{const all:JobPhoto[]=JSON.parse(localStorage.getItem(PHOTO_KEY)||"[]");setPhotos(all.filter(p=>p.jobId===job.id));}catch{}
  },[job.id]);

  function persist(all:JobPhoto[]){try{const existing:JobPhoto[]=JSON.parse(localStorage.getItem(PHOTO_KEY)||"[]");const others=existing.filter(p=>p.jobId!==job.id);localStorage.setItem(PHOTO_KEY,JSON.stringify([...others,...all]));}catch{}}

  async function handleFile(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return;
    setUploading(true);
    // Convert to base64 data URL for localStorage storage
    const reader=new FileReader();
    reader.onload=()=>{
      const photoUrl=reader.result as string;
      const newPhoto:JobPhoto={id:`ph-${Date.now()}`,jobId:job.id,photoUrl,category:selCat,caption:caption||"",notes:"",uploadedAt:new Date().toISOString()};
      const updated=[...photos,newPhoto];
      setPhotos(updated);persist(updated);
      setCaption("");setUploading(false);
    };
    reader.readAsDataURL(file);
    if(fileRef.current)fileRef.current.value="";
  }

  function deletePhoto(id:string){
    const updated=photos.filter(p=>p.id!==id);
    setPhotos(updated);persist(updated);
  }

  const byCategory=PHOTO_CATEGORIES.map(cat=>({...cat,photos:photos.filter(p=>p.category===cat.id)})).filter(c=>c.photos.length>0);

  return(
    <div style={{padding:"14px 16px"}}>
      {/* Upload section */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px",marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:10}}>ADD PHOTO</div>
        {/* Category picker */}
        <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:10}}>
          {PHOTO_CATEGORIES.map(cat=>(
            <button key={cat.id} onClick={()=>setSelCat(cat.id)} style={{padding:"5px 12px",borderRadius:100,background:selCat===cat.id?`${cat.c}22`:"rgba(255,255,255,0.04)",border:`1px solid ${selCat===cat.id?cat.c:"rgba(255,255,255,0.08)"}`,color:selCat===cat.id?cat.c:"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" as const}}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
        <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Caption (optional)…" style={{...inp,marginBottom:10}}/>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:"none"}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:700,opacity:uploading?0.6:1}}>
            {uploading?"Uploading…":"📷 Take Photo"}
          </button>
          <button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13,fontWeight:700}}>
            🖼 Choose File
          </button>
        </div>
      </div>

      {/* Photos by category */}
      {photos.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.25)",fontSize:13,lineHeight:1.8}}>No photos yet.<br/>Tap "Take Photo" to add the first one.</div>}

      {byCategory.map(cat=>(
        <div key={cat.id} style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:cat.c,marginBottom:10}}>{cat.icon} {cat.label.toUpperCase()} ({cat.photos.length})</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {cat.photos.map(photo=>(
              <div key={photo.id} style={{position:"relative"}}>
                <img src={photo.photoUrl} alt={photo.caption||cat.label} onClick={()=>setEnlarged(photo)} style={{width:"100%",aspectRatio:"1",objectFit:"cover",borderRadius:10,cursor:"pointer",border:`2px solid ${cat.c}33`}}/>
                {photo.caption&&<div style={{fontSize:9,color:"rgba(255,255,255,0.5)",marginTop:2,textAlign:"center" as const,lineHeight:1.2}}>{photo.caption}</div>}
                <button onClick={()=>deletePhoto(photo.id)} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.7)",border:"none",color:"#ff6b6b",borderRadius:6,width:22,height:22,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Enlarged view */}
      {enlarged&&(
        <div onClick={()=>setEnlarged(null)} style={{position:"fixed",inset:0,zIndex:600,background:"rgba(0,0,0,0.95)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",padding:16}}>
          <img src={enlarged.photoUrl} alt="" style={{maxWidth:"100%",maxHeight:"70vh",borderRadius:12,objectFit:"contain"}}/>
          {enlarged.caption&&<div style={{color:"#fff",fontSize:14,marginTop:10,textAlign:"center" as const}}>{enlarged.caption}</div>}
          <div style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:4}}>{PHOTO_CATEGORIES.find(c=>c.id===enlarged.category)?.label} · {new Date(enlarged.uploadedAt).toLocaleDateString()}</div>
          <button onClick={()=>setEnlarged(null)} style={{marginTop:20,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",borderRadius:10,padding:"10px 24px",cursor:"pointer",fontSize:14}}>Close</button>
        </div>
      )}
    </div>
  );
}

// ── DOCUMENTS TAB ────────────────────────────────────
function JobDocumentsTab({job}:{job:Job}){
  const router=useRouter();
  const [docs,setDocs]=useState<JobDoc[]>([]);
  const balance=Math.max(0,job.price-job.deposit);

  useEffect(()=>{
    try{const all:JobDoc[]=JSON.parse(localStorage.getItem(DOCS_KEY)||"[]");setDocs(all.filter(d=>d.jobId===job.id));}catch{}
  },[job.id]);

  function updateStatus(docId:string,status:string){
    try{const all:JobDoc[]=JSON.parse(localStorage.getItem(DOCS_KEY)||"[]");const updated=all.map(d=>d.id===docId?{...d,status}:d);localStorage.setItem(DOCS_KEY,JSON.stringify(updated));setDocs(updated.filter(d=>d.jobId===job.id));}catch{}
  }
  function del(docId:string){
    if(!confirm("Delete?"))return;
    try{const all:JobDoc[]=JSON.parse(localStorage.getItem(DOCS_KEY)||"[]");const updated=all.filter(d=>d.id!==docId);localStorage.setItem(DOCS_KEY,JSON.stringify(updated));setDocs(updated.filter(d=>d.jobId===job.id));}catch{}
  }
  function openGen(type:"invoice"|"contract"){
    try{localStorage.setItem(DOC_NAV,JSON.stringify(job));}catch{}
    router.push(`/luxury/${type}`);
  }

  const docButtons=[
    {icon:"📄",label:"Staging Agreement",sub:"Full liability contract",color:"#1A5CCC",action:()=>openGen("contract")},
    {icon:"🧾",label:"Invoice",sub:`$${job.price.toLocaleString()}`,color:"#1a6eff",action:()=>openGen("invoice")},
    {icon:"💰",label:"Balance Invoice",sub:`$${balance.toLocaleString()} due`,color:balance>0?"#f0c040":"rgba(255,255,255,0.3)",action:()=>openGen("invoice")},
    {icon:"🔄",label:"Renewal Agreement",sub:"90-day extension",color:"#00d084",action:()=>openGen("contract")},
  ];

  return(
    <div style={{padding:"14px 16px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {docButtons.map((b,i)=>(
          <div key={i} onClick={b.action} style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${b.color}33`,borderRadius:12,padding:"13px 10px",cursor:"pointer"}}>
            <div style={{fontSize:20,marginBottom:5}}>{b.icon}</div>
            <div style={{fontSize:12,fontWeight:700,color:b.color,marginBottom:2}}>{b.label}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{b.sub}</div>
          </div>
        ))}
      </div>
      {docs.length>0&&(
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:10}}>SAVED DOCS ({docs.length})</div>
          {docs.map(doc=>{
            const sc=DOC_STATUS_COLORS[doc.status]||DOC_STATUS_COLORS.draft;
            return(
              <div key={doc.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div><div style={{fontSize:13,fontWeight:700}}>{doc.title}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{new Date(doc.generatedAt).toLocaleDateString()}</div></div>
                  <div style={{display:"flex",gap:6}}>
                    <span style={{fontSize:9,padding:"2px 8px",background:sc.bg,color:sc.c,borderRadius:4,fontWeight:700,textTransform:"uppercase" as const}}>{doc.status}</span>
                    <button onClick={()=>del(doc.id)} style={{background:"rgba(255,68,68,0.1)",border:"none",color:"#ff6b6b",borderRadius:4,padding:"2px 7px",cursor:"pointer",fontSize:11}}>🗑</button>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                  {(["sent","signed","paid","archived"] as const).map(s=>(
                    <button key={s} onClick={()=>updateStatus(doc.id,s)} style={{fontSize:10,background:doc.status===s?"rgba(26,110,255,0.2)":"rgba(255,255,255,0.04)",border:`1px solid ${doc.status===s?"rgba(26,110,255,0.4)":"rgba(255,255,255,0.08)"}`,color:doc.status===s?"#1a6eff":"rgba(255,255,255,0.4)",borderRadius:6,padding:"3px 9px",cursor:"pointer",textTransform:"capitalize" as const}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── AI AGENT PANEL ────────────────────────────────────
function AIPanel({job,onClose}:{job:Job|null;onClose:()=>void}){
  const [sel,setSel]=useState<string|null>(null);
  const [extra,setExtra]=useState("");
  const [image,setImage]=useState<{base64:string;mediaType:string;preview:string}|null>(null);
  const [result,setResult]=useState("");
  const [loading,setLoading]=useState(false);
  const [copied,setCopied]=useState(false);
  const imgRef=useRef<HTMLInputElement>(null);

  const balance=job?Math.max(0,(job.price||0)-(job.deposit||0)):0;
  const days=job?.endDate?Math.ceil((new Date(job.endDate+"T12:00:00").getTime()-Date.now())/86400000):null;
  const actions=[
    {id:"followup",icon:"💬",label:"Follow-Up Text",desc:"Check in with agent"},
    {id:"renewal",icon:"🔄",label:"Renewal Pitch",desc:"Pitch 90-day extension"},
    {id:"collections",icon:"💰",label:"Collect $"+balance.toLocaleString(),desc:"Payment collection text"},
    {id:"pickup",icon:"📦",label:"Schedule Pickup",desc:"Coordinate removal"},
    {id:"instagram",icon:"📸",label:"IG Caption",desc:"Premium staging post"},
    {id:"photo",icon:"🖼",label:"Analyze Photo",desc:"Upload a photo or screenshot"},
  ];

  async function handleImageFile(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      const dataUrl=reader.result as string;
      const base64=dataUrl.split(",")[1];
      const mediaType=file.type||"image/jpeg";
      setImage({base64,mediaType,preview:dataUrl});
      setSel("photo");
    };
    reader.readAsDataURL(file);
  }

  async function run(){
    if(!sel&&!image)return;
    setLoading(true);setResult("");
    const base=`All In One Luxury Designs (Terrance Crumley) — DFW premium home staging.\nProperty: ${job?.address||"Job"}. Agent: ${job?.agent||"N/A"}. Type: ${job?.jobType}. Price: $${job?.price}. Deposit: $${job?.deposit}. Balance: $${balance}. Days left: ${days!==null?(days<0?Math.abs(days)+"d OVERDUE":days+"d remaining"):"not set"}.${extra?`\nContext: ${extra}`:""}`;
    const prompts:Record<string,string>={
      followup:`${base}\nWarm professional follow-up to ${job?.agent}. Under 5 sentences.`,
      renewal:`${base}\nConfident renewal pitch. Reference furniture already on site. Under 4 sentences.`,
      collections:`${base}\nProfessional collections text for $${balance}. Zelle/Venmo/Cash. Mention pickup if unpaid. Under 4 sentences.`,
      pickup:`${base}\nCoordinate pickup. Professional, easy, confirm timeline. Under 4 sentences.`,
      instagram:`${base}\nPremium IG caption for staged property. Aspirational, tag DFW agents. #AllInOneLuxury #DFWStaging #HomeStaging`,
      photo:image?`${base}\nAnalyze this image. ${extra||"What do you see and what does it mean for this staging job?"}`:base,
    };
    try{
      const body:any={prompt:prompts[sel||"photo"]||base};
      if(image){body.imageBase64=image.base64;body.imageMediaType=image.mediaType;}
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json();
      if(d.error)setResult("Error: "+d.message);else setResult(d.text);
    }catch{setResult("Network error.");}
    setLoading(false);
  }

  function copy(){navigator.clipboard?.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);}

  return(
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)"}}/>
      <div style={{position:"relative",background:"#0d1628",borderRadius:"20px 20px 0 0",border:"1px solid rgba(26,110,255,0.3)",padding:"20px 16px 48px",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><div style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>⚡ AI AGENT</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{job?.address?.split(",")[0]}</div></div>
          <button onClick={()=>{if(sel){setSel(null);setResult("");setImage(null);}else onClose();}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>{sel?"← Back":"✕"}</button>
        </div>

        {!sel&&!result&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {actions.map(a=>(
                <div key={a.id} onClick={()=>{if(a.id==="photo"){imgRef.current?.click();}else setSel(a.id);}} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"13px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:22}}>{a.icon}</span>
                  <div><div style={{fontSize:13,fontWeight:700,color:"#1a6eff",marginBottom:1}}>{a.label}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{a.desc}</div></div>
                </div>
              ))}
            </div>
            <input ref={imgRef} type="file" accept="image/*" capture="environment" onChange={handleImageFile} style={{display:"none"}}/>
          </div>
        )}

        {sel&&!result&&!loading&&(
          <div>
            {image&&(
              <div style={{marginBottom:12,position:"relative"}}>
                <img src={image.preview} alt="" style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:12,border:"1px solid rgba(26,110,255,0.3)"}}/>
                <button onClick={()=>setImage(null)} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.7)",border:"none",color:"#fff",borderRadius:6,width:26,height:26,cursor:"pointer",fontSize:13}}>✕</button>
                <div style={{fontSize:11,color:"#1a6eff",fontWeight:700,marginTop:4}}>📎 Image attached — AI will analyze it</div>
              </div>
            )}
            <label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",marginBottom:4}}>ADD CONTEXT (optional)</label>
            <textarea value={extra} onChange={e=>setExtra(e.target.value)} placeholder={sel==="photo"?"What do you want to know about this image?":"Any specific context…"} style={{...inp,height:55,resize:"none" as const,marginBottom:12}}/>
            <button onClick={run} style={{width:"100%",background:"#1a6eff",border:"none",color:"#fff",borderRadius:12,padding:"16px",fontSize:15,fontWeight:900,cursor:"pointer"}}>⚡ GENERATE</button>
          </div>
        )}
        {loading&&<div style={{textAlign:"center",padding:"30px 0"}}><div style={{fontSize:32,marginBottom:12}}>⚙️</div><div style={{fontSize:14,fontWeight:800,color:"#1a6eff",letterSpacing:"0.1em"}}>ANALYZING{image?" IMAGE":""}...</div></div>}
        {result&&(
          <div>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px",fontSize:13,lineHeight:1.85,color:"#fff",whiteSpace:"pre-wrap",marginBottom:10,maxHeight:"40vh",overflowY:"auto"}}>{result}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
              <button onClick={()=>{setResult("");setExtra("");}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:13}}>🔄 Redo</button>
              <button onClick={copy} style={{background:copied?"#00d084":"#1a6eff",border:"none",color:copied?"#000":"#fff",borderRadius:10,padding:"12px",cursor:"pointer",fontSize:14,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN JOBS PAGE
// ══════════════════════════════════════════════════════
export default function JobsPage(){
  const [jobs,setJobs]=useState<Job[]>([]);
  const [view,setView]=useState<"list"|"detail"|"add"|"edit">("list");
  const [sel,setSel]=useState<Job|null>(null);
  const [form,setForm]=useState<any>({...BLANK});
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [tab,setTab]=useState<"info"|"photos"|"docs">("info");
  const [showAI,setShowAI]=useState(false);
  const [aiJob,setAiJob]=useState<Job|null>(null);

  useEffect(()=>{
    try{const r=localStorage.getItem(JOBS_KEY);setJobs(r?JSON.parse(r):SEED);}catch{setJobs(SEED);}
  },[]);

  function persist(data:Job[]){setJobs(data);try{localStorage.setItem(JOBS_KEY,JSON.stringify(data));}catch{}}
  function f(k:string,v:any){
    setForm((p:any)=>{
      const updated={...p,[k]:v};
      // ── AUTO 90-DAY END DATE ──────────────────────────
      if(k==="installDate"&&v){
        updated.endDate=addDays(v,90);
      }
      return updated;
    });
  }

  function saveJob(){
    if(!form.address?.trim()){alert("Address required");return;}
    if(view==="edit"&&sel){
      const u=jobs.map(j=>j.id===sel.id?{...j,...form}:j);persist(u);setSel({...sel,...form});setView("detail");
    } else {
      persist([...jobs,{...form,id:Date.now().toString(),createdAt:new Date().toISOString()}]);
      setForm({...BLANK});setView("list");
    }
  }

  function del(id:string){if(!confirm("Delete job?"))return;persist(jobs.filter(j=>j.id!==id));setView("list");setSel(null);}

  const shown=jobs.map(j=>({...j,status:statusOf(j)})).filter(j=>filter==="all"||j.status===filter||(filter==="unpaid"&&j.price-j.deposit>0)).filter(j=>j.address.toLowerCase().includes(search.toLowerCase())||j.agent.toLowerCase().includes(search.toLowerCase()));
  const totalRevenue=jobs.filter(j=>statusOf(j)!=="completed").reduce((a,j)=>a+j.price,0);
  const totalUnpaid=jobs.reduce((a,j)=>a+Math.max(0,j.price-j.deposit),0);

  if(view==="add"||view==="edit") return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setView(view==="edit"?"detail":"list")} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Cancel</button>
        <span style={{fontSize:14,fontWeight:800}}>{view==="edit"?"EDIT JOB":"NEW JOB"}</span>
        <button onClick={saveJob} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
      </div>
      <div style={{padding:"20px 16px"}}>
        {/* Job type + price */}
        <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:12,padding:"14px",marginBottom:12}}>
          <div style={{fontSize:9,letterSpacing:"0.15em",color:"rgba(255,255,255,0.3)",marginBottom:8}}>JOB TYPE</div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {(["install","transfer","moving"] as const).map(t=>(
              <button key={t} onClick={()=>{f("jobType",t);f("price",t==="transfer"?1450:t==="moving"?800:2750);}} style={{flex:1,padding:"10px 6px",borderRadius:10,background:form.jobType===t?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${form.jobType===t?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:form.jobType===t?"#fff":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:11,fontWeight:700,textTransform:"capitalize" as const}}>
                {t==="install"?"Install $2,750":t==="transfer"?"Transfer $1,450":"Moving"}
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

        {[{l:"PROPERTY ADDRESS *",k:"address"},{l:"CLIENT/OWNER NAME",k:"client"},{l:"AGENT",k:"agent"},{l:"PHONE",k:"phone"},{l:"REFERRAL SOURCE",k:"referral"},{l:"ROOMS STAGED",k:"rooms"},{l:"NOTES",k:"notes"}].map(field=>(
          <div key={field.k}><label style={lbl}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} style={inp}/></div>
        ))}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={lbl}>INSTALL DATE</label>
            <input type="date" value={form.installDate||""} onChange={e=>f("installDate",e.target.value)} style={inp}/>
          </div>
          <div>
            <label style={lbl}>END DATE <span style={{color:"#00d084",fontSize:9,fontWeight:400}}>(auto 90d)</span></label>
            <input type="date" value={form.endDate||""} onChange={e=>f("endDate",e.target.value)} style={{...inp,borderColor:form.installDate?"rgba(0,208,132,0.4)":"rgba(255,255,255,0.1)"}}/>
            {form.installDate&&form.endDate&&<div style={{fontSize:10,color:"#00d084",marginTop:-4,marginBottom:6}}>✓ Auto-set 90 days from install</div>}
          </div>
        </div>

        <label style={lbl}>STATUS</label>
        <select value={form.status} onChange={e=>f("status",e.target.value)} style={{...inp}}>
          {["active","expiring","overdue","pickup","completed"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        {view==="edit"&&<button onClick={()=>del(sel!.id)} style={{width:"100%",marginTop:10,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",color:"#ff6b6b",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🗑 DELETE JOB</button>}
      </div>
    </main>
  );

  if(view==="detail"&&sel){
    const job={...sel,status:statusOf(sel)};
    const s=SC[job.status]||SC.active;
    const balance=Math.max(0,job.price-job.deposit);
    const days=job.endDate?daysBetween(job.endDate):null;
    return(
      <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("list");setSel(null);setTab("info");}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Jobs</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiJob(job);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...job});setView("edit");}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13}}>✏️</button>
          </div>
        </div>
        <div style={{padding:"14px 16px 0"}}>
          <div style={{background:s.bg,borderLeft:`4px solid ${s.c}`,border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"14px",marginBottom:12}}>
            <div style={{fontSize:18,fontWeight:900,marginBottom:4}}>{job.address}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{job.agent||"No agent"}{job.client?` · ${job.client}`:""}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:12}}>
              {[{l:"PRICE",v:`$${job.price.toLocaleString()}`,c:"#fff"},{l:"DEPOSIT",v:`$${job.deposit.toLocaleString()}`,c:"#00d084"},{l:"BALANCE",v:`$${balance.toLocaleString()}`,c:balance>0?"#f0c040":"#00d084"}].map((item,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:900,color:item.c}}>{item.v}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginTop:2}}>{item.l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:6,marginTop:10}}>
              <span style={{fontSize:10,background:s.bg,color:s.c,borderRadius:100,padding:"3px 10px",fontWeight:700}}>{s.l}</span>
              {days!==null&&<span style={{fontSize:10,background:"rgba(255,255,255,0.04)",borderRadius:100,padding:"3px 10px",color:days<0?"#ff4444":days<=14?"#f0c040":"rgba(255,255,255,0.4)"}}>{days<0?`${Math.abs(days)}d overdue`:`${days}d left`}</span>}
              {job.installDate&&<span style={{fontSize:10,background:"rgba(0,208,132,0.08)",borderRadius:100,padding:"3px 10px",color:"#00d084"}}>Installed {job.installDate}</span>}
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:8,marginBottom:0}}>
            {[{id:"info",l:"📋 Info"},{id:"photos",l:"📷 Photos"},{id:"docs",l:"📄 Docs"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id as any)} style={{flex:1,padding:"9px 4px",borderRadius:10,background:tab===t.id?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${tab===t.id?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:tab===t.id?"#fff":"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:12,fontWeight:700}}>
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {tab==="info"&&(
          <div style={{padding:"14px 16px"}}>
            {[{l:"JOB TYPE",v:job.jobType==="transfer"?"Transfer ($1,450)":job.jobType==="moving"?"Moving":"Full Install ($2,750)"},{l:"INSTALL DATE",v:job.installDate||"Not set"},{l:"END DATE",v:job.endDate||"Not set"},{l:"ROOMS",v:job.rooms||"—"},{l:"REFERRAL",v:job.referral||"—"},{l:"NOTES",v:job.notes||"—"}].map((item,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase" as const,marginBottom:3}}>{item.l}</div>
                <div style={{fontSize:14,color:["Not set","—"].includes(item.v)?"rgba(255,255,255,0.25)":"#fff"}}>{item.v}</div>
              </div>
            ))}
            <div style={{display:"grid",gap:10,marginTop:4}}>
              <button onClick={()=>setTab("docs")} style={{background:"linear-gradient(135deg,#1A5CCC,#0d3fa0)",border:"none",color:"#fff",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:14,fontWeight:900}}>📄 Generate Documents & Invoices</button>
              <button onClick={()=>setTab("photos")} style={{background:"rgba(26,110,255,0.08)",border:"1px solid rgba(26,110,255,0.2)",color:"#1a6eff",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:14,fontWeight:700}}>📷 View / Add Photos</button>
              <button onClick={()=>{persist(jobs.map(j=>j.id===job.id?{...j,status:"completed"}:j));setView("list");setSel(null);}} style={{background:"rgba(0,208,132,0.08)",border:"1px solid rgba(0,208,132,0.2)",color:"#00d084",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ Mark Completed</button>
            </div>
          </div>
        )}
        {tab==="photos"&&<JobPhotosTab job={job}/>}
        {tab==="docs"&&<JobDocumentsTab job={job}/>}
        {showAI&&<AIPanel job={aiJob} onClose={()=>{setShowAI(false);setAiJob(null);}}/>}
      </main>
    );
  }

  // ── LIST ──
  return(
    <main style={{minHeight:"100vh",background:"#03060f",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(3,6,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Link href="/luxury/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
            <div><div style={{fontSize:16,fontWeight:800}}>STAGING JOBS</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>${totalRevenue.toLocaleString()} active · ${totalUnpaid.toLocaleString()} unpaid</div></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiJob(null);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...BLANK});setView("add");}} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ NEW</button>
          </div>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search address or agent…" style={{...inp,marginBottom:8}}/>
        <div style={{display:"flex",gap:8,overflowX:"auto"}}>
          {["all","active","expiring","overdue","pickup","completed","unpaid"].map(fv=>(
            <button key={fv} onClick={()=>setFilter(fv)} style={{padding:"5px 12px",borderRadius:100,background:filter===fv?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${filter===fv?"#1a6eff":"rgba(255,255,255,0.08)"}`,color:filter===fv?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:"0.1em",cursor:"pointer",whiteSpace:"nowrap" as const,textTransform:"uppercase" as const}}>{fv}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {shown.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.25)",fontSize:14}}>No jobs.<br/><button onClick={()=>{setForm({...BLANK});setView("add");}} style={{marginTop:16,background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:10,padding:"10px 20px",cursor:"pointer",fontSize:13}}>+ Add Job</button></div>}
        {shown.map(job=>{
          const s=SC[job.status];const balance=Math.max(0,job.price-job.deposit);const days=job.endDate?daysBetween(job.endDate):null;
          return(
            <div key={job.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`3px solid ${s.c}`,borderRadius:14,padding:"14px",marginBottom:10,cursor:"pointer"}} onClick={()=>{setSel(job);setView("detail");setTab("info");}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap" as const,overflow:"hidden",textOverflow:"ellipsis",marginBottom:2}}>{job.address}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{job.agent||"No agent"}{job.client?` · ${job.client}`:""}</div></div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}><div style={{fontSize:17,fontWeight:900,color:"#1a6eff"}}>${job.price.toLocaleString()}</div>{balance>0&&<div style={{fontSize:10,color:"#f0c040",fontWeight:700}}>${balance.toLocaleString()} DUE</div>}</div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                <span style={{fontSize:10,background:s.bg,borderRadius:100,padding:"3px 9px",color:s.c,fontWeight:700,textTransform:"uppercase" as const}}>{s.l}</span>
                {days!==null&&<span style={{fontSize:10,background:"rgba(255,255,255,0.04)",borderRadius:100,padding:"3px 9px",color:days<0?"#ff4444":days<=14?"#f0c040":"rgba(255,255,255,0.35)"}}>{days<0?`${Math.abs(days)}d overdue`:`${days}d left`}</span>}
                {job.installDate&&<span style={{fontSize:10,background:"rgba(0,208,132,0.06)",borderRadius:100,padding:"3px 9px",color:"rgba(0,208,132,0.7)"}}>Installed</span>}
                <button onClick={e=>{e.stopPropagation();setAiJob(job);setShowAI(true);}} style={{fontSize:10,background:"rgba(26,110,255,0.12)",borderRadius:100,padding:"3px 9px",color:"#1a6eff",fontWeight:700,border:"1px solid rgba(26,110,255,0.25)",cursor:"pointer"}}>⚡ AI</button>
                <button onClick={e=>{e.stopPropagation();setSel(job);setView("detail");setTab("photos");}} style={{fontSize:10,background:"rgba(255,255,255,0.04)",borderRadius:100,padding:"3px 9px",color:"rgba(255,255,255,0.4)",border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer"}}>📷</button>
              </div>
            </div>
          );
        })}
      </div>
      {showAI&&<AIPanel job={aiJob} onClose={()=>{setShowAI(false);setAiJob(null);}}/>}
    </main>
  );
}

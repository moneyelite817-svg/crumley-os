"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE = "ct_clients";
const BM = {squat:"",bench:"",deadlift:"",powerClean:"",sprint40:"",vertical:"",broadJump:"",agility:"",pullups:"",pushups:"",hangClean:"",customPR:""};
const DEF = [{id:1,name:"Levi Smith",sport:"General",freq:2,sessions:1,value:378,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:2,name:"Donovan Edwards",sport:"General",freq:2,sessions:33,value:2835,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:3,name:"Travis Cheyne",sport:"General",freq:2,sessions:48,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:4,name:"Rex Hayes",sport:"General",freq:2,sessions:26,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:5,name:"Emiliano Ortiz",sport:"Football",freq:4,sessions:20,value:0,status:"inactive",notes:"Mom: Anna Ortiz",age:"",weight:"",position:"WR",goal:"",injuries:"",parentName:"Anna Ortiz",parentPhone:""},{id:6,name:"Mateo Ortiz",sport:"Football",freq:4,sessions:20,value:0,status:"inactive",notes:"Brother of Emiliano",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:7,name:"Noah Langdon",sport:"General",freq:1,sessions:4,value:367,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:8,name:"Sam Stacy",sport:"General",freq:1,sessions:4,value:1575,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:9,name:"Cruz Mar",sport:"General",freq:1,sessions:13,value:1134,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:10,name:"Joaquin Chavez",sport:"General",freq:2,sessions:12,value:1071,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:11,name:"Lilianna Chavez",sport:"General",freq:2,sessions:12,value:1071,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:12,name:"Breelan",sport:"General",freq:2,sessions:8,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:13,name:"Granger",sport:"General",freq:2,sessions:8,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:14,name:"Cody Bevan",sport:"General",freq:1,sessions:1,value:0,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:15,name:"Joshua Chavis",sport:"General",freq:2,sessions:2,value:0,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:16,name:"Daniel Chapman",sport:"General",freq:2,sessions:2,value:0,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:17,name:"Axton Mondragon",sport:"General",freq:1,sessions:4,value:1575,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:18,name:"Aaliyah Jauregui",sport:"General",freq:2,sessions:2,value:0,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:19,name:"Jaxson Bowling",sport:"General",freq:9,sessions:12,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:20,name:"Jacob Robledo",sport:"General",freq:1,sessions:3,value:210,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:""},{id:21,name:"Quenton Jean",sport:"General",freq:2,sessions:0,value:0,status:"inactive",notes:"Contact Kevin (dad)",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"Kevin Jean",parentPhone:""}].map(a=>({...a,maxes:{...BM},progressLog:[]}));

const SC: Record<string,{c:string;bg:string;l:string}> = {active:{c:"#1a6eff",bg:"rgba(26,110,255,0.1)",l:"ACTIVE"},urgent:{c:"#ff4444",bg:"rgba(255,68,68,0.1)",l:"URGENT"},inactive:{c:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)",l:"INACTIVE"}};
const CATS = [{id:"training",label:"🏋️ Training",c:"#1a6eff"},{id:"comms",label:"💬 Comms",c:"#00d084"},{id:"assess",label:"📊 Assess",c:"#f0c040"},{id:"content",label:"📱 Content",c:"#9b59b6"},{id:"business",label:"💰 Business",c:"#e74c3c"}];
const SK: Record<string,{id:string;icon:string;label:string}[]> = {
  training:[{id:"workout",icon:"🏋️",label:"Full Session Plan"},{id:"speed",icon:"⚡",label:"Speed & Agility"},{id:"strength",icon:"💪",label:"Strength Block"},{id:"conditioning",icon:"🫁",label:"Conditioning"},{id:"warmup",icon:"🔥",label:"Dynamic Warm-Up"},{id:"compPrep",icon:"🏆",label:"Competition Prep"},{id:"recovery",icon:"🧊",label:"Recovery"},{id:"program",icon:"📋",label:"4-Week Program"}],
  comms:[{id:"renewal",icon:"💰",label:"Renewal Pitch"},{id:"parentUpdate",icon:"👨‍👩‍👦",label:"Parent Update"},{id:"athleteCheckIn",icon:"👋",label:"Athlete Check-In"},{id:"reEngage",icon:"🔁",label:"Re-Engage"},{id:"milestone",icon:"🎉",label:"Milestone"},{id:"sessionRecap",icon:"📝",label:"Session Recap"}],
  assess:[{id:"progressReport",icon:"📈",label:"Progress Report"},{id:"prSummary",icon:"🏅",label:"PR Summary"},{id:"devAnalysis",icon:"🔬",label:"Dev Analysis"},{id:"combineReady",icon:"🎯",label:"Combine Readiness"},{id:"injuryPlan",icon:"🩹",label:"Injury Plan"}],
  content:[{id:"instaAthlete",icon:"📸",label:"Athlete Spotlight"},{id:"instaPR",icon:"🏆",label:"PR Post"},{id:"programPromo",icon:"📣",label:"Program Promo"},{id:"motivational",icon:"🔥",label:"Motivational Post"}],
  business:[{id:"packageRec",icon:"📦",label:"Package Rec"},{id:"upsell",icon:"📈",label:"Upsell"},{id:"referralAsk",icon:"🤝",label:"Referral Ask"},{id:"d1Pitch",icon:"🏫",label:"D1 Pitch"}],
};

function bp(a:any,sid:string,ex:string){
  const mx=Object.entries(a?.maxes||{}).filter(([,v])=>v).map(([k,v])=>`${k}:${v}`).join("|");
  const c=`Coach T — Elite Skillz Lab 🧪 | D1 Hulen FTW | DB+Bands ONLY | 60min\nATHLETE: ${a?.name} | ${a?.sport||"General"} | ${a?.position||"N/A"} | Age:${a?.age||"?"} | ${a?.weight||"?"}lbs\nGoal:${a?.goal||"athletic development"} | Injuries:${a?.injuries||"none"} | Sessions:${a?.sessions} | ${a?.freq||2}x/wk\nMaxes:${mx||"not recorded—use intermediate weights"} | Parent:${a?.parentName||"N/A"}\n${ex?`Context:${ex}`:""}`;
  if(sid==="workout")return`${c}\nGenerate COMPLETE 60-min session. DUMBBELLS AND BANDS ONLY.\n${mx?`Use % of max (Power=65%,Strength=78%,Cond=55%). Give EXACT DB weights.`:"Give specific weight ranges — NEVER say 'appropriate weight'."}\n\nFormat EXACTLY:\n\n**${(a?.name||"ATHLETE").split(" ")[0].toUpperCase()} — SESSION PLAN**\n📅 ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})} | ⏱ 60 Min | 🏋️ DB + Bands\n\n━━━ ⚡ ACTIVATION (5 min) ━━━\n1. [Exercise] — [reps] — [cue]\n2. [Exercise] — [reps] — [cue]\n3. [Exercise] — [reps] — [cue]\n\n━━━ 💥 POWER (12 min) ━━━\n1. [Exercise] — [sets]x[reps] @ [EXACT lbs] — [cue] | Rest [sec]\n2. [Exercise] — [sets]x[reps] @ [EXACT lbs] — [cue] | Rest [sec]\n\n━━━ 💪 STRENGTH A (12 min) ━━━\nA1. [Exercise] — [sets]x[reps] @ [lbs] — [cue]\nA2. [Exercise] — [sets]x[reps] @ [lbs] — [cue]\nRest 90sec | [X] rounds\n\n━━━ 💪 STRENGTH B (10 min) ━━━\nB1. [Exercise] — [sets]x[reps] @ [lbs] — [cue]\nB2. [Exercise] — [sets]x[reps] @ [lbs] — [cue]\nRest 60sec | [X] rounds\n\n━━━ 🔥 CONDITIONING (15 min) ━━━\n[X] rounds | [work]s on/[rest]s off\n1-4. [Exercises]\n\n━━━ 🧊 COOLDOWN (6 min) ━━━\n1-3. [Stretches — hold time]\n\n━━━ 🎯 COACH T CUE ━━━\n[Specific note for THIS athlete]\n\n━━━ 📅 NEXT SESSION ━━━\n[What to build next time]`;
  if(sid==="speed")return`${c}\n\n60-min SPEED & AGILITY for ${a?.sport||"athletics"}. DB+bands. Movement prep, acceleration, COD drills, footwork, band speed work, finisher. Exact distances, reps, rest. Real speed coach format.`;
  if(sid==="strength")return`${c}\n\nSTRENGTH 60-min. DB+bands. Push/pull/hinge/squat/carry. ${mx?`Weights from maxes:${mx}`:"RPE+bodyweight."} Exact sets/reps/weights/rest. Explain adaptation goal.`;
  if(sid==="conditioning")return`${c}\n\nBrutal 20-min CONDITIONING. DB+bands. Work:rest, weights, rounds, coach challenge. Sport:${a?.sport||"athletics"}.`;
  if(sid==="warmup")return`${c}\n\n12-min DYNAMIC WARM-UP for ${a?.sport} — ${a?.position||"athlete"}. Foam rolling, joint mob, dynamic, neural activation, sport patterns. Exact reps+cues.`;
  if(sid==="compPrep")return`${c}\n\n5-day COMPETITION PREP. Day-by-day, taper, activation, mental prep, pre-game routine. Elite sports performance level.`;
  if(sid==="recovery")return`${c}\n\n45-min ACTIVE RECOVERY. Low intensity, blood flow. Breathing, foam roll, mobility, light bands. Day after tough training.`;
  if(sid==="program")return`${c}\n\n4-WEEK PROGRAM. Week1:Foundations, Week2:Volume, Week3:Intensity, Week4:Peak. Themes, lifts, benchmarks, expected gains. DB+bands.`;
  if(sid==="renewal")return`${c}\n\n${a?.sessions} sessions left. Confident renewal pitch to ${a?.parentName||"parent/athlete"}. Reference progress. Coach not salesman. Under 5 sentences.`;
  if(sid==="parentUpdate")return`${c}\n\nParent text to ${a?.parentName||"parent"}. 1 strength win, 1 movement improvement, 1 character note, next focus. Specific. Under 6 sentences.`;
  if(sid==="athleteCheckIn")return`${c}\n\nCheck-in FROM Coach T TO ${a?.name?.split(" ")[0]}. Engaged, reference sport/goal. Coach energy. Under 3 sentences.`;
  if(sid==="reEngage")return`${c}\n\nRe-engagement to ${a?.parentName||"parent/athlete"}. Genuine coach who noticed absence. Availability question. Under 4 sentences.`;
  if(sid==="milestone")return`${c}\n\nCelebration message — athlete hit a milestone. Specific, enthusiastic, builds momentum. Under 4 sentences.`;
  if(sid==="sessionRecap")return`${c}\n\nSession recap to ${a?.parentName||"parent"}. What worked, what stood out, one focus before next session. Under 4 sentences.`;
  if(sid==="progressReport")return`${c}\n\n4-week progress report. Strength, speed, attitude, improvements, gaps. ${mx?`Benchmarks:${mx}.`:""}  Professional enough for school coach.`;
  if(sid==="prSummary")return`${c}\n\nPR Summary. Maxes:${mx||"none"}. Age/position standards comparison. Top 2 strengths, top 2 gaps. Score /10.`;
  if(sid==="devAnalysis")return`${c}\n\nHonest development analysis. Level, top 2 strengths, top 2 limiters, #1 improvement in 90 days. Pro scout, no cheerleading.`;
  if(sid==="combineReady")return`${c}\n\nCombine readiness ${a?.sport} — ${a?.position}. Maxes:${mx||"not recorded"}. D1/D2/D3 comparison. Current tier, next requirements, timeline.`;
  if(sid==="injuryPlan")return`${c}\n\nModified plan around: ${a?.injuries||ex||"injury"}. DB+bands. Maintain fitness. What to avoid/modify/improve.`;
  if(sid==="instaAthlete")return`${c}\n\nIG spotlight — no last name. Sport:${a?.sport}. Grind+improvement. Coach T voice. Under 8 sentences. #EliteSkillzLab #D1Training #DFWAthletes + 2 sport hashtags.`;
  if(sid==="instaPR")return`${c}\n\nIG PR celebration. New record. Hype, work, inspire. Fire. Under 6 sentences. 5 hashtags.`;
  if(sid==="programPromo")return`${c}\n\nIG promo Elite Skillz Lab 🧪. D1 facility, Coach T, results, limited spots. CTA. Under 8 sentences. 5 hashtags.`;
  if(sid==="motivational")return`${c}\n\nFire motivational post. ${ex||"elite mindset"}. Short, powerful, real coach. Under 5 sentences. 4 hashtags.`;
  if(sid==="packageRec")return`${c}\n\nBest package for ${a?.name}. Goal:${a?.goal||"development"}. $25/hr. Specific rec + rationale + expected outcomes.`;
  if(sid==="upsell")return`${c}\n\nUpsell to ${a?.parentName||"parent/athlete"} — more sessions. Frame development. Confident not pushy. Under 4 sentences.`;
  if(sid==="referralAsk")return`${c}\n\nReferral request. Natural, easy. Positive experience. Limited spots. Under 3 sentences.`;
  if(sid==="d1Pitch")return`${c}\n\nPitch ${a?.name?.split(" ")[0]} into D1 group Tue/Wed 5:45-7:45PM. Competitive environment. Reference other athletes. Under 4 sentences.`;
  return`${c}\n\n${sid}: ${ex}`;
}

function AISheet({athlete,onClose}:{athlete:any;onClose:()=>void}){
  const [cat,setCat]=useState("training");
  const [sid,setSid]=useState<string|null>(null);
  const [ex,setEx]=useState("");
  const [res,setRes]=useState("");
  const [load,setLoad]=useState(false);
  const [err,setErr]=useState("");
  const [copied,setCopied]=useState(false);
  const cc=CATS.find(c=>c.id===cat)?.c||"#1a6eff";
  const csk=SK[cat]||[];
  const inp2:any={width:"100%",padding:"10px 12px",background:"#0d0d0d",border:"1px solid #333",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:13,outline:"none",boxSizing:"border-box"};

  async function gen(){
    if(!sid)return;
    setLoad(true);setRes("");setErr("");
    try{const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:bp(athlete,sid,ex)})});const d=await r.json();if(d.error)setErr(d.message||d.error);else setRes(d.text);}catch{setErr("Network error.");}
    setLoad(false);
  }
  function copy(){navigator.clipboard?.writeText(res);setCopied(true);setTimeout(()=>setCopied(false),2000);}

  return(
    <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)"}}/>
      <div style={{position:"relative",background:"#0a0a1a",borderRadius:"20px 20px 0 0",border:"1px solid rgba(26,110,255,0.3)",padding:"20px 16px 50px",maxHeight:"93vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:"#1a6eff"}}>⚡ AI AGENT</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{athlete?.name} · Elite Skillz Lab 🧪</div>
          </div>
          <button onClick={()=>{if(sid){setSid(null);setRes("");setErr("");}else onClose();}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>
            {sid?"← Back":"✕"}
          </button>
        </div>

        {/* Athlete stats */}
        <div style={{background:"rgba(26,110,255,0.08)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:10,padding:"10px",marginBottom:14,display:"flex",gap:10}}>
          {[{l:"SESSIONS",v:athlete?.sessions},{l:"FREQ",v:`${athlete?.freq||2}x`},{l:"SPORT",v:athlete?.sport||"General"},{l:"STATUS",v:(athlete?.status||"active").toUpperCase()}].map((s,i)=>(
            <div key={i} style={{flex:1,textAlign:"center"}}>
              <div style={{fontSize:13,fontWeight:900,color:"#1a6eff"}}>{s.v}</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em",marginTop:1}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* SKILL SELECT */}
        {!sid&&(
          <div>
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14}}>
              {CATS.map(c=>(
                <button key={c.id} onClick={()=>setCat(c.id)} style={{padding:"7px 12px",borderRadius:100,background:cat===c.id?c.c:"rgba(255,255,255,0.04)",border:`1px solid ${cat===c.id?c.c:"rgba(255,255,255,0.08)"}`,color:cat===c.id?"#fff":"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                  {c.label}
                </button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {csk.map(s=>(
                <div key={s.id} onClick={()=>setSid(s.id)} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${cc}22`,borderRadius:12,padding:"13px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:22}}>{s.icon}</span>
                  <div style={{fontSize:12,fontWeight:700,color:cc,lineHeight:1.3}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GENERATE */}
        {sid&&!res&&!load&&(
          <div>
            <div style={{background:`${cc}15`,border:`1px solid ${cc}33`,borderRadius:10,padding:"10px 14px",marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:700,color:cc}}>{csk.find(s=>s.id===sid)?.icon} {csk.find(s=>s.id===sid)?.label}</div>
            </div>
            <label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:6}}>ADD CONTEXT (optional)</label>
            <textarea value={ex} onChange={e=>setEx(e.target.value)} placeholder={sid==="workout"?"e.g. Knee sore today · Upper body focus · First session back":sid==="renewal"?"e.g. He asked about speed work · Offer discount":"Specific notes..."} style={{...inp2,height:60,resize:"none" as const,marginBottom:12}}/>
            <button onClick={gen} style={{width:"100%",background:cc,border:"none",color:"#fff",borderRadius:12,padding:"16px",fontSize:16,fontWeight:900,cursor:"pointer"}}>⚡ GENERATE</button>
          </div>
        )}

        {load&&(
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <div style={{fontSize:44,marginBottom:12}}>⚙️</div>
            <div style={{fontSize:15,fontWeight:900,color:cc,letterSpacing:"0.1em",marginBottom:6}}>{sid==="workout"?"BUILDING SESSION PLAN...":"GENERATING..."}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>{sid==="workout"?`Creating ${athlete?.name?.split(" ")[0]}'s workout with exact weights`:"One moment..."}</div>
          </div>
        )}

        {err&&(
          <div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:12,padding:"14px",color:"#ff8888",fontSize:13,lineHeight:1.6}}>
            {err}
            {(err.includes("credit")||err.includes("billing"))&&<div style={{marginTop:8}}><a href="https://console.anthropic.com/settings/billing" target="_blank" style={{color:"#1a6eff",fontWeight:700,textDecoration:"none",fontSize:12}}>→ Add credits</a></div>}
          </div>
        )}

        {res&&(
          <div>
            <div style={{background:"#0d0d0d",border:"1px solid #222",borderRadius:14,padding:"16px",fontSize:13,lineHeight:1.85,color:"#fff",whiteSpace:"pre-wrap",marginBottom:12,fontFamily:["workout","speed","strength","program"].includes(sid||"")?"'Courier New',monospace":"system-ui"}}>
              {res}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10,marginBottom:14}}>
              <button onClick={()=>{setRes("");setErr("");}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #333",color:"rgba(255,255,255,0.4)",borderRadius:10,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🔄 Redo</button>
              <button onClick={copy} style={{background:copied?"#00d084":cc,border:"none",color:copied?"#000":"#fff",borderRadius:10,padding:"14px",cursor:"pointer",fontSize:15,fontWeight:900}}>{copied?"✓ COPIED!":"📋 COPY"}</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {csk.filter(s=>s.id!==sid).slice(0,4).map(s=>(
                <div key={s.id} onClick={()=>{setSid(s.id);setRes("");setErr("");setEx("");}} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${cc}22`,borderRadius:8,padding:"10px",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16}}>{s.icon}</span><span style={{fontSize:11,fontWeight:700,color:cc}}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inp:any={width:"100%",padding:"10px 12px",background:"#111",border:"1px solid #333",borderRadius:10,color:"#fff",fontFamily:"system-ui",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10};
const lbl:any={display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginBottom:4};

export default function RosterPage(){
  const [athletes,setAthletes]=useState<any[]>([]);
  const [view,setView]=useState<"list"|"detail"|"edit"|"maxes"|"progress">("list");
  const [sel,setSel]=useState<any>(null);
  const [form,setForm]=useState<any>({});
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [newLog,setNewLog]=useState("");
  const [aiA,setAiA]=useState<any>(null);
  const [showAI,setShowAI]=useState(false);

  useEffect(()=>{
    try{const raw=localStorage.getItem(STORAGE);const d=raw?JSON.parse(raw):DEF;setAthletes(d.map((a:any)=>({...a,maxes:{...BM,...(a.maxes||{})},progressLog:a.progressLog||[],parentName:a.parentName||"",parentPhone:a.parentPhone||""})));}
    catch{setAthletes(DEF);}
  },[]);

  function persist(data:any[]){setAthletes(data);try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch{}}
  function f(k:string,v:any){setForm((p:any)=>({...p,[k]:v}));}
  function fm(k:string,v:any){setForm((p:any)=>({...p,maxes:{...p.maxes,[k]:v}}));}
  function saveEdit(){const u=athletes.map(a=>a.id===sel.id?{...a,...form}:a);persist(u);setSel({...sel,...form});setView("detail");}
  function addLog(){if(!newLog.trim()||!sel)return;const log={text:newLog,date:new Date().toLocaleDateString(),ts:Date.now()};const logs=[log,...(sel.progressLog||[])];const u=athletes.map(a=>a.id===sel.id?{...a,progressLog:logs}:a);persist(u);setSel({...sel,progressLog:logs});setNewLog("");}

  const shown=athletes.filter(a=>(filter==="all"||a.status===filter)&&a.name?.toLowerCase().includes(search.toLowerCase()));
  const urgentCount=athletes.filter(a=>a.status==="urgent").length;

  if(view==="maxes"&&sel)return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:60,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setView("detail")} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Back</button>
        <span style={{fontSize:14,fontWeight:800,color:"#1a6eff"}}>📊 PRs & MAXES</span>
        <button onClick={saveEdit} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
      </div>
      <div style={{padding:"20px 16px"}}>
        <div style={{fontSize:18,fontWeight:900,marginBottom:16}}>{sel.name}</div>
        {[{title:"💪 STRENGTH (lbs)",fields:[{l:"Squat 1RM",k:"squat",p:"e.g. 225"},{l:"Bench 1RM",k:"bench",p:"e.g. 185"},{l:"Deadlift",k:"deadlift",p:"e.g. 275"},{l:"Power Clean",k:"powerClean",p:"e.g. 165"},{l:"Hang Clean",k:"hangClean",p:"e.g. 155"}]},{title:"⚡ SPEED & POWER",fields:[{l:"40-Yard Dash",k:"sprint40",p:"e.g. 4.72s"},{l:"Vertical",k:"vertical",p:"e.g. 28in"},{l:"Broad Jump",k:"broadJump",p:"e.g. 8ft 4in"},{l:"Pro Agility",k:"agility",p:"e.g. 4.35s"}]},{title:"🎯 BODYWEIGHT",fields:[{l:"Pull-Ups Max",k:"pullups",p:"e.g. 12"},{l:"Push-Ups Max",k:"pushups",p:"e.g. 35"},{l:"Custom PR",k:"customPR",p:"Any PR"}]}].map(section=>(
          <div key={section.title}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",marginBottom:10,marginTop:16}}>{section.title}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>
              {section.fields.map(field=>(<div key={field.k}><label style={lbl}>{field.l}</label><input value={form.maxes?.[field.k]||""} onChange={e=>fm(field.k,e.target.value)} placeholder={field.p} style={inp}/></div>))}
            </div>
          </div>
        ))}
        <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:12,padding:"12px",fontSize:12,color:"rgba(255,255,255,0.5)"}}>💡 AI uses these for exact DB weights in workout plans.</div>
      </div>
    </main>
  );

  if(view==="progress"&&sel)return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:60,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setView("detail")} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Back</button>
        <span style={{fontSize:14,fontWeight:800,color:"#00d084"}}>📈 PROGRESS LOG</span>
        <div style={{width:60}}/>
      </div>
      <div style={{padding:"20px 16px"}}>
        <div style={{fontSize:18,fontWeight:900,marginBottom:16}}>{sel.name}</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <input value={newLog} onChange={e=>setNewLog(e.target.value)} placeholder="Add progress note..." style={{...inp,flex:1,marginBottom:0}}/>
          <button onClick={addLog} style={{background:"#00d084",border:"none",color:"#000",borderRadius:10,padding:"0 16px",cursor:"pointer",fontWeight:900,fontSize:13}}>ADD</button>
        </div>
        {(!sel.progressLog||sel.progressLog.length===0)&&<div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.25)",fontSize:13}}>No notes yet.</div>}
        {sel.progressLog?.map((log:any,i:number)=>(<div key={i} style={{background:"#111",border:"1px solid #222",borderRadius:12,padding:"14px",marginBottom:8}}><div style={{fontSize:13,color:"#fff",lineHeight:1.5,marginBottom:4}}>{log.text}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>{log.date}</div></div>))}
      </div>
    </main>
  );

  if(view==="edit"&&sel)return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:60,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>{setView("detail");setForm({});}} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Cancel</button>
        <span style={{fontSize:14,fontWeight:800}}>EDIT ATHLETE</span>
        <button onClick={saveEdit} style={{background:"#1a6eff",border:"none",color:"#fff",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>SAVE</button>
      </div>
      <div style={{padding:"20px 16px"}}>
        {[{l:"Name",k:"name"},{l:"Sport",k:"sport"},{l:"Position",k:"position"},{l:"Goal",k:"goal"},{l:"Injuries",k:"injuries"}].map(field=>(<div key={field.k}><label style={lbl}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} style={inp}/></div>))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={lbl}>AGE</label><input value={form.age||""} onChange={e=>f("age",e.target.value)} style={inp}/></div><div><label style={lbl}>WEIGHT (lbs)</label><input value={form.weight||""} onChange={e=>f("weight",e.target.value)} style={inp}/></div></div>
        <label style={lbl}>PARENT NAME</label><input value={form.parentName||""} onChange={e=>f("parentName",e.target.value)} style={inp}/>
        <label style={lbl}>PARENT PHONE</label><input value={form.parentPhone||""} onChange={e=>f("parentPhone",e.target.value)} style={inp}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><div><label style={lbl}>SESSIONS</label><input type="number" value={form.sessions||0} onChange={e=>f("sessions",parseInt(e.target.value)||0)} style={inp}/></div><div><label style={lbl}>FREQ/WK</label><input type="number" value={form.freq||2} onChange={e=>f("freq",parseInt(e.target.value)||2)} style={inp}/></div><div><label style={lbl}>VALUE $</label><input type="number" value={form.value||0} onChange={e=>f("value",parseFloat(e.target.value)||0)} style={inp}/></div></div>
        <label style={lbl}>STATUS</label>
        <select value={form.status||"active"} onChange={e=>f("status",e.target.value)} style={{...inp,marginBottom:12}}>{["active","urgent","inactive"].map(s=><option key={s} value={s}>{s}</option>)}</select>
        <label style={lbl}>NOTES</label><textarea value={form.notes||""} onChange={e=>f("notes",e.target.value)} style={{...inp,height:70,resize:"none" as const}}/>
        <button onClick={()=>setView("maxes")} style={{width:"100%",background:"rgba(26,110,255,0.1)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:14,fontWeight:700}}>📊 Edit PRs & Maxes →</button>
      </div>
    </main>
  );

  if(view==="detail"&&sel){
    const s=SC[sel.status]||SC.active;
    const mx=Object.entries(sel.maxes||{}).filter(([,v])=>v);
    return(
      <main style={{minHeight:"100vh",background:"#000",paddingBottom:60,fontFamily:"system-ui"}}>
        <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{background:"transparent",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Roster</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiA(sel);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>⚡ AI</button>
            <button onClick={()=>{setForm({...sel});setView("edit");}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid #333",color:"#fff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>✏️</button>
          </div>
        </div>
        <div style={{padding:"20px 16px"}}>
          <div style={{background:s.bg,borderLeft:`4px solid ${s.c}`,border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"18px",marginBottom:14}}>
            <div style={{fontSize:24,fontWeight:900,marginBottom:4}}>{sel.name}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{sel.sport}{sel.position?` · ${sel.position}`:""}{sel.age?` · Age ${sel.age}`:""}{sel.weight?` · ${sel.weight}lbs`:""}</div>
            {sel.goal&&<div style={{fontSize:13,color:"#1a6eff",marginTop:6}}>🎯 {sel.goal}</div>}
            {sel.injuries&&<div style={{fontSize:12,color:"#ff4444",marginTop:4}}>⚠️ {sel.injuries}</div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:14}}>
              {[{l:"SESSIONS",v:sel.sessions},{l:"FREQ/WK",v:`${sel.freq}x`},{l:"VALUE",v:sel.value>0?`$${sel.value.toLocaleString()}`:"—"}].map((item,i)=>(<div key={i} style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"10px",textAlign:"center"}}><div style={{fontSize:17,fontWeight:900}}>{item.v}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginTop:2}}>{item.l}</div></div>))}
            </div>
          </div>
          <div style={{background:"rgba(26,110,255,0.06)",border:"1px solid rgba(26,110,255,0.2)",borderRadius:12,padding:"14px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#1a6eff"}}>📊 PRs & MAXES</div>
              <button onClick={()=>{setForm({...sel});setView("maxes");}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.3)",color:"#1a6eff",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>{mx.length>0?"UPDATE":"+ ADD MAXES"}</button>
            </div>
            {mx.length>0?(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{mx.map(([k,v]:any)=>(<div key={k} style={{background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:14,fontWeight:900,color:"#1a6eff"}}>{v}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.35)",textTransform:"uppercase" as const,marginTop:2}}>{({squat:"Squat",bench:"Bench",deadlift:"Deadlift",powerClean:"Power Clean",sprint40:"40 Yard",vertical:"Vertical",broadJump:"Broad Jump",agility:"Agility",pullups:"Pull-Ups",pushups:"Push-Ups",hangClean:"Hang Clean",customPR:"Custom PR"} as any)[k]||k}</div></div>))}</div>):(<div style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontStyle:"italic"}}>No maxes yet. Tap ADD MAXES — AI uses these for exact workout weights.</div>)}
          </div>
          <div style={{background:"rgba(0,208,132,0.04)",border:"1px solid rgba(0,208,132,0.15)",borderRadius:12,padding:"14px",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#00d084"}}>📈 PROGRESS LOG</div>
              <button onClick={()=>setView("progress")} style={{background:"rgba(0,208,132,0.1)",border:"1px solid rgba(0,208,132,0.25)",color:"#00d084",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>VIEW ALL ({sel.progressLog?.length||0})</button>
            </div>
            {sel.progressLog?.length>0?<div style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.5}}>{sel.progressLog[0].text}</div>:<div style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontStyle:"italic"}}>No notes yet.</div>}
          </div>
          <button onClick={()=>{setAiA(sel);setShowAI(true);}} style={{width:"100%",background:"linear-gradient(135deg,#1a6eff,#0d4fd4)",border:"none",color:"#fff",borderRadius:14,padding:"18px",cursor:"pointer",fontSize:16,fontWeight:900,marginBottom:10}}>
            ⚡ AI AGENT — All Skills for {sel.name.split(" ")[0]}
          </button>
          {(sel.parentName||sel.parentPhone)&&<div style={{background:"#111",border:"1px solid #222",borderRadius:12,padding:"14px",marginBottom:10}}>{sel.parentName&&<div style={{fontSize:14,fontWeight:700}}>{sel.parentName}</div>}{sel.parentPhone&&<div style={{fontSize:13,color:"#1a6eff",marginTop:2}}>{sel.parentPhone}</div>}</div>}
          {sel.notes&&<div style={{background:"#111",border:"1px solid #222",borderRadius:12,padding:"14px",fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.5}}>{sel.notes}</div>}
        </div>
        {showAI&&<AISheet athlete={aiA} onClose={()=>{setShowAI(false);setAiA(null);}}/>}
      </main>
    );
  }

  return(
    <main style={{minHeight:"100vh",background:"#000",paddingBottom:80,fontFamily:"system-ui"}}>
      <div style={{background:"rgba(0,0,0,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #222",padding:"14px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Link href="/coach/dashboard" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:20}}>←</Link>
            <div><div style={{fontSize:16,fontWeight:800}}>ATHLETE ROSTER</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{athletes.length} athletes{urgentCount>0?` · ${urgentCount} URGENT`:""}</div></div>
          </div>
          <button onClick={()=>{setAiA(shown[0]||athletes[0]||null);setShowAI(true);}} style={{background:"rgba(26,110,255,0.15)",border:"1px solid rgba(26,110,255,0.4)",color:"#1a6eff",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>⚡ AI</button>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search athlete..." style={{...inp,marginBottom:10}}/>
        <div style={{display:"flex",gap:8,overflowX:"auto"}}>
          {["all","urgent","active","inactive"].map(fv=>(<button key={fv} onClick={()=>setFilter(fv)} style={{padding:"5px 12px",borderRadius:100,background:filter===fv?"#1a6eff":"rgba(255,255,255,0.04)",border:`1px solid ${filter===fv?"#1a6eff":"#333"}`,color:filter===fv?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:"0.08em",cursor:"pointer",whiteSpace:"nowrap",textTransform:"uppercase" as const}}>{fv}</button>))}
        </div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {shown.map(a=>{
          const s=SC[a.status]||SC.active;
          const hasM=a.maxes&&Object.values(a.maxes).some((v:any)=>v);
          return(
            <div key={a.id} style={{background:"#111",border:"1px solid #222",borderLeft:`4px solid ${s.c}`,borderRadius:12,padding:"14px",marginBottom:8}}>
              <div onClick={()=>{setSel(a);setView("detail");}} style={{cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div><div style={{fontSize:16,fontWeight:700,marginBottom:2}}>{a.name}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{a.sport}{a.position?` · ${a.position}`:""} · {a.freq}x/wk · {a.sessions} sessions</div></div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",padding:"3px 8px",background:s.bg,color:s.c,borderRadius:4,textTransform:"uppercase" as const}}>{s.l}</div>
                </div>
              </div>
              {/* SAME BADGE + ⚡ AI PATTERN AS LUXURY JOBS */}
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {hasM&&<span style={{fontSize:10,background:"rgba(26,110,255,0.1)",borderRadius:6,padding:"2px 7px",color:"#1a6eff"}}>📊 Maxes</span>}
                {a.progressLog?.length>0&&<span style={{fontSize:10,background:"rgba(0,208,132,0.08)",borderRadius:6,padding:"2px 7px",color:"#00d084"}}>📈 {a.progressLog.length} logs</span>}
                <button onClick={e=>{e.stopPropagation();setAiA(a);setShowAI(true);}} style={{fontSize:10,background:"rgba(26,110,255,0.15)",borderRadius:100,padding:"3px 10px",color:"#1a6eff",fontWeight:700,border:"1px solid rgba(26,110,255,0.35)",cursor:"pointer",marginLeft:"auto"}}>⚡ AI</button>
              </div>
            </div>
          );
        })}
      </div>
      {showAI&&<AISheet athlete={aiA} onClose={()=>{setShowAI(false);setAiA(null);}}/>}
    </main>
  );
}

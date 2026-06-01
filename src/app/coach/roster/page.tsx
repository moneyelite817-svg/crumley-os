"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE = "ct_clients";

const BLANK_MAXES = {squat:"",bench:"",deadlift:"",powerClean:"",sprint40:"",vertical:"",broadJump:"",agility:"",pullups:"",pushups:"",hangClean:"",customPR:""};

const DEFAULT_ATHLETES = [
  {id:1,name:"Levi Smith",sport:"General",freq:2,sessions:1,value:378,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:2,name:"Donovan Edwards",sport:"General",freq:2,sessions:33,value:2835,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:3,name:"Travis Cheyne",sport:"General",freq:2,sessions:48,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:4,name:"Rex Hayes",sport:"General",freq:2,sessions:26,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:5,name:"Emiliano Ortiz",sport:"Football",freq:4,sessions:20,value:0,status:"inactive",notes:"Mom: Anna Ortiz",age:"",weight:"",position:"WR",goal:"",injuries:"",parentName:"Anna Ortiz",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:6,name:"Mateo Ortiz",sport:"Football",freq:4,sessions:20,value:0,status:"inactive",notes:"Brother of Emiliano",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:7,name:"Noah Langdon",sport:"General",freq:1,sessions:4,value:367,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:8,name:"Sam Stacy",sport:"General",freq:1,sessions:4,value:1575,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:9,name:"Cruz Mar",sport:"General",freq:1,sessions:13,value:1134,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:10,name:"Joaquin Chavez",sport:"General",freq:2,sessions:12,value:1071,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:11,name:"Lilianna Chavez",sport:"General",freq:2,sessions:12,value:1071,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:12,name:"Breelan",sport:"General",freq:2,sessions:8,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:13,name:"Granger",sport:"General",freq:2,sessions:8,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:14,name:"Cody Bevan",sport:"General",freq:1,sessions:1,value:0,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:15,name:"Joshua Chavis",sport:"General",freq:2,sessions:2,value:0,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:16,name:"Daniel Chapman",sport:"General",freq:2,sessions:2,value:0,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:17,name:"Axton Mondragon",sport:"General",freq:1,sessions:4,value:1575,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:18,name:"Aaliyah Jauregui",sport:"General",freq:2,sessions:2,value:0,status:"urgent",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:19,name:"Jaxson Bowling",sport:"General",freq:9,sessions:12,value:0,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:20,name:"Jacob Robledo",sport:"General",freq:1,sessions:3,value:210,status:"active",notes:"",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
  {id:21,name:"Quenton Jean",sport:"General",freq:2,sessions:0,value:0,status:"inactive",notes:"Contact Kevin (dad)",age:"",weight:"",position:"",goal:"",injuries:"",parentName:"Kevin Jean",parentPhone:"",maxes:{...BLANK_MAXES},progressLog:[]},
];

const SC: Record<string,{color:string;bg:string;label:string}> = {
  active:{color:"#1a6eff",bg:"rgba(26,110,255,0.1)",label:"ACTIVE"},
  urgent:{color:"#ff4444",bg:"rgba(255,68,68,0.1)",label:"URGENT"},
  inactive:{color:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)",label:"INACTIVE"},
};

const inp: any = { width:"100%", padding:"10px 12px", background:"#111", border:"1px solid #333", borderRadius:10, color:"#fff", fontFamily:"system-ui", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 };
const lbl: any = { display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase" as const, marginBottom:4 };

export default function RosterPage() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [view, setView] = useState<"list"|"detail"|"edit"|"maxes"|"progress">("list");
  const [sel, setSel] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newLog, setNewLog] = useState("");

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE);
      const loaded = s ? JSON.parse(s) : DEFAULT_ATHLETES;
      const normalized = loaded.map((a: any) => ({
        ...a,
        maxes: { ...BLANK_MAXES, ...(a.maxes || {}) },
        progressLog: a.progressLog || [],
        parentName: a.parentName || "",
        parentPhone: a.parentPhone || "",
      }));
      setAthletes(normalized);
    } catch { setAthletes(DEFAULT_ATHLETES); }
  }, []);

  function persist(data: any[]) {
    setAthletes(data);
    try { localStorage.setItem(STORAGE, JSON.stringify(data)); } catch {}
  }

  function f(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })); }
  function fm(k: string, v: any) { setForm((p: any) => ({ ...p, maxes: { ...p.maxes, [k]: v } })); }

  function saveEdit() {
    const updated = athletes.map(a => a.id === sel.id ? { ...a, ...form } : a);
    persist(updated);
    setSel({ ...sel, ...form });
    setView("detail");
  }

  function addProgressLog() {
    if (!newLog.trim() || !sel) return;
    const log = { text: newLog, date: new Date().toLocaleDateString(), ts: Date.now() };
    const updatedLogs = [log, ...(sel.progressLog || [])];
    const updated = athletes.map(a => a.id === sel.id ? { ...a, progressLog: updatedLogs } : a);
    persist(updated);
    setSel({ ...sel, progressLog: updatedLogs });
    setNewLog("");
  }

  const shown = athletes
    .filter(a => filter === "all" || a.status === filter)
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
  const urgent = athletes.filter(a => a.status === "urgent").length;

  // ── MAXES VIEW ──
  if (view === "maxes" && sel) return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:60, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={() => setView("detail")} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Back</button>
        <span style={{ fontSize:14, fontWeight:800, color:"#1a6eff" }}>📊 PRs & MAXES</span>
        <button onClick={saveEdit} style={{ background:"#1a6eff", border:"none", color:"#fff", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13, fontWeight:700 }}>SAVE</button>
      </div>
      <div style={{ padding:"20px 16px" }}>
        <div style={{ fontSize:18, fontWeight:900, marginBottom:4 }}>{sel.name}</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:18 }}>These feed directly into AI workout plans as exact weights and benchmarks</div>

        <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)", marginBottom:10 }}>💪 STRENGTH MAXES (lbs)</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
          {[{l:"Squat 1RM",k:"squat",p:"e.g. 225"},{l:"Bench 1RM",k:"bench",p:"e.g. 185"},{l:"Deadlift 1RM",k:"deadlift",p:"e.g. 275"},{l:"Power Clean",k:"powerClean",p:"e.g. 165"},{l:"Hang Clean",k:"hangClean",p:"e.g. 155"}].map(field => (
            <div key={field.k}>
              <label style={lbl}>{field.l}</label>
              <input value={form.maxes?.[field.k]||""} onChange={e=>fm(field.k,e.target.value)} placeholder={field.p} style={inp}/>
            </div>
          ))}
        </div>

        <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)", marginBottom:10 }}>⚡ SPEED & ATHLETICISM</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
          {[{l:"40-Yard Dash",k:"sprint40",p:"e.g. 4.72s"},{l:"Vertical Jump",k:"vertical",p:"e.g. 28 in"},{l:"Broad Jump",k:"broadJump",p:"e.g. 8ft 4in"},{l:"Pro Agility",k:"agility",p:"e.g. 4.35s"}].map(field => (
            <div key={field.k}>
              <label style={lbl}>{field.l}</label>
              <input value={form.maxes?.[field.k]||""} onChange={e=>fm(field.k,e.target.value)} placeholder={field.p} style={inp}/>
            </div>
          ))}
        </div>

        <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)", marginBottom:10 }}>🎯 BODYWEIGHT & CUSTOM</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[{l:"Pull-Ups Max",k:"pullups",p:"e.g. 12"},{l:"Push-Ups Max",k:"pushups",p:"e.g. 35"},{l:"Custom PR",k:"customPR",p:"Any other PR"}].map(field => (
            <div key={field.k}>
              <label style={lbl}>{field.l}</label>
              <input value={form.maxes?.[field.k]||""} onChange={e=>fm(field.k,e.target.value)} placeholder={field.p} style={inp}/>
            </div>
          ))}
        </div>

        <div style={{ marginTop:16, background:"rgba(26,110,255,0.06)", border:"1px solid rgba(26,110,255,0.2)", borderRadius:12, padding:"12px", fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
          💡 The AI uses these to prescribe exact weights (e.g. "3x5 at 185 lbs = 80% of your squat max"). Fill in what you have — even partial data helps.
        </div>
      </div>
    </main>
  );

  // ── PROGRESS LOG ──
  if (view === "progress" && sel) return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:60, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={() => setView("detail")} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Back</button>
        <span style={{ fontSize:14, fontWeight:800, color:"#00d084" }}>📈 PROGRESS LOG</span>
        <div style={{ width:60 }}/>
      </div>
      <div style={{ padding:"20px 16px" }}>
        <div style={{ fontSize:18, fontWeight:900, marginBottom:16 }}>{sel.name}</div>
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <input value={newLog} onChange={e=>setNewLog(e.target.value)} placeholder="Add progress note..." style={{...inp,flex:1,marginBottom:0}}/>
          <button onClick={addProgressLog} style={{ background:"#00d084", border:"none", color:"#000", borderRadius:10, padding:"0 16px", cursor:"pointer", fontWeight:900, fontSize:13 }}>ADD</button>
        </div>
        {(!sel.progressLog || sel.progressLog.length === 0) && (
          <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.25)", fontSize:13 }}>No progress notes yet.</div>
        )}
        {sel.progressLog?.map((log: any, i: number) => (
          <div key={i} style={{ background:"#111", border:"1px solid #222", borderRadius:12, padding:"14px", marginBottom:8 }}>
            <div style={{ fontSize:13, color:"#fff", lineHeight:1.5, marginBottom:4 }}>{log.text}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)" }}>{log.date}</div>
          </div>
        ))}
      </div>
    </main>
  );

  // ── EDIT VIEW ──
  if (view === "edit" && sel) return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:60, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={()=>{setView("detail");setForm({});}} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Cancel</button>
        <span style={{ fontSize:14, fontWeight:800 }}>EDIT ATHLETE</span>
        <button onClick={saveEdit} style={{ background:"#1a6eff", border:"none", color:"#fff", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13, fontWeight:700 }}>SAVE</button>
      </div>
      <div style={{ padding:"20px 16px" }}>
        {[{l:"Name",k:"name"},{l:"Sport",k:"sport"},{l:"Position",k:"position"},{l:"Goal",k:"goal"},{l:"Injuries / Limitations",k:"injuries"}].map(field=>(
          <div key={field.k}><label style={lbl}>{field.l}</label><input value={form[field.k]||""} onChange={e=>f(field.k,e.target.value)} style={inp}/></div>
        ))}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div><label style={lbl}>AGE</label><input value={form.age||""} onChange={e=>f("age",e.target.value)} style={inp}/></div>
          <div><label style={lbl}>WEIGHT (lbs)</label><input value={form.weight||""} onChange={e=>f("weight",e.target.value)} style={inp}/></div>
        </div>
        <label style={lbl}>PARENT NAME</label><input value={form.parentName||""} onChange={e=>f("parentName",e.target.value)} style={inp}/>
        <label style={lbl}>PARENT PHONE</label><input value={form.parentPhone||""} onChange={e=>f("parentPhone",e.target.value)} style={inp}/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          <div><label style={lbl}>SESSIONS</label><input type="number" value={form.sessions||0} onChange={e=>f("sessions",parseInt(e.target.value)||0)} style={inp}/></div>
          <div><label style={lbl}>FREQ/WK</label><input type="number" value={form.freq||2} onChange={e=>f("freq",parseInt(e.target.value)||2)} style={inp}/></div>
          <div><label style={lbl}>VALUE $</label><input type="number" value={form.value||0} onChange={e=>f("value",parseFloat(e.target.value)||0)} style={inp}/></div>
        </div>
        <label style={lbl}>STATUS</label>
        <select value={form.status||"active"} onChange={e=>f("status",e.target.value)} style={{...inp,marginBottom:12}}>
          {["active","urgent","inactive"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <label style={lbl}>NOTES</label>
        <textarea value={form.notes||""} onChange={e=>f("notes",e.target.value)} style={{...inp,height:70,resize:"none"}}/>
        <button onClick={()=>setView("maxes")} style={{ width:"100%", background:"rgba(26,110,255,0.1)", border:"1px solid rgba(26,110,255,0.3)", color:"#1a6eff", borderRadius:12, padding:"14px", cursor:"pointer", fontSize:14, fontWeight:700, marginTop:6 }}>
          📊 Edit PRs & Maxes →
        </button>
      </div>
    </main>
  );

  // ── DETAIL VIEW ──
  if (view === "detail" && sel) {
    const s = SC[sel.status] || SC.active;
    const maxEntries = Object.entries(sel.maxes || {}).filter(([,v]) => v);
    return (
      <main style={{ minHeight:"100vh", background:"#000", paddingBottom:60, fontFamily:"system-ui" }}>
        <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Roster</button>
          <button onClick={()=>{setForm({...sel});setView("edit");}} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid #333", color:"#fff", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:13 }}>✏️ Edit</button>
        </div>
        <div style={{ padding:"20px 16px" }}>
          <div style={{ background:s.bg, borderLeft:`4px solid ${s.color}`, border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"18px", marginBottom:14 }}>
            <div style={{ fontSize:24, fontWeight:900, marginBottom:4 }}>{sel.name}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>
              {sel.sport}{sel.position?` · ${sel.position}`:""}{sel.age?` · Age ${sel.age}`:""}{sel.weight?` · ${sel.weight}lbs`:""}
            </div>
            {sel.goal && <div style={{ fontSize:13, color:"#1a6eff", marginTop:6 }}>🎯 {sel.goal}</div>}
            {sel.injuries && <div style={{ fontSize:12, color:"#ff4444", marginTop:4 }}>⚠️ {sel.injuries}</div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:14 }}>
              {[{l:"SESSIONS",v:sel.sessions},{l:"FREQ/WK",v:`${sel.freq}x`},{l:"VALUE",v:sel.value>0?`$${sel.value.toLocaleString()}`:"—"}].map((item,i)=>(
                <div key={i} style={{ background:"rgba(255,255,255,0.06)", borderRadius:8, padding:"10px", textAlign:"center" }}>
                  <div style={{ fontSize:17, fontWeight:900 }}>{item.v}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", marginTop:2 }}>{item.l}</div>
                </div>
              ))}
            </div>
          </div>

          {(sel.parentName || sel.parentPhone) && (
            <div style={{ background:"#111", border:"1px solid #222", borderRadius:12, padding:"14px", marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.3)", marginBottom:6 }}>PARENT / CONTACT</div>
              {sel.parentName && <div style={{ fontSize:14, fontWeight:700 }}>{sel.parentName}</div>}
              {sel.parentPhone && <div style={{ fontSize:13, color:"#1a6eff", marginTop:2 }}>{sel.parentPhone}</div>}
            </div>
          )}

          {/* PRs & Maxes section */}
          <div style={{ background:"rgba(26,110,255,0.06)", border:"1px solid rgba(26,110,255,0.2)", borderRadius:12, padding:"16px", marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:"#1a6eff" }}>📊 PRs & MAXES</div>
              <button onClick={()=>{setForm({...sel});setView("maxes");}} style={{ background:"rgba(26,110,255,0.15)", border:"1px solid rgba(26,110,255,0.3)", color:"#1a6eff", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:11, fontWeight:700 }}>
                {maxEntries.length > 0 ? "UPDATE" : "+ ADD MAXES"}
              </button>
            </div>
            {maxEntries.length > 0 ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {maxEntries.map(([k, v]: any) => (
                  <div key={k} style={{ background:"rgba(255,255,255,0.05)", borderRadius:8, padding:"8px 10px" }}>
                    <div style={{ fontSize:15, fontWeight:900, color:"#1a6eff" }}>{v}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:2 }}>
                      {({squat:"Squat",bench:"Bench",deadlift:"Deadlift",powerClean:"Power Clean",sprint40:"40 Yard",vertical:"Vertical",broadJump:"Broad Jump",agility:"Pro Agility",pullups:"Pull-Ups",pushups:"Push-Ups",hangClean:"Hang Clean",customPR:"Custom PR"} as any)[k] || k}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontStyle:"italic" }}>No maxes recorded. Tap ADD MAXES — the AI uses these for exact weights in workout plans.</div>
            )}
          </div>

          {/* Progress Log */}
          <div style={{ background:"rgba(0,208,132,0.04)", border:"1px solid rgba(0,208,132,0.15)", borderRadius:12, padding:"16px", marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:"#00d084" }}>📈 PROGRESS LOG</div>
              <button onClick={()=>setView("progress")} style={{ background:"rgba(0,208,132,0.1)", border:"1px solid rgba(0,208,132,0.25)", color:"#00d084", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:11, fontWeight:700 }}>
                VIEW ALL ({sel.progressLog?.length || 0})
              </button>
            </div>
            {sel.progressLog?.length > 0 ? (
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>{sel.progressLog[0].text}<div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:4 }}>{sel.progressLog[0].date}</div></div>
            ) : (
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontStyle:"italic" }}>No progress notes yet. Tap VIEW ALL to add one.</div>
            )}
          </div>

          <Link href="/coach/agent" style={{ display:"block", textDecoration:"none" }}>
            <div style={{ background:"#1a6eff", borderRadius:12, padding:"16px", textAlign:"center", fontSize:15, fontWeight:900, color:"#fff", marginBottom:10 }}>
              ⚡ AI AGENT — 35 Skills for {sel.name.split(" ")[0]}
            </div>
          </Link>

          {sel.notes && <div style={{ background:"#111", border:"1px solid #222", borderRadius:12, padding:"14px", fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.5, marginTop:4 }}>{sel.notes}</div>}
        </div>
      </main>
    );
  }

  // ── LIST VIEW ──
  return (
    <main style={{ minHeight:"100vh", background:"#000", paddingBottom:80, fontFamily:"system-ui" }}>
      <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid #222", padding:"14px 16px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Link href="/coach/dashboard" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"none", fontSize:20 }}>←</Link>
            <div>
              <div style={{ fontSize:16, fontWeight:800 }}>ATHLETE ROSTER</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{athletes.length} athletes{urgent > 0 ? ` · ${urgent} URGENT` : ""}</div>
            </div>
          </div>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search athlete..." style={{...inp,marginBottom:10}}/>
        <div style={{ display:"flex", gap:8 }}>
          {["all","urgent","active","inactive"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:"5px 12px", borderRadius:100, background:filter===f?"#1a6eff":"rgba(255,255,255,0.04)", border:`1px solid ${filter===f?"#1a6eff":"#333"}`, color:filter===f?"#fff":"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, letterSpacing:"0.08em", cursor:"pointer", whiteSpace:"nowrap", textTransform:"uppercase" }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:"14px 16px" }}>
        {shown.map(a => {
          const s = SC[a.status] || SC.active;
          const hasMaxes = a.maxes && Object.values(a.maxes).some((v: any) => v);
          return (
            <div key={a.id} onClick={()=>{setSel(a);setView("detail");}} style={{ background:"#111", border:"1px solid #222", borderLeft:`4px solid ${s.color}`, borderRadius:12, padding:"14px", marginBottom:8, cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, marginBottom:2 }}>{a.name}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{a.sport}{a.position?` · ${a.position}`:""} · {a.freq}x/wk · {a.sessions} sessions</div>
                </div>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", padding:"3px 8px", background:s.bg, color:s.color, borderRadius:4, textTransform:"uppercase" }}>{s.label}</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {hasMaxes && <span style={{ fontSize:10, background:"rgba(26,110,255,0.1)", borderRadius:6, padding:"2px 7px", color:"#1a6eff" }}>📊 Has Maxes</span>}
                {a.progressLog?.length > 0 && <span style={{ fontSize:10, background:"rgba(0,208,132,0.08)", borderRadius:6, padding:"2px 7px", color:"#00d084" }}>📈 {a.progressLog.length} logs</span>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

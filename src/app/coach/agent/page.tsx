"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE = "ct_clients";

// ══════════════════════════════════════════════════════
// SKILL CATEGORIES
// ══════════════════════════════════════════════════════
const CATEGORIES = [
  { id: "training",  label: "🏋️ Training",      color: "#1a6eff" },
  { id: "comms",     label: "💬 Communication",  color: "#00d084" },
  { id: "assess",    label: "📊 Assessment",     color: "#f0c040" },
  { id: "content",   label: "📱 Content",        color: "#9b59b6" },
  { id: "business",  label: "💰 Business",       color: "#e74c3c" },
  { id: "strategy",  label: "🎯 Strategy",       color: "#f39c12" },
];

const SKILLS: Record<string, any[]> = {
  training: [
    { id: "workout",    icon: "🏋️", label: "Full Session Plan",        desc: "Complete 60-min workout with exact weights from maxes" },
    { id: "speed",      icon: "⚡", label: "Speed & Agility Session",  desc: "Dedicated speed, agility and footwork training block" },
    { id: "strength",   icon: "💪", label: "Strength Block",           desc: "Heavy compound movement focus with DB progressions" },
    { id: "warmup",     icon: "🔥", label: "Dynamic Warm-Up Routine",  desc: "Sport-specific activation and movement prep" },
    { id: "conditioning",icon:"🫁", label: "Conditioning Circuit",     desc: "High-intensity conditioning finisher" },
    { id: "recovery",   icon: "🧊", label: "Recovery Protocol",        desc: "Active recovery session for sore or injured athlete" },
    { id: "compPrep",   icon: "🏆", label: "Competition Prep Plan",    desc: "Peak performance plan before game or combine" },
    { id: "program",    icon: "📋", label: "4-Week Program",           desc: "Full monthly training block with progression" },
  ],
  comms: [
    { id: "parentUpdate",  icon: "👨‍👩‍👦", label: "Parent Progress Update", desc: "Professional progress text to parent" },
    { id: "athleteCheckIn",icon: "👋",    label: "Athlete Check-In",        desc: "Direct message to athlete to keep them engaged" },
    { id: "renewal",       icon: "💰",    label: "Renewal Pitch",           desc: "Re-sign athlete before sessions run out" },
    { id: "reEngage",      icon: "🔁",    label: "Re-Engage Inactive",      desc: "Bring back an athlete who has gone quiet" },
    { id: "milestone",     icon: "🎉",    label: "Milestone Celebration",   desc: "Celebrate a PR, achievement, or breakthrough" },
    { id: "teamAnnounce",  icon: "📢",    label: "Team Announcement",       desc: "Announcement to send to all athletes or parents" },
    { id: "sessionRecap",  icon: "📝",    label: "Session Recap",           desc: "Post-session summary to send to parent" },
  ],
  assess: [
    { id: "progressReport",icon: "📈", label: "Progress Report",        desc: "Detailed 4-week development summary" },
    { id: "prSummary",     icon: "🏅", label: "PR Summary",             desc: "Highlight all recent personal records" },
    { id: "devAnalysis",   icon: "🔬", label: "Development Analysis",   desc: "Honest assessment of strengths and gaps" },
    { id: "combineReady",  icon: "🎯", label: "Combine Readiness",      desc: "Where athlete stands vs D1/D2 combine standards" },
    { id: "injuryPlan",    icon: "🩹", label: "Injury Modification",    desc: "Training plan that works around current injury" },
  ],
  content: [
    { id: "instaAthlete",  icon: "📸", label: "Athlete Spotlight Post", desc: "Instagram feature on this athlete's journey" },
    { id: "instaPR",       icon: "🏆", label: "PR Celebration Post",    desc: "Post celebrating a new personal record" },
    { id: "programPromo",  icon: "📣", label: "Program Promo Post",     desc: "Promote Elite Skillz Lab training program" },
    { id: "motivational",  icon: "🔥", label: "Motivational Post",      desc: "Fire coaching content for D1 brand" },
    { id: "d1Brand",       icon: "💎", label: "D1 Brand Content",       desc: "Content positioning Elite Skillz Lab as elite" },
  ],
  business: [
    { id: "packageRec",    icon: "📦", label: "Package Recommendation", desc: "Best training package for this athlete's goals" },
    { id: "upsell",        icon: "📈", label: "Upsell Message",         desc: "Pitch additional sessions or higher frequency" },
    { id: "referralAsk",   icon: "🤝", label: "Referral Request",       desc: "Ask athlete or parent to refer another athlete" },
    { id: "d1Pitch",       icon: "🏫", label: "D1 Class Pitch",         desc: "Get athlete into D1 group class schedule" },
    { id: "weeklyGoal",    icon: "💵", label: "Revenue Goal Check-In",  desc: "Track progress toward $800/week coaching goal" },
  ],
  strategy: [
    { id: "weekPlan",      icon: "📅", label: "Weekly Training Priority", desc: "This week's focus across all athletes" },
    { id: "athletePlan",   icon: "🗺", label: "Athlete Development Plan", desc: "6-month roadmap for this athlete's goals" },
    { id: "d1Positioning", icon: "🎓", label: "D1 College Positioning",   desc: "What athlete needs to reach D1 level" },
    { id: "offseasonPlan", icon: "☀️", label: "Offseason Training Plan",  desc: "Maximize development during school break" },
    { id: "coachingTip",   icon: "💡", label: "Coaching Tip / Drill",     desc: "Sport-specific drill or technique cue" },
  ],
};

// ══════════════════════════════════════════════════════
// PROMPT BUILDER
// ══════════════════════════════════════════════════════
function buildPrompt(athlete: any, skillId: string, extra: string): string {
  const maxList = Object.entries(athlete?.maxes || {})
    .filter(([, v]) => v)
    .map(([k, v]) => {
      const n: Record<string, string> = { squat:"Squat 1RM", bench:"Bench 1RM", deadlift:"Deadlift 1RM", powerClean:"Power Clean", sprint40:"40-yard dash", vertical:"Vertical jump", broadJump:"Broad jump", agility:"Pro Agility (5-10-5)", pullups:"Pull-ups max", pushups:"Push-ups max", hangClean:"Hang Clean", customPR:"Custom PR" };
      return `${n[k] || k}: ${v}`;
    }).join(" | ");

  const ctx = `
COACH: Coach T (Terrance Crumley) — Head Trainer, Elite Skillz Lab 🧪, D1 Training Hulen Fort Worth TX
EQUIPMENT: Dumbbells and resistance bands ONLY. No barbells, no machines, no squat rack.
SESSION LENGTH: Exactly 60 minutes
ATHLETE: ${athlete?.name || "Athlete"}
Sport: ${athlete?.sport || "General Athletics"}
Position: ${athlete?.position || "N/A"}
Age: ${athlete?.age || "Unknown"}
Weight: ${athlete?.weight ? athlete.weight + " lbs" : "Unknown"}
Goal: ${athlete?.goal || "Athletic development and performance"}
Injuries/Limitations: ${athlete?.injuries || "None"}
Sessions remaining in package: ${athlete?.sessions || "Unknown"}
Training frequency: ${athlete?.freq || 2}x per week
Recorded PRs/Maxes: ${maxList || "Not yet recorded — use beginner/intermediate weights"}
Parent: ${athlete?.parentName || "N/A"}
Notes: ${athlete?.notes || "None"}
${extra ? `\nAdditional context: ${extra}` : ""}`.trim();

  // ── TRAINING PROMPTS ──
  if (skillId === "workout") return `${ctx}

Generate a COMPLETE, DETAILED 60-minute D1 Training session. Use DUMBBELLS AND RESISTANCE BANDS ONLY.

WEIGHT PRESCRIPTION RULES:
- If maxes are recorded: Use percentages (Activation = 40-50%, Power = 60-70%, Strength = 70-85%, Conditioning = 50-60%)
- Example: Squat max 225 lbs → Goblet squat use 45-50 lb DBs (heavy compound movement)
- If no maxes: Use RPE (Rate of Perceived Exertion) scale — prescribe specific DB weights based on bodyweight and sport
- Always give a specific weight range, never say "appropriate weight"

FORMAT (use exactly this):

**${(athlete?.name || "ATHLETE").split(" ")[0].toUpperCase()} — SESSION PLAN**
📅 ${new Date().toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric" })} | ⏱ 60 Min | 🏋️ DB + Bands

━━━ ⚡ ACTIVATION (5 min) ━━━
1. [Exercise] — [reps] — [coaching cue]
2. [Exercise] — [reps] — [coaching cue]
3. [Exercise] — [reps] — [coaching cue]

━━━ 💥 POWER BLOCK (12 min) ━━━
1. [Exercise] — [sets]x[reps] @ [specific weight] — [cue]
   Rest: [seconds]
2. [Exercise] — [sets]x[reps] @ [specific weight] — [cue]
   Rest: [seconds]

━━━ 💪 STRENGTH BLOCK A (12 min) ━━━
A1. [Exercise] — [sets]x[reps] @ [weight] — [cue]
A2. [Exercise] — [sets]x[reps] @ [weight] — [cue]
Rest: 90 sec between rounds | [X] rounds

━━━ 💪 STRENGTH BLOCK B (10 min) ━━━
B1. [Exercise] — [sets]x[reps] @ [weight] — [cue]
B2. [Exercise] — [sets]x[reps] @ [weight] — [cue]
Rest: 60 sec | [X] rounds

━━━ 🔥 CONDITIONING (15 min) ━━━
Circuit: [X] rounds | [X] sec on / [X] sec rest
1. [Exercise]
2. [Exercise]
3. [Exercise]
4. [Exercise]
5. [Exercise]

━━━ 🧊 COOLDOWN (6 min) ━━━
1. [Stretch/mobility — hold time]
2. [Stretch/mobility — hold time]
3. [Stretch/mobility — hold time]

━━━ 🎯 COACH T CUE ━━━
[One powerful, specific coaching note for THIS athlete]

━━━ 📅 NEXT SESSION FOCUS ━━━
[What to build on or test next session]`;

  if (skillId === "speed") return `${ctx}

Design a 60-minute SPEED, AGILITY & FOOTWORK training session. DB and bands only. Sport-specific to ${athlete?.sport || "general athletics"}.

Include:
- Movement prep (skip, A-march, B-skip, hip openers)
- Acceleration work (first-step explosiveness)
- Change of direction drills
- Sport-specific footwork patterns
- Resistance band speed drills
- Conditioning finisher

Prescribe EXACT cone distances, rep counts, rest periods, and band resistance levels. Format like a real speed coach's practice plan.`;

  if (skillId === "strength") return `${ctx}

Build a STRENGTH-FOCUSED 60-minute session using dumbbells and resistance bands ONLY. Emphasize compound movements and progressive overload.

${maxList ? `Use these maxes to prescribe exact DB weights: ${maxList}` : "Use bodyweight and RPE for weight prescription."}

Include: push, pull, hinge, squat, carry, and core patterns. Give exact weights, sets, reps, and rest periods. Explain the strength adaptation goal for each block.`;

  if (skillId === "warmup") return `${ctx}

Design a complete 10-15 minute DYNAMIC WARM-UP specifically for ${athlete?.sport || "an athlete"} at the position of ${athlete?.position || "athlete"}. No equipment needed for warm-up.

Include: foam rolling cues, joint mobilization, dynamic stretching, neural activation, and sport-specific movement patterns. Give exact reps and coaching cues for each movement. This should prime the CNS for explosive performance.`;

  if (skillId === "conditioning") return `${ctx}

Design a brutal but smart 15-20 minute CONDITIONING CIRCUIT using only dumbbells and resistance bands. Build work capacity and mental toughness.

Include: work:rest ratios, DB weights, band tensions, total rounds, and a coach's challenge at the end. Make it sport-specific to ${athlete?.sport || "athletics"}. Explain the energy system being trained.`;

  if (skillId === "recovery") return `${ctx}

Design a 45-60 minute ACTIVE RECOVERY session for an athlete who is sore/fatigued. Low intensity, movement-based, focused on blood flow and mobility.

Include: breathing protocol, foam rolling sequence, mobility flows, light band work, and mental reset exercise. No heavy lifting. Coach T would use this the day after a tough training block.`;

  if (skillId === "compPrep") return `${ctx}

Create a COMPETITION/COMBINE PREP plan for the 5 days leading up to a game or combine. 

Include: Day-by-day schedule (what to do each day), taper strategy, activation work, mental prep, nutrition reminders, and a pre-game morning routine. Make this feel like elite sports performance prep.`;

  if (skillId === "program") return `${ctx}

Design a complete 4-WEEK TRAINING PROGRAM using dumbbells and resistance bands only. Each week builds on the last.

Structure:
- Week 1: Foundations (higher reps, moderate weight)
- Week 2: Volume (more sets, same weight)
- Week 3: Intensity (fewer reps, heavier weight)
- Week 4: Peak/Test (test maxes, game-speed work)

Give weekly themes, main lifts, and key benchmarks to track. Include expected gains at the end of 4 weeks.`;

  // ── COMMUNICATION PROMPTS ──
  if (skillId === "parentUpdate") return `${ctx}\n\nWrite a professional, warm parent progress update text to ${athlete?.parentName || "the parent"} about ${athlete?.name || "their athlete"}. Include: 1 strength win, 1 movement improvement, 1 character note, and next training focus. Sound like a coach who genuinely invests in this athlete. Specific, not generic. Under 6 sentences.`;

  if (skillId === "athleteCheckIn") return `${ctx}\n\nWrite a direct, motivating check-in text FROM Coach T TO ${athlete?.name?.split(" ")[0] || "the athlete"} directly. Keep them engaged between sessions. Reference their sport or goal. Sound like a real coach who believes in them. Under 3 sentences. Casual but intentional.`;

  if (skillId === "renewal") return `${ctx}\n\n${athlete?.sessions} sessions remaining. Write a confident renewal pitch to ${athlete?.parentName || "the parent/athlete"}. Reference their specific progress. Make renewing feel like the obvious next move. Not salesy — coachly. Under 5 sentences.`;

  if (skillId === "reEngage") return `${ctx}\n\nThis athlete has been inactive. Write a warm, genuine re-engagement message to ${athlete?.parentName || "the parent/athlete"}. Sound like a coach who actually noticed they were missing. Reference their goals. End with an easy question about availability. Under 4 sentences.`;

  if (skillId === "milestone") return `${ctx}\n\nThis athlete just hit a major milestone or PR. Write a celebration message to ${athlete?.parentName || "the parent/athlete"}. Be specific, enthusiastic, and build momentum for what's next. Make them feel proud. Under 4 sentences.`;

  if (skillId === "teamAnnounce") return `${ctx}\n\nWrite a team-wide announcement from Coach T at Elite Skillz Lab 🧪. Could be for an upcoming training block, a schedule change, a team milestone, or a motivational push. Context: ${extra || "General team announcement"}. Professional, energetic, coach voice. Under 5 sentences.`;

  if (skillId === "sessionRecap") return `${ctx}\n\nWrite a session recap text to ${athlete?.parentName || "the parent"} after today's training with ${athlete?.name?.split(" ")[0] || "their athlete"}. Include: what was worked on, what stood out (positive), and one thing to focus on before next session. Under 4 sentences. Sounds like you were paying attention.`;

  // ── ASSESSMENT PROMPTS ──
  if (skillId === "progressReport") return `${ctx}\n\nWrite a detailed 4-week progress report for ${athlete?.name || "the athlete"}. Cover: strength development, speed/athleticism changes, mental/attitude notes, areas of improvement, and areas still needing work. Be honest and specific. ${maxList ? `Known benchmarks: ${maxList}` : ""} Professional enough to share with a parent or school coach.`;

  if (skillId === "prSummary") return `${ctx}\n\nCreate a PR Summary for ${athlete?.name || "the athlete"} based on their recorded maxes: ${maxList || "Not yet recorded"}. Compare each to age/position standards. Identify the 2 strongest areas and the 2 biggest gaps. Give a simple score out of 10 for overall athletic development. Under 8 sentences total.`;

  if (skillId === "devAnalysis") return `${ctx}\n\nWrite an honest, professional development analysis of ${athlete?.name || "this athlete"}. What is their current athletic level? What are their top 2 strengths? What are their 2 biggest limiters? What is the #1 thing that would most improve their performance in the next 90 days? Sound like a pro scout, not a cheerleader.`;

  if (skillId === "combineReady") return `${ctx}\n\nEvaluate ${athlete?.name || "this athlete"}'s combine readiness for ${athlete?.sport || "their sport"} at the ${athlete?.position || "their position"} position. Use their known maxes: ${maxList || "Not recorded yet"}. Compare vs D1, D2, and D3 standards. What is their current level? What specifically do they need to reach the next tier? Be honest and give a realistic timeline.`;

  if (skillId === "injuryPlan") return `${ctx}\n\nDesign a modified training plan that works AROUND the current injury/limitation: ${athlete?.injuries || extra || "describe injury"}. Still use dumbbells and bands only. Maintain fitness and strength where possible. Include what to avoid, what to modify, and what can actually be improved during recovery. Sound like a certified strength coach.`;

  // ── CONTENT PROMPTS ──
  if (skillId === "instaAthlete") return `${ctx}\n\nWrite an Instagram caption spotlighting ${athlete?.name?.split(" ")[0] || "one of our athletes"}'s development journey. Do NOT use their real last name. Reference their sport (${athlete?.sport || "athletics"}), their grind, and their improvement. Coach T perspective — proud, authentic, intentional. Under 8 sentences. End with 5 hashtags: #EliteSkillzLab #D1Training #DFWAthletes and 2 more sport-specific.`;

  if (skillId === "instaPR") return `${ctx}\n\nWrite an Instagram PR celebration post. An athlete (don't use last name) just hit a new personal record. Hype the achievement, talk about the work behind it, inspire other athletes watching. Fire energy. Under 6 sentences. 5 hashtags.`;

  if (skillId === "programPromo") return `${ctx}\n\nWrite an Instagram promo post for Elite Skillz Lab 🧪 at D1 Training Hulen Fort Worth. Pitch the training program to parents and athletes in DFW. Mention: D1 facility, Coach T's expertise, real athlete results, limited spots. Professional but hype. Include a CTA. Under 8 sentences. 5 hashtags.`;

  if (skillId === "motivational") return `${ctx}\n\nWrite a fire motivational Instagram/social post from Coach T. Theme: ${extra || "elite mindset, outwork everyone, the grind is the way"}. Short, powerful, hits like a real coach who trains champions. Not generic. Elite Skillz Lab voice. Under 5 sentences. 4 hashtags.`;

  if (skillId === "d1Brand") return `${ctx}\n\nWrite premium brand-positioning content for Elite Skillz Lab 🧪. Position it as the premier DFW athlete development program. Show what makes it elite — the coach, the facility, the athletes, the results. Could be a caption, a bio update, or a brand statement. Professional and aspirational.`;

  // ── BUSINESS PROMPTS ──
  if (skillId === "packageRec") return `${ctx}\n\nRecommend the best training package for ${athlete?.name || "this athlete"} based on their goals (${athlete?.goal || "general development"}), current frequency (${athlete?.freq || 2}x/week), and sport (${athlete?.sport || "general"}). Coach T offers sessions at $25/hr. Give a specific package recommendation with rationale and expected outcomes. Sound like a professional advisor.`;

  if (skillId === "upsell") return `${ctx}\n\nWrite an upsell message to ${athlete?.parentName || "the parent/athlete"} pitching more sessions per week or a larger package. Frame it around athletic development goals, not money. Show what's possible with more time. Confident, not pushy. Under 4 sentences.`;

  if (skillId === "referralAsk") return `${ctx}\n\nWrite a text asking ${athlete?.parentName || "the parent/athlete"} to refer another athlete to Elite Skillz Lab 🧪. Make it feel natural and easy. Reference their positive experience. Mention Coach T has limited spots available. Under 3 sentences.`;

  if (skillId === "d1Pitch") return `${ctx}\n\nWrite a pitch to get ${athlete?.name?.split(" ")[0] || "this athlete"} into the D1 Training group classes (Tue/Wed 5:45-7:45 PM) in addition to or instead of private sessions. Frame it as a competitive environment that will push their development. Reference the other athletes training there. Under 4 sentences.`;

  if (skillId === "weeklyGoal") return `You are Coach T's business brain at Elite Skillz Lab 🧪. Coach T's goal is $800/week from D1 Training and private coaching. He earns $25/hr base + 10% commission on packages.\n\nAnalyze the current athlete roster and give a specific revenue action plan for THIS week. What sessions are locked? What renewals are needed? What's the gap to $800? What's the #1 money move today? Be direct like a COO.`;

  // ── STRATEGY PROMPTS ──
  if (skillId === "weekPlan") return `${ctx}\n\nCreate a comprehensive weekly training priority plan for ALL athletes at Elite Skillz Lab 🧪 this week. D1 locked: Tue/Wed 5:45-7:45 PM. Consider: who has urgent renewals, who needs the most development attention, what sport seasons are upcoming, recovery needs. Format as a daily priority list Mon-Fri. Coach T COO-level planning.`;

  if (skillId === "athletePlan") return `${ctx}\n\nCreate a detailed 6-MONTH ATHLETE DEVELOPMENT ROADMAP for ${athlete?.name || "this athlete"} aimed at reaching their goal: ${athlete?.goal || "becoming a college-level athlete"}. Include: monthly milestones, key benchmarks to hit, training phase progression, and what success looks like at 3 months and 6 months. Make this feel like something you'd present to the athlete and family.`;

  if (skillId === "d1Positioning") return `${ctx}\n\nAnalyze what ${athlete?.name || "this athlete"} needs to realistically reach a D1 college program at ${athlete?.position || "their position"} in ${athlete?.sport || "their sport"}. Current maxes: ${maxList || "not recorded"}. Be brutally honest. What are the 3 biggest things standing between them and D1? What is the minimum performance threshold they need to hit? What's a realistic timeline? This is the truth they need to hear.`;

  if (skillId === "offseasonPlan") return `${ctx}\n\nDesign a complete OFFSEASON TRAINING PLAN for ${athlete?.name || "this athlete"} during school break. Maximize development when there's more time to train. Include: weekly schedule, training blocks, benchmarks, and a performance goal to hit by the end of offseason. Make this aggressive but sustainable.`;

  if (skillId === "coachingTip") return `${ctx}\n\nGive Coach T a specific, advanced coaching tip or drill for ${athlete?.sport || "general athletics"} at the ${athlete?.position || "athlete"} position. Something that directly addresses their goal: ${athlete?.goal || "athletic development"}. Include: drill name, setup, reps/sets, coaching cue, and what athletic quality it develops. Make it something Coach T can run tomorrow.`;

  return `${ctx}\n\nHelp Coach T with this skill: ${skillId}. ${extra}`;
}

// ══════════════════════════════════════════════════════
// MINI AI PANEL (for roster/other pages to import)
// ══════════════════════════════════════════════════════
function MiniAIPanel({ athlete, onClose }: { athlete: any; onClose: () => void }) {
  const [cat, setCat] = useState("training");
  const [skill, setSkill] = useState<string | null>(null);
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const catColor = CATEGORIES.find(c => c.id === cat)?.color || "#1a6eff";
  const catSkills = SKILLS[cat] || [];
  const currentSkill = catSkills.find(s => s.id === skill);

  async function generate() {
    if (!skill) return;
    setLoading(true); setResult(""); setError("");
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: buildPrompt(athlete, skill, extra) }) });
      const data = await res.json();
      if (data.error) setError(data.message || data.error);
      else setResult(data.text);
    } catch { setError("Network error."); }
    setLoading(false);
  }

  function copy() { navigator.clipboard?.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)" }} />
      <div style={{ position: "relative", background: "#0a0a1a", borderRadius: "20px 20px 0 0", border: "1px solid rgba(26,110,255,0.3)", padding: "20px 16px 48px", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#1a6eff" }}>⚡ ELITE SKILLZ AI</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{athlete?.name}</div>
          </div>
          <button onClick={() => { if (skill) { setSkill(null); setResult(""); setError(""); } else onClose(); }}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>
            {skill ? "← Back" : "✕"}
          </button>
        </div>

        {/* Category tabs */}
        {!skill && (
          <div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)} style={{ padding: "6px 12px", borderRadius: 100, background: cat === c.id ? c.color : "rgba(255,255,255,0.04)", border: `1px solid ${cat === c.id ? c.color : "rgba(255,255,255,0.08)"}`, color: cat === c.id ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {c.label}
                </button>
              ))}
            </div>
            {catSkills.map(s => (
              <div key={s.id} onClick={() => setSkill(s.id)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: catColor, marginBottom: 1 }}>{s.label}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.desc}</div></div>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
              </div>
            ))}
          </div>
        )}

        {skill && !result && !loading && (
          <div>
            <div style={{ background: `${catColor}15`, border: `1px solid ${catColor}33`, borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: catColor }}>{currentSkill?.icon} {currentSkill?.label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{currentSkill?.desc}</div>
            </div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" as const, marginBottom: 4 }}>Additional context (optional)</label>
            <textarea value={extra} onChange={e => setExtra(e.target.value)} placeholder="Any specific notes, injuries, focus areas..." style={{ width: "100%", padding: "10px 12px", background: "#111", border: "1px solid #333", borderRadius: 10, color: "#fff", fontFamily: "system-ui", fontSize: 14, outline: "none", height: 60, resize: "none", boxSizing: "border-box", marginBottom: 12 }} />
            <button onClick={generate} style={{ width: "100%", background: catColor, border: "none", color: "#fff", borderRadius: 12, padding: "15px", fontSize: 15, fontWeight: 900, cursor: "pointer", letterSpacing: "0.05em" }}>
              ⚡ GENERATE
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: catColor, letterSpacing: "0.1em", marginBottom: 6 }}>GENERATING...</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{skill === "workout" ? `Building ${athlete?.name?.split(" ")[0]}'s session plan with exact weights` : "One moment..."}</div>
          </div>
        )}
        {error && <div style={{ background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 10, padding: "14px", color: "#ff8888", fontSize: 13, lineHeight: 1.6 }}>{error}{error.includes("credit") && <div style={{ marginTop: 8 }}><a href="https://console.anthropic.com/settings/billing" target="_blank" style={{ color: "#1a6eff", fontWeight: 700, textDecoration: "none", fontSize: 12 }}>→ Add credits</a></div>}</div>}
        {result && (
          <div>
            <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: "16px", fontSize: 13, lineHeight: 1.85, color: "#fff", whiteSpace: "pre-wrap", marginBottom: 12, fontFamily: skill === "workout" || skill === "speed" || skill === "strength" ? "monospace" : "system-ui" }}>
              {result}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 12 }}>
              <button onClick={() => { setResult(""); setError(""); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #333", color: "rgba(255,255,255,0.4)", borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>🔄 Redo</button>
              <button onClick={copy} style={{ background: copied ? "#00d084" : catColor, border: "none", color: copied ? "#000" : "#fff", borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: 14, fontWeight: 900 }}>{copied ? "✓ COPIED!" : "📋 COPY"}</button>
            </div>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 8 }}>Run another skill</div>
            {catSkills.filter(s => s.id !== skill).slice(0, 3).map(s => (
              <div key={s.id} onClick={() => { setSkill(s.id); setResult(""); setError(""); setExtra(""); }} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #222", borderRadius: 8, padding: "10px 12px", marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <span>{s.icon}</span><span style={{ fontSize: 12, fontWeight: 700, color: catColor }}>{s.label}</span><span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.2)" }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN AGENT PAGE
// ══════════════════════════════════════════════════════
export default function CoachAgentPage() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selAthlete, setSelAthlete] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE); if (s) setAthletes(JSON.parse(s)); } catch {}
  }, []);

  const urgent = athletes.filter(a => a.status === "urgent");
  const shown = athletes.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
  const SC: Record<string, string> = { urgent: "#ff4444", inactive: "rgba(255,255,255,0.25)", active: "#1a6eff" };

  return (
    <main style={{ minHeight: "100vh", background: "#000", paddingBottom: 80, fontFamily: "system-ui" }}>
      {/* Header */}
      <div style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid #222", padding: "14px 16px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Link href="/coach/dashboard" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>AI AGENT ⚡</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Elite Skillz Lab 🧪 · {athletes.length} athletes · {CATEGORIES.length} skill categories</div>
          </div>
        </div>

        {/* Skill categories preview */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10, paddingBottom: 2 }}>
          {CATEGORIES.map(c => (
            <div key={c.id} style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: `${c.color}15`, border: `1px solid ${c.color}33`, color: c.color, whiteSpace: "nowrap" }}>{c.label}</div>
          ))}
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search athlete..." style={{ width: "100%", padding: "9px 12px", background: "#111", border: "1px solid #333", borderRadius: 10, color: "#fff", fontFamily: "system-ui", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
      </div>

      <div style={{ padding: "14px 16px" }}>
        {/* Urgent */}
        {urgent.length > 0 && (
          <div style={{ background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 14, padding: "14px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#ff4444", marginBottom: 10 }}>🔥 URGENT — ACT NOW</div>
            {urgent.map(a => (
              <div key={a.id} onClick={() => { setSelAthlete(a); setShowAI(true); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,68,68,0.1)", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{a.sport} · {a.sessions} session{a.sessions !== 1 ? "s" : ""} left</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: "#ff4444", fontWeight: 700 }}>Renew</div>
                  <div style={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }}>›</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skill summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {CATEGORIES.map(c => (
            <div key={c.id} style={{ background: `${c.color}10`, border: `1px solid ${c.color}25`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 16, marginBottom: 3 }}>{c.label.split(" ")[0]}</div>
              <div style={{ fontSize: 9, color: c.color, fontWeight: 700, letterSpacing: "0.08em" }}>{(SKILLS[c.id] || []).length} SKILLS</div>
            </div>
          ))}
        </div>

        {/* Athlete list */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 12 }}>SELECT ATHLETE</div>
        {athletes.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)", fontSize: 13, lineHeight: 1.8 }}>
            No athletes loaded.<br />
            <Link href="/coach/roster" style={{ color: "#1a6eff", textDecoration: "none", fontWeight: 700 }}>Go to Roster to load athletes →</Link>
          </div>
        )}
        {shown.map(a => {
          const c = SC[a.status] || "#1a6eff";
          const hasMaxes = a.maxes && Object.values(a.maxes).some((v: any) => v);
          return (
            <div key={a.id} onClick={() => { setSelAthlete(a); setShowAI(true); }} style={{ background: "#111", border: "1px solid #222", borderLeft: `4px solid ${c}`, borderRadius: 12, padding: "14px", marginBottom: 8, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{a.sport}{a.position ? ` · ${a.position}` : ""} · {a.sessions} sessions · {a.freq}x/wk</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ fontSize: 9, padding: "3px 8px", background: `${c}22`, color: c, borderRadius: 4, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{a.status}</div>
                  {hasMaxes && <div style={{ fontSize: 9, color: "rgba(26,110,255,0.7)" }}>📊 maxes</div>}
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>⚡ {CATEGORIES.reduce((t, c) => t + (SKILLS[c.id]?.length || 0), 0)} skills</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAI && selAthlete && <MiniAIPanel athlete={selAthlete} onClose={() => { setShowAI(false); setSelAthlete(null); }} />}
    </main>
  );
}

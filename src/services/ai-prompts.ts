// ══════════════════════════════════════════════════════════
// AI PROMPT BUILDERS — Luxury + Coach assistants
// ══════════════════════════════════════════════════════════

import type { LuxuryJob, Athlete, DailyTask } from "@/types";
import type { DailyTask as PlanTask } from "./scheduling-engine";

const LUXURY_CONTEXT = `You are the AI business assistant for All In One Luxury Designs, a premium full-turnkey home staging company in the DFW Metroplex. Owner: Terrance Crumley, 4 years in business, word-of-mouth driven, owns all furniture inventory, works with top agent Leston Eustache. Pricing: $2,750/install (90 days), $1,450/transfer (90 days). Tone: professional, warm, confident — never pushy. Sound like a successful business owner.`;

const COACH_CONTEXT = `You are the AI coaching assistant for Coach T (Terrance Crumley) at D1 Training Hulen, Fort Worth TX. Develops athletes including Texas Money Elite. $25/hr + 10% commission + resign bonuses. 60-min sessions, dumbbells + bands, mixed ages. Always specific to the athlete — never generic.`;

export function luxuryPrompt(job: LuxuryJob, action: string, extra?: string): string {
  const days = job.end_date ? Math.ceil((new Date(job.end_date).getTime() - Date.now()) / 86400000) : 0;
  const profile = `JOB: ${job.address} | Client: ${job.client_name || "?"} | Agent: ${job.agent_name || "?"} | ${days > 0 ? days + " days left" : Math.abs(days) + " days overdue"} | $${job.value} | ${job.rooms || ""}${extra ? `\nINSTRUCTION: ${extra}` : ""}`;
  const base = `${LUXURY_CONTEXT}\n\n${profile}`;
  const map: Record<string, string> = {
    quote: `${base}\n\nWrite a professional new-client quote text. $2,750 install/90 days, mention $1,450 transfer option, highlight full turnkey. Under 6 sentences.`,
    renewal: `${base}\n\nThe 90 days is ${days > 0 ? "ending in " + days : Math.abs(days) + " overdue"}. Offer extension OR pickup. Warm, easy yes. Under 5 sentences.`,
    promo: `${base}\n\nFurniture freeing up. Promo text to Leston + agent network to fill at $1,450 transfer before storage. Urgency without desperation. Under 4 sentences.`,
    invoice: `${base}\n\nWrite a polite invoice reminder. Professional, friendly, clear amount and payment options (Zelle/Venmo/Cash). Under 4 sentences.`,
    followup: `${base}\n\nFollow-up text checking on the listing, reaffirming staging value, opening door to next steps. Under 4 sentences.`,
  };
  return map[action] || base;
}

export function coachPrompt(athlete: Athlete, action: string, extra?: string): string {
  const maxes = Object.entries(athlete.maxes || {}).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(", ");
  const profile = `ATHLETE: ${athlete.name} | ${athlete.sport}${athlete.position ? ` (${athlete.position})` : ""} | Age ${athlete.age || "?"} | ${athlete.weight || "?"}lbs | Goal: ${athlete.goal || "athletic development"} | Injuries: ${athlete.injuries || "none"} | ${athlete.sessions_left} sessions left | Maxes: ${maxes || "none"}${extra ? `\nINSTRUCTION: ${extra}` : ""}`;
  const base = `${COACH_CONTEXT}\n\n${profile}`;
  const map: Record<string, string> = {
    session: `${base}\n\nGenerate a 60-min session. Format for phone reading:\n**ACTIVATION (5 min)**\n1. Exercise\n3x10\n• cue\n\nThen POWER (15), STRENGTH (25), ACCESSORY (10). End with **COACH T CUE** and **NEXT SESSION**. DB/bands only. Specific weights from maxes.`,
    message: `${base}\n\nShort warm professional text to parent. Reference specifics. Under 4 sentences.`,
    renewal: `${base}\n\n${athlete.sessions_left} sessions left. Confident renewal pitch referencing progress. Under 5 sentences.`,
    progress: `${base}\n\n4-week progress update: 1 strength win, 1 movement gain, 1 character note, next focus. Under 6 sentences.`,
    reengage: `${base}\n\nRe-engagement text for absent athlete. Warm, reference summer. End with availability question. Under 3 sentences.`,
  };
  return map[action] || base;
}

export function dailyBriefPrompt(tasks: PlanTask[], revenue: { activeStaging: number; urgentCommission: number; expiringValue: number }): string {
  const taskList = tasks.map((t) => `- [P${t.priority}] ${t.title} (${t.reason})`).join("\n");
  return `You are the master operations AI for Terrance Crumley, who runs All In One Luxury Designs (staging/moving — highest revenue priority) AND coaches at D1 Training (Tue/Wed 5:45-7:45 PM locked commitments).

Today's prioritized tasks:
${taskList}

Revenue: $${revenue.activeStaging} active staging, $${revenue.expiringValue} expiring soon, $${revenue.urgentCommission} commission opportunity.

Write a sharp, motivating 4-sentence daily brief. Lead with the single most important money move. Protect his D1 hours and his family time. Sound like a high-level chief of staff. Be direct and energizing.`;
}

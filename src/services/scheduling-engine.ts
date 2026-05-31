// ══════════════════════════════════════════════════════════
// MASTER AI SCHEDULING & PRIORITY ENGINE
// The brain that coordinates Luxury + Coach across one calendar
// ══════════════════════════════════════════════════════════

import type { LuxuryJob, ScheduleEvent, Athlete } from "@/types";

// Priority tiers (lower number = higher priority)
export const PRIORITY = {
  URGENT_STAGING: 1,   // staging/moving deadlines
  HIGH_REVENUE: 2,     // big-ticket business tasks
  OVERDUE_FOLLOWUP: 3, // overdue invoices / client follow-ups
  LOCKED_COACHING: 4,  // D1 commitments (protected, immovable)
  PRIVATE_SESSION: 5,  // private athlete training
  ADMIN: 6,            // personal growth / admin
} as const;

// D1 locked commitments — Tue + Wed 5:45-7:45 PM
export const LOCKED_COACHING_BLOCKS = [
  { day: 2, start: "17:45", end: "19:45", label: "D1 Tue Classes" }, // Tuesday
  { day: 3, start: "17:45", end: "19:45", label: "D1 Wed Classes" }, // Wednesday
];

export function daysUntil(dateStr?: string): number {
  if (!dateStr) return 999;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// Compute job urgency → priority
export function jobPriority(job: LuxuryJob): number {
  const days = daysUntil(job.end_date);
  if (job.status === "overdue" || days < 0) return PRIORITY.URGENT_STAGING;
  if (days <= 7) return PRIORITY.URGENT_STAGING;
  if (job.value >= 2500) return PRIORITY.HIGH_REVENUE;
  return PRIORITY.OVERDUE_FOLLOWUP;
}

// Detect if a proposed event conflicts with a locked coaching block
export function conflictsWithCoaching(start: Date, end: Date): boolean {
  const day = start.getDay();
  const block = LOCKED_COACHING_BLOCKS.find((b) => b.day === day);
  if (!block) return false;
  const [sh, sm] = block.start.split(":").map(Number);
  const [eh, em] = block.end.split(":").map(Number);
  const blockStart = new Date(start); blockStart.setHours(sh, sm, 0, 0);
  const blockEnd = new Date(start); blockEnd.setHours(eh, em, 0, 0);
  return start < blockEnd && end > blockStart;
}

// Detect overlaps among existing events
export function findConflicts(events: ScheduleEvent[]): Array<[ScheduleEvent, ScheduleEvent]> {
  const conflicts: Array<[ScheduleEvent, ScheduleEvent]> = [];
  const sorted = [...events].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const aEnd = new Date(sorted[i].end_time).getTime();
      const bStart = new Date(sorted[j].start_time).getTime();
      if (bStart < aEnd) conflicts.push([sorted[i], sorted[j]]);
    }
  }
  return conflicts;
}

// Build a prioritized daily plan
export interface DailyTask {
  title: string;
  business: "luxury" | "coach" | "personal";
  priority: number;
  reason: string;
  locked: boolean;
}

export function buildDailyPlan(
  jobs: LuxuryJob[],
  athletes: Athlete[],
  events: ScheduleEvent[],
  date: Date = new Date()
): DailyTask[] {
  const tasks: DailyTask[] = [];
  const day = date.getDay();

  // 1. Urgent staging/moving
  jobs.forEach((job) => {
    const days = daysUntil(job.end_date);
    if (job.status === "overdue" || days < 0) {
      tasks.push({ title: `PICKUP OVERDUE: ${job.address}`, business: "luxury", priority: PRIORITY.URGENT_STAGING, reason: `${Math.abs(days)} days overdue — schedule pickup now`, locked: false });
    } else if (days <= 7) {
      tasks.push({ title: `90-day ending: ${job.address}`, business: "luxury", priority: PRIORITY.URGENT_STAGING, reason: `${days} days left — send renewal/pickup text`, locked: false });
    }
  });

  // 2. Locked coaching (if today is Tue/Wed)
  const block = LOCKED_COACHING_BLOCKS.find((b) => b.day === day);
  if (block) {
    tasks.push({ title: block.label + " (5:45–7:45 PM)", business: "coach", priority: PRIORITY.LOCKED_COACHING, reason: "Protected commitment — do not book over", locked: true });
  }

  // 3. Urgent athletes (renewals)
  athletes.filter((a) => a.status === "urgent").forEach((a) => {
    tasks.push({ title: `Renew: ${a.name} (${a.sessions_left} left)`, business: "coach", priority: PRIORITY.OVERDUE_FOLLOWUP, reason: "Low sessions — commission opportunity", locked: false });
  });

  // 4. Inactive athletes (re-engage)
  athletes.filter((a) => a.status === "inactive").forEach((a) => {
    tasks.push({ title: `Re-engage: ${a.name}`, business: "coach", priority: PRIORITY.PRIVATE_SESSION, reason: "Inactive — bring them back", locked: false });
  });

  return tasks.sort((a, b) => a.priority - b.priority);
}

// Estimate revenue at risk / opportunity for the day
export function revenueSnapshot(jobs: LuxuryJob[], athletes: Athlete[]) {
  const activeStaging = jobs.filter((j) => j.status !== "completed").reduce((s, j) => s + j.value, 0);
  const urgentCommission = athletes.filter((a) => a.status === "urgent").length * 75;
  const expiringValue = jobs.filter((j) => daysUntil(j.end_date) <= 14).reduce((s, j) => s + j.value, 0);
  return { activeStaging, urgentCommission, expiringValue };
}

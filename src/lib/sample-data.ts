// Sample data for structure/demo. In production, replace with Supabase queries.
import type { LuxuryJob, Athlete } from "@/types";

export const SAMPLE_JOBS: LuxuryJob[] = [
  { id: "1", owner_id: "demo", address: "3031 Valentine St, Dallas TX", agent_name: "Leston Eustache", job_type: "install", value: 2750, status: "active", end_date: "2025-08-27", created_at: "" },
  { id: "2", owner_id: "demo", address: "3524 Spring Ave, Dallas TX", agent_name: "Leston Eustache", job_type: "install", value: 2750, status: "expiring", end_date: "2025-06-08", created_at: "" },
  { id: "3", owner_id: "demo", address: "1509 Dennison St, Dallas TX", agent_name: "KC", job_type: "install", value: 2750, status: "active", end_date: "2025-08-27", created_at: "" },
];

export const SAMPLE_ATHLETES: Athlete[] = [
  { id: "1", owner_id: "demo", name: "Levi Smith", sport: "General", frequency: 2, sessions_left: 1, package_value: 378, status: "urgent", maxes: {} },
  { id: "2", owner_id: "demo", name: "Emiliano Ortiz", sport: "Football", frequency: 4, sessions_left: 20, package_value: 0, status: "inactive", parent_name: "Anna Ortiz", maxes: {} },
];

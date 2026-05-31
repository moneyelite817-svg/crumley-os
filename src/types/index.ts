// ─── Shared types across Crumley OS ───

export type JobStatus = "active" | "expiring" | "overdue" | "pickup" | "completed";
export type JobType = "install" | "transfer" | "moving";

export interface LuxuryJob {
  id: string;
  owner_id: string;
  address: string;
  client_name?: string;
  agent_name?: string;
  client_phone?: string;
  client_email?: string;
  job_type: JobType;
  install_date?: string;
  end_date?: string;
  value: number;
  status: JobStatus;
  rooms?: string;
  notes?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  owner_id: string;
  job_id?: string;
  amount: number;
  status: "unpaid" | "paid" | "overdue";
  due_date?: string;
  paid_date?: string;
  payment_method?: string;
}

export interface LuxuryClient {
  id: string;
  owner_id: string;
  name: string;
  type: "agent" | "builder" | "developer" | "homeowner";
  phone?: string;
  email?: string;
  company?: string;
  notes?: string;
  total_jobs: number;
}

export type AthleteStatus = "active" | "urgent" | "inactive";

export interface Athlete {
  id: string;
  owner_id: string;
  name: string;
  sport: string;
  position?: string;
  age?: number;
  weight?: number;
  height?: string;
  goal?: string;
  injuries?: string;
  frequency: number;
  sessions_left: number;
  package_value: number;
  status: AthleteStatus;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  notes?: string;
  maxes: Record<string, string>;
}

export interface ScheduleEvent {
  id: string;
  owner_id: string;
  title: string;
  business: "luxury" | "coach" | "personal";
  event_type?: string;
  start_time: string;
  end_time: string;
  is_locked: boolean;
  priority: number;
  location?: string;
  related_job_id?: string;
  related_athlete_id?: string;
  notes?: string;
}

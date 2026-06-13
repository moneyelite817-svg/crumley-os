// src/lib/supabase.ts
// ══════════════════════════════════════════════════════
// SUPABASE CLIENT + STORAGE HELPERS
// Add to .env.local:
//   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
// ══════════════════════════════════════════════════════

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Singleton client
export const supabase: SupabaseClient = createClient(url, key);

export const isSupabaseConfigured = () => Boolean(url && key);

// ── STORAGE BUCKETS ──────────────────────────────────
export const BUCKETS = {
  jobPhotos:       "job-photos",
  inventoryPhotos: "inventory-photos",
  agentUploads:    "agent-uploads",
} as const;

// Upload a File to Supabase Storage, return public URL or null
export async function uploadToStorage(
  bucket: string,
  path:   string,
  file:   File
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) { console.error("Storage upload:", error.message); return null; }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) { console.error("Storage:", e); return null; }
}

// Delete a file from storage
export async function deleteFromStorage(bucket: string, path: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
}

// Convert a File to base64 (for localStorage fallback and AI vision)
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Convert File to data URL (for local preview)
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload photo: tries Supabase Storage first, falls back to base64 in localStorage
export async function uploadPhoto(
  bucket:   string,
  filename: string,
  file:     File
): Promise<{ url: string; isBase64: boolean }> {
  // Try Supabase Storage
  if (isSupabaseConfigured()) {
    const url = await uploadToStorage(bucket, `${Date.now()}-${filename}`, file);
    if (url) return { url, isBase64: false };
  }
  // Fallback: base64 data URL stored locally
  const dataUrl = await fileToDataUrl(file);
  return { url: dataUrl, isBase64: true };
}

// ── DATABASE HELPERS ─────────────────────────────────
// Use these instead of localStorage in your pages.
// Each function falls back to localStorage if Supabase isn't configured.

type TableName =
  | "staging_jobs" | "job_photos" | "job_documents"
  | "inventory_items" | "athletes" | "schedule_sessions"
  | "session_bookings" | "workout_completions" | "training_programs"
  | "athlete_tests" | "tasks" | "moving_jobs" | "clients";

const LS_MAP: Record<string, string> = {
  staging_jobs:       "cros_luxury_jobs_v3",
  inventory_items:    "cros_inventory_v1",
  athletes:           "ct_clients",
  schedule_sessions:  "ct_sessions_v2",
  session_bookings:   "ct_bookings_v1",
  workout_completions:"ct_workout_completions",
  training_programs:  "ct_programs_v1",
  job_photos:         "cros_job_photos_v1",
  job_documents:      "cros_job_documents_v1",
};

export async function dbSelect<T>(table: TableName, filter?: Record<string, any>): Promise<T[]> {
  if (isSupabaseConfigured()) {
    let q = supabase.from(table).select("*");
    if (filter) {
      for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
    }
    const { data, error } = await q;
    if (!error && data) return data as T[];
  }
  // localStorage fallback
  try {
    const key = LS_MAP[table] || `cros_${table}_v1`;
    const raw = localStorage.getItem(key);
    const all: T[] = raw ? JSON.parse(raw) : [];
    if (!filter) return all;
    return all.filter((row: any) =>
      Object.entries(filter).every(([k, v]) => row[k] === v)
    );
  } catch { return []; }
}

export async function dbInsert<T extends Record<string, any>>(table: TableName, row: T): Promise<T | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from(table).insert(row).select().single();
    if (!error && data) return data as T;
  }
  // localStorage fallback
  try {
    const key = LS_MAP[table] || `cros_${table}_v1`;
    const existing: T[] = JSON.parse(localStorage.getItem(key) || "[]");
    const newRow = { ...row, id: row.id || `${Date.now()}`, created_at: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify([...existing, newRow]));
    return newRow;
  } catch { return null; }
}

export async function dbUpdate<T extends Record<string, any>>(
  table: TableName, id: string, updates: Partial<T>
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from(table).update(updates).eq("id", id);
    if (!error) return true;
  }
  try {
    const key = LS_MAP[table] || `cros_${table}_v1`;
    const existing: T[] = JSON.parse(localStorage.getItem(key) || "[]");
    const updated = existing.map((row: any) => row.id === id ? { ...row, ...updates } : row);
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  } catch { return false; }
}

export async function dbDelete(table: TableName, id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) return true;
  }
  try {
    const key = LS_MAP[table] || `cros_${table}_v1`;
    const existing: any[] = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify(existing.filter((r: any) => r.id !== id)));
    return true;
  } catch { return false; }
}

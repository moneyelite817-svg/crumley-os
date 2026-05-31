-- ══════════════════════════════════════════════════════════
-- CRUMLEY OS — Seed Data (Terrance's real jobs & athletes)
-- Run AFTER schema.sql and AFTER you sign up (so you have a user id)
-- Replace 'YOUR_USER_ID' with your actual auth.users id
-- Find it: Supabase Dashboard > Authentication > Users > copy UID
-- ══════════════════════════════════════════════════════════

-- ─── LUXURY JOBS (real addresses) ───
insert into luxury_jobs (owner_id, address, agent_name, job_type, value, status, notes) values
('YOUR_USER_ID', '3031 Valentine St, Dallas TX', 'Leston Eustache', 'install', 2750, 'active', 'Leston listing'),
('YOUR_USER_ID', '3524 Spring Ave, Dallas TX 75210', 'Leston Eustache', 'install', 2750, 'active', 'Leston listing'),
('YOUR_USER_ID', '3610 Durango Dr, Dallas TX', 'Leston Eustache', 'install', 2750, 'active', 'Leston listing'),
('YOUR_USER_ID', '4009 Finis St, Dallas TX 75212', 'Leston Eustache', 'install', 2750, 'active', 'Leston listing'),
('YOUR_USER_ID', '1509 Dennison St, Dallas TX', 'KC', 'install', 2750, 'active', 'KC listing'),
('YOUR_USER_ID', '1507 Dennison St, Dallas TX', 'KC', 'install', 2750, 'active', 'KC listing');

-- ─── COACH ATHLETES (sample — add the full roster) ───
insert into coach_athletes (owner_id, name, sport, frequency, sessions_left, package_value, status, parent_name) values
('YOUR_USER_ID', 'Levi Smith', 'General', 2, 1, 378, 'urgent', null),
('YOUR_USER_ID', 'Donovan Edwards', 'General', 2, 33, 2835, 'active', null),
('YOUR_USER_ID', 'Travis Cheyne', 'General', 2, 48, 0, 'active', null),
('YOUR_USER_ID', 'Emiliano Ortiz', 'Football', 4, 20, 0, 'inactive', 'Anna Ortiz'),
('YOUR_USER_ID', 'Aaliyah Jauregui', 'General', 2, 2, 0, 'urgent', null);

-- ─── LOCKED D1 COMMITMENTS (Tue + Wed 5:45-7:45 PM) ───
-- These are the protected coaching blocks the AI schedules around
insert into schedule_events (owner_id, title, business, event_type, start_time, end_time, is_locked, priority) values
('YOUR_USER_ID', 'D1 Group Class 1', 'coach', 'group', '2025-06-03 17:45:00-05', '2025-06-03 18:45:00-05', true, 4),
('YOUR_USER_ID', 'D1 Group Class 2', 'coach', 'group', '2025-06-03 18:45:00-05', '2025-06-03 19:45:00-05', true, 4),
('YOUR_USER_ID', 'D1 Group Class 1', 'coach', 'group', '2025-06-04 17:45:00-05', '2025-06-04 18:45:00-05', true, 4),
('YOUR_USER_ID', 'D1 Group Class 2', 'coach', 'group', '2025-06-04 18:45:00-05', '2025-06-04 19:45:00-05', true, 4);

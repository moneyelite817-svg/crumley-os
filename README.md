# CRUMLEY OS

A unified business operating system for **Terrance Crumley** — combining **All In One Luxury Designs** (staging/moving) and **Coach T Command Center** (athletic training) into one intelligent platform with a shared AI scheduling engine.

Built with **Next.js 14 · React · TypeScript · Tailwind CSS · Supabase · Anthropic AI**.

---

## What's inside

```
crumley-os/
├── src/
│   ├── app/
│   │   ├── page.tsx                 ← Landing (choose business)
│   │   ├── dashboard/               ← MASTER dashboard (both businesses + AI brief)
│   │   ├── luxury/                  ← All In One Luxury platform
│   │   │   ├── dashboard, jobs, moving, clients, invoices, revenue
│   │   ├── coach/                   ← Coach T platform
│   │   │   ├── dashboard, roster, schedule, agent
│   │   └── api/ai/route.ts          ← Secure server-side AI calls
│   ├── components/                  ← Reusable UI (LogoMark, etc.)
│   ├── hooks/useAI.ts               ← Client hook for AI
│   ├── services/
│   │   ├── scheduling-engine.ts     ← THE BRAIN — priority + conflict logic
│   │   └── ai-prompts.ts            ← All AI prompt builders
│   ├── lib/                         ← Supabase clients, sample data
│   └── types/                       ← Shared TypeScript types
├── supabase/
│   ├── schema.sql                   ← Full database schema + RLS
│   └── seed.sql                     ← Your real jobs & athletes
├── .env.example                     ← Environment variables template
└── package.json
```

---

## The Master Scheduling Engine

`src/services/scheduling-engine.ts` is the intelligence layer. It:

- **Locks D1 coaching** every Tue/Wed 5:45–7:45 PM — never schedules over it
- **Ranks priorities**: (1) urgent staging/moving → (2) high revenue → (3) overdue follow-ups → (4) locked coaching → (5) private sessions → (6) admin
- **Detects conflicts** and prevents overbooking
- **Builds a daily plan** ranked by money + urgency
- Feeds the **AI Daily Brief** on the master dashboard

---

## Setup (about 30 minutes)

### 1. Install
```bash
npm install
```

### 2. Create a Supabase project
- Go to [supabase.com](https://supabase.com) → New Project (free tier is fine)
- Once created, go to **SQL Editor → New Query**
- Paste all of `supabase/schema.sql` → Run
- This creates every table + security rules

### 3. Get your keys
- Supabase: **Project Settings → API** → copy the URL, anon key, service role key
- Anthropic: [console.anthropic.com](https://console.anthropic.com) → API Keys → create one (needs ~$5 credit)

### 4. Environment variables
```bash
cp .env.example .env.local
```
Fill in your real keys in `.env.local`.

### 5. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 6. (Optional) Seed your real data
- Sign up in the app first (creates your user)
- In Supabase: **Authentication → Users** → copy your UID
- Open `supabase/seed.sql`, replace `YOUR_USER_ID` with your UID
- Run it in the SQL Editor — loads your real jobs + athletes

---

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Crumley OS initial build"
# create a repo at github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/crumley-os.git
git push -u origin main
```

### 2. Deploy
- Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
- Add the same environment variables from `.env.local` in **Project Settings → Environment Variables**
- Click **Deploy**

### 3. Live
Vercel gives you a URL like `crumley-os.vercel.app`. Open it in Safari → Share → **Add to Home Screen**. Now it's a real app on your phone.

---

## Connecting real data (next step after first deploy)

The dashboards currently use `src/lib/sample-data.ts` for structure. To go live with real data, replace those imports with Supabase queries. Example for luxury jobs:

```typescript
import { createClient } from "@/lib/supabase-client";

const supabase = createClient();
const { data: jobs } = await supabase
  .from("luxury_jobs")
  .select("*")
  .order("end_date", { ascending: true });
```

The tables, types, and security are already built — this is just swapping the data source.

---

## Notes

- **Security**: Row Level Security is enabled — you only ever see your own data. The Anthropic key lives server-side only (never exposed to the browser).
- **Mobile/tablet**: All layouts are responsive and touch-optimized.
- **Scaling**: This architecture supports adding staff logins, more businesses, and additional AI features without restructuring.

Built for the DFW Metroplex. Designs Inspired To Enhance.

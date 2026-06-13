# CRUMLEY OS — COMPLETE FILE DEPLOYMENT
All pages and components built across all sessions.
Place each file at the exact path shown below inside your crumley-os project.

## FILE MAP

src/app/
├── ai/
│   └── page.tsx                        ← AI Skills Center (6 agents, no duplicates)
│
├── coach/
│   ├── _components/
│   │   └── WorkoutDisplay.tsx          ← SHARED workout card renderer (NEW)
│   ├── dashboard/
│   │   └── page.tsx                    ← Coach dashboard, AI brain, all nav links
│   ├── program/
│   │   └── page.tsx                    ← Programming agent, 4-week/8-week programs
│   ├── roster/
│   │   └── page.tsx                    ← Athlete roster, Add/Edit/Delete, Book Session
│   └── schedule/
│       └── page.tsx                    ← Full booking system, athlete selector, complete flow
│
└── luxury/
    ├── contract/
    │   └── page.tsx                    ← Staging agreement generator (auto-fill from job)
    ├── dashboard/
    │   └── page.tsx                    ← All In One command center, Ask Agent, inventory link
    ├── inventory/
    │   └── page.tsx                    ← Inventory command center, full asset tracking
    ├── invoice/
    │   └── page.tsx                    ← Invoice generator matching branded template
    └── jobs/
        └── page.tsx                    ← Staging jobs, Documents tab, AI agent per job

## DEPLOY
cd Desktop\crumley-os
git add .
git commit -m "crumley os - full build consolidated"
git push

Vercel auto-deploys in ~60 seconds.

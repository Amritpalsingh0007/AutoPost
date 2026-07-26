# AutoPost

**Your commits already tell the story. This just writes it down.**

AutoPost tracks the public GitHub repos you're working on and, every week, turns that week's actual commit activity into a draft LinkedIn-style update — so "learning in public" doesn't depend on remembering to write about it yourself.

Built for **AccioBuild 2026** (AccioJob).

---

## Live

- **App:** https://auto-post-lac-nine.vercel.app
- **API:** _add your Render backend URL here_

---

## The problem

Students and junior developers want to document their learning publicly — for visibility to recruiters, their network, and their own portfolio — but two things get in the way:

1. **Writing a good update is effortful**, especially after a coding session is already over.
2. **It's hard to know what's actually worth sharing** — was this week's work substantial enough to post about?

Any AI can turn a well-written description into a good post — that part isn't the hard problem, and it isn't what AutoPost is betting on. The actual value is upstream: **reading what happened directly from git history**, rather than relying on the developer to summarize their own week first.

## What AutoPost does

1. You paste a public GitHub repo URL.
2. AutoPost reads the README and recent commits once, and generates a short description of what the project is.
3. Every week, a scheduled job reads that week's commits (plus any optional notes you've added) and drafts an update.
4. You review, edit, and copy the draft — AutoPost doesn't auto-post anywhere; you stay in control of what goes out and where.
5. If a repo had no activity that week, AutoPost says so plainly instead of generating a filler post.

## Architecture

```
┌─────────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│   React frontend     │ ──────▶│   Spring Boot API     │───────▶│  Neon PostgreSQL │
│   (Vercel)            │◀────── │   (Render)             │◀──────│                  │
└─────────────────────┘        └──────────┬───────────┘        └─────────────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                                   ▼
                 ┌─────────────────┐               ┌─────────────────────┐
                 │  GitHub REST API │               │   Gemini API          │
                 │  (commits/repos) │               │   (project + post gen)│
                 └─────────────────┘               └─────────────────────┘
```

- **Frontend:** React (Vite) — see [`AutoPost-Frontend/README.md`](./AutoPost-Frontend/README.md)
- **Backend:** Spring Boot (Java 21) — see [`AutoPost-Backend/autopost/README.md`](./AutoPost-Backend/autopost/README.md)
- **Database:** PostgreSQL (hosted on Neon)
- **AI:** Google Gemini API, for two distinct calls — a one-time project description, and a weekly synthesis of commits + notes into a draft
- **Scheduling:** Spring's `@Scheduled` (native cron, no external job runner) — runs weekly, generating one draft per tracked repo

## Why this isn't "just another AI writing tool"

The AI-writing space for LinkedIn content is genuinely crowded already. What's different here isn't the writing step — it's that AutoPost never asks you to describe your week. It reads your commits directly. The AI's job is the easy, replaceable part; the actual product is not needing to explain yourself in the first place.

## Repo structure

```
AutoPost/
├── AutoPost-Frontend/    # React app
└── AutoPost-Backend/
    └── autopost/          # Spring Boot app
```

## Local setup

See the individual READMEs for exact setup steps:
- [Frontend setup](./AutoPost-Frontend/README.md)
- [Backend setup](./AutoPost-Backend/autopost/README.md)

## Known limitations

- Only public GitHub repositories are supported (no OAuth / private repo access).
- Posting is manual — AutoPost drafts the update, you copy and publish it yourself; there's no LinkedIn API integration.
- Because it only reads commit diffs and optional notes, it can't capture non-code learning (reading, watching, planning) unless you log it as a note.

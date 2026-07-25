# Frontend Build Spec — Pages & Design System

**Purpose of this doc:** Complete instructions for an AI coding agent building the React frontend. Covers the design system (so every page looks like one product, not assembled fragments) and a detailed spec for every page. Read the whole file before building any page — the design tokens in §1 apply to all pages in §3 onward.

**Tech stack already scaffolded:** Vite + React 19 + TypeScript. No router installed yet — add `react-router-dom`. No state management library needed for MVP — React context + local state is sufficient.

**Backend contract:** Spring Boot REST API (not yet built). All API calls in this spec reference endpoints that will exist; stub them with mock data / `localStorage` for now so every page is fully interactive without the backend. The mock layer should be a single file (`src/services/api.ts`) that can later be swapped for real `fetch` calls.

---

## 1. Design System

### Concept
This product turns **git activity** (commits, diffs — raw, structured, terminal-native) into a **written post** (soft, human, readable). The design should embody that transformation using a Vercel-inspired stark system: near-white canvas surfaces for writing/editing, a deep ink-black for code-adjacent and dark-band sections, and a multi-stop mesh gradient as the single decorative element at hero scale. The overall feel is **engineered calm** — generous whitespace, tight internal spacing, stacked shadows, and aggressive negative letter-spacing on headlines.

### Color tokens

| Token | CSS Variable | Hex | Use |
|---|---|---|---|
| primary | `--c-primary` | `#171717` | Primary CTA fill, dark-band backgrounds, ink text on light surfaces |
| on-primary | `--c-on-primary` | `#ffffff` | Text on primary surfaces |
| canvas | `--c-canvas` | `#ffffff` | Card/dialog/modal surfaces |
| canvas-soft | `--c-canvas-soft` | `#fafafa` | Default page background |
| canvas-soft-2 | `--c-canvas-soft-2` | `#f5f5f5` | Inset surfaces (code editor inner bg, hover states) |
| ink | `--c-ink` | `#171717` | Heading + body text on light surfaces |
| body | `--c-body` | `#4d4d4d` | Secondary text — subtitles, nav links, descriptions |
| mute | `--c-mute` | `#888888` | Placeholder text, fine print, low-priority labels |
| hairline | `--c-hairline` | `#ebebeb` | 1px dividers, card borders, input borders |
| hairline-strong | `--c-hairline-strong` | `#a1a1a1` | Stronger dividers, deemphasized text |
| link | `--c-link` | `#0070f3` | Inline links, success indicator |
| error | `--c-error` | `#ee0000` | Validation errors, destructive states |
| error-soft | `--c-error-soft` | `#f7d4d6` | Error backgrounds |
| warning | `--c-warning` | `#f5a623` | Pending/draft status |
| warning-soft | `--c-warning-soft` | `#ffefcf` | Warning backgrounds |
| success | `--c-success` | `#0070f3` | Posted/complete status |
| gradient-develop-start | `--c-grad-dev-s` | `#007cf0` | Mesh gradient stop 1 |
| gradient-develop-end | `--c-grad-dev-e` | `#00dfd8` | Mesh gradient stop 2 |
| gradient-preview-start | `--c-grad-prev-s` | `#7928ca` | Mesh gradient stop 3 |
| gradient-preview-end | `--c-grad-prev-e` | `#ff0080` | Mesh gradient stop 4 |
| gradient-ship-start | `--c-grad-ship-s` | `#ff4d4d` | Mesh gradient stop 5 |
| gradient-ship-end | `--c-grad-ship-e` | `#f9cb28` | Mesh gradient stop 6 |

#### Draft-status semantic colors (mapped from brand tokens)

| Status | Fill | Text | Use |
|---|---|---|---|
| DRAFT | `--c-warning` | `--c-ink` | Unreviewed generated draft |
| EDITED | `--c-link` | `--c-on-primary` | User has modified the draft |
| POSTED | `--c-primary` | `--c-on-primary` | Marked as posted by user |
| SKIPPED | `--c-canvas-soft-2` | `--c-mute` | No activity that week |

### Typography

Load **Inter** (400/500/600) as the geometric sans and **JetBrains Mono** (400) as the technical mono from Google Fonts. These are the open-source substitutes for Geist specified in DESIGN.md.

| Token | CSS Variable | Font | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|---|---|
| display-xl | `--t-display-xl` | Inter | 48px | 600 | 48px | -2.4px | Hero headline |
| display-lg | `--t-display-lg` | Inter | 32px | 600 | 40px | -1.28px | Section headlines |
| display-md | `--t-display-md` | Inter | 24px | 600 | 32px | -0.96px | Card headlines, page titles |
| display-sm | `--t-display-sm` | Inter | 20px | 600 | 28px | -0.6px | Sub-section headings |
| body-lg | `--t-body-lg` | Inter | 18px | 400 | 28px | 0 | Lead paragraphs |
| body-md | `--t-body-md` | Inter | 16px | 400 | 24px | 0 | Default body |
| body-md-strong | `--t-body-md-strong` | Inter | 16px | 500 | 24px | 0 | Bolded body |
| body-sm | `--t-body-sm` | Inter | 14px | 400 | 20px | -0.28px | Nav links, secondary body |
| body-sm-strong | `--t-body-sm-strong` | Inter | 14px | 500 | 20px | -0.28px | Nav CTAs, emphasis |
| caption | `--t-caption` | Inter | 12px | 400 | 16px | 0 | Fine print, badges |
| caption-mono | `--t-caption-mono` | JetBrains Mono | 12px | 400 | 16px | 0 | Section eyebrows, technical labels |
| code | `--t-code` | JetBrains Mono | 13px | 400 | 20px | 0 | Commit SHAs, code snippets, dates |
| button-md | `--t-button-md` | Inter | 14px | 500 | 20px | 0 | Small buttons |
| button-lg | `--t-button-lg` | Inter | 16px | 500 | 24px | 0 | Marketing CTAs |

**Typography rules:**
- Headlines are **sentence-case**, often **period-terminated** ("Your commits already tell the story.").
- Aggressive **negative tracking** on display sizes is part of the brand voice — do not revert to default.
- **Weight 600 is the ceiling.** Never use 700 or heavier.
- Mono is for the **technical layer only** — commit SHAs, dates, code, section eyebrows. Never for body prose.

### Spacing

Base unit: **4px**. Every spacing value is a multiple of 4.

| Token | CSS Variable | Value |
|---|---|---|
| xxs | `--s-xxs` | 4px |
| xs | `--s-xs` | 8px |
| sm | `--s-sm` | 12px |
| md | `--s-md` | 16px |
| lg | `--s-lg` | 24px |
| xl | `--s-xl` | 32px |
| 2xl | `--s-2xl` | 40px |
| 3xl | `--s-3xl` | 48px |
| 4xl | `--s-4xl` | 64px |
| 5xl | `--s-5xl` | 96px |

### Border Radius

| Token | CSS Variable | Value | Use |
|---|---|---|---|
| xs | `--r-xs` | 4px | Tightest inline elements |
| sm | `--r-sm` | 6px | Base UI radius — nav buttons, form inputs |
| md | `--r-md` | 8px | Feature cards, template cards |
| lg | `--r-lg` | 12px | Larger cards (pricing, auth forms) |
| xl | `--r-xl` | 16px | Cards with hero images |
| pill-sm | `--r-pill-sm` | 64px | Tab ghost pills |
| pill | `--r-pill` | 100px | Marketing CTAs |
| full | `--r-full` | 9999px | Circular icon buttons, badges |

### Elevation (Stacked Shadows)

Never use a single heavy drop-shadow. Always layer multiple small offsets with an inset hairline:

| Level | CSS | Use |
|---|---|---|
| 0 | None | Full-bleed hero/footer bands |
| 1 | `0 0 0 1px rgba(0,0,0,0.08) inset` | Default card edge |
| 2 | `0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08) inset` | Slightly elevated cards |
| 3 | `0 2px 2px rgba(0,0,0,0.04), 0 8px 8px -8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08) inset` | Feature cards |
| 4 | `0 2px 2px rgba(0,0,0,0.04), 0 8px 16px -4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08) inset` | Pricing, callout panels |
| 5 | `0 1px 1px rgba(0,0,0,0.02), 0 8px 16px -4px rgba(0,0,0,0.04), 0 24px 32px -8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08) inset` | Modals, dialogs |

### Layout concept

**Unauthenticated pages** (Landing, Sign Up, Log In): Single-column, centered on `--c-canvas-soft` background. No sidebar. A top nav bar only.

**Authenticated pages** (Dashboard, Repo Detail, History, Notes, Settings): A persistent **app shell** with a dark sidebar (`--c-primary` background, `--c-on-primary` text) on the left for navigation, and a light main content area (`--c-canvas-soft` background) on the right.

```
┌─────────────────────────────────────────────┐
│  nav-bar (--c-canvas, 64px, sticky)         │
├──────────┬──────────────────────────────────┤
│ sidebar  │                                  │
│ --c-     │      --c-canvas-soft             │
│ primary  │      main content                │
│          │      (cards on --c-canvas)        │
│ (nav,    │                                  │
│  repos)  │                                  │
└──────────┴──────────────────────────────────┘
```

- Sidebar width: 260px on desktop
- Below 768px: sidebar collapses to a hamburger/drawer
- Main content max-width: 1200px, centered with `--s-lg` horizontal gutters

### Signature element — the Weekly Grid

A compact horizontal row of small squares (12×12px, 2px gap), one per week, styled like a minimal contribution graph showing **draft status**, not raw commit count:

| Square state | Style |
|---|---|
| No activity (skipped) | 1px `--c-hairline` border, transparent fill |
| Draft generated, not posted | `--c-warning` fill |
| Posted | `--c-primary` fill |
| Edited | `--c-link` fill |

This grid recurs on the Dashboard sidebar (per repo, last ~6 weeks), the Repo Detail page (full history), and the History page (multi-repo combined view). It's the visual element that ties the "weekly cadence" concept together.

Build it as a single reusable component: `<WeeklyGrid weeks={WeekStatus[]} />` where `WeekStatus = { weekOf: string; status: 'DRAFT' | 'EDITED' | 'POSTED' | 'SKIPPED' | 'NONE' }`.

### Interaction & accessibility (applies to every page)

- Responsive down to mobile — the sidebar layout collapses below ~768px.
- Visible keyboard focus states on all interactive elements (use `--c-link` for focus rings).
- Respect `prefers-reduced-motion` — disable transitions/animations.
- Copy voice: plain, active verbs. Button label matches confirmation ("Copy" → "Copied", "Mark as posted" → "Posted"). Never mismatched.
- Empty states are invitations to act, not apologies — e.g., "No repos tracked yet — add one to get your first weekly draft."

---

## 2. Shared Components

Build these before any page — they are used across the app.

### 2.1 `<NavBar />`
- Height: 64px, sticky top, `--c-canvas` background, 1px `--c-hairline` bottom border.
- Layout: logo left ("AutoPost" in `--t-display-sm`), link row center (authenticated: Dashboard, History, Notes, Settings in `--t-body-sm`), action cluster right.
- **Unauthenticated actions:** "Log In" (`button-secondary-sm` — `--c-canvas` bg, `--c-ink` text, `--r-sm`) + "Sign Up" (`button-primary-sm` — `--c-primary` bg, `--c-on-primary` text, `--r-sm`), both 28px height.
- **Authenticated actions:** User email in `--t-body-sm` with a dropdown menu for Settings/Log Out.
- Below 768px: center links collapse to hamburger.

### 2.2 `<AppShell />`
- Wraps all authenticated pages. Renders the sidebar + main content area.
- **Sidebar:** `--c-primary` background, `--c-on-primary` text, 260px wide, full viewport height below the nav bar.
  - Product wordmark top (small, `--t-body-sm-strong`, `--c-on-primary`).
  - Nav links: Dashboard, History, Notes, Settings — each a row with `--r-sm` radius, `--s-xs` vertical + `--s-sm` horizontal padding. Active state: a 3px `--c-link` left-edge indicator bar.
  - Below nav: compact list of tracked repos. Each row shows repo name (`--t-body-sm`) + an inline `<WeeklyGrid />` (last ~6 weeks). Click → Repo Detail.
  - "+ Add repo" as the last item, visually distinct (`--c-link` text color).
- **Main area:** `--c-canvas-soft` background, scrollable, content centered at max 1200px.

### 2.3 `<WeeklyGrid />`
Described in §1. Reusable across Dashboard sidebar, Repo Detail, and History.

### 2.4 `<StatusBadge status={DraftStatus} />`
- A small pill badge (`--r-full` radius, `--s-xs` horizontal padding, `--t-caption` text).
- Color per the draft-status semantic table in §1.

### 2.5 `<DraftCard />`
Used on Dashboard and History pages. A `--c-canvas` card with Level 2 shadow and `--r-md` radius.
- Contents: repo name (`--t-body-sm-strong`), `<StatusBadge />`, draft preview (first 2–3 lines truncated, `--t-body-md`, `--c-body` text), week-of date (`--t-caption-mono`).
- Action row: "Review" (text link, `--c-link`), "Copy" (`button-secondary-sm`), "Mark as posted" (`button-primary-sm`).

### 2.6 `<CodeBlock />`
Dark code surface for displaying diffs/commits. `--c-primary` background, `--c-on-primary` text, `--t-code` typography, `--r-md` radius, `--s-lg` padding.

### 2.7 `<EmptyState message={string} action?: { label: string, onClick: () => void } />`
Centered on `--c-canvas-soft` surface, `--r-lg` radius, `--s-3xl` padding. Message in `--t-body-md`, `--c-body` text. Optional action as a `button-primary`.

### 2.8 `<Modal />`
For Add Repo and confirmations. `--c-canvas` background, `--r-lg` radius, `--s-xl` padding, Level 5 shadow. Backdrop: `rgba(0,0,0,0.5)`. Centered on screen.

### 2.9 `<FormInput />`
Standard text input: `--c-canvas` background, 1px `--c-hairline` border, `--t-body-sm` text, `--r-sm` radius, `--s-sm` horizontal padding, 40px height. Focus: 2px `--c-link` border. Error: 2px `--c-error` border with error message in `--t-caption`, `--c-error` text below the field.

---

## 3. Page Inventory

1. Landing Page (unauthenticated)
2. Sign Up
3. Log In
4. Dashboard (Home — authenticated)
5. Add Repo (modal)
6. Repo Detail
7. Draft Review
8. History
9. Weekly Notes
10. Account Settings
11. Empty/Error/404 states

---

## 4. Page Specs

### 4.1 Landing Page (`/`)

**Job:** Explain the product's actual mechanism in one screen, get a visitor to sign up. Unauthenticated visitors only — redirect logged-in users straight to Dashboard.

**Layout:** Single column, no sidebar. `<NavBar />` at top (unauthenticated variant).

**Hero band** (`--c-canvas` background, `--s-4xl` vertical padding):
- Small mono eyebrow label above the headline (`--t-caption-mono`, `--c-mute`): "Automated weekly updates from your git history."
- Headline in `--t-display-xl`, `--c-ink`, sentence-case, period-terminated: **"Your commits already tell the story."**
- Subhead in `--t-body-lg`, `--c-body`, max-width 600px: "AutoPost reads your weekly commits, drafts a LinkedIn-ready update, and lets you review it before posting. No self-reporting. No blank-page anxiety."
- CTA row: "Get started" (`button-primary`, `--r-pill`) + "See how it works" (`button-secondary`, `--r-pill`).
- Behind the hero text: the **mesh gradient** rendered as a radial CSS gradient blob, blurred, at ~40% opacity. Colors: `--c-grad-dev-s` → `--c-grad-dev-e` → `--c-grad-prev-s` → `--c-grad-prev-e` → `--c-grad-ship-s` → `--c-grad-ship-e`. This is the **only** place the gradient appears in the app.

**Diff-to-draft visual** (below hero, `--c-canvas-soft` background, `--s-5xl` vertical padding):
- Side-by-side on desktop (stacked on mobile):
  - Left: a `<CodeBlock />` showing a mock diff snippet (3–4 lines of `+ added` / `- removed` code).
  - Center: an animated arrow/transition indicator.
  - Right: a card (`--c-canvas`, Level 3 shadow, `--r-md`) showing a mock draft paragraph.
- Caption below in `--t-caption-mono`: "From diff to draft, every Saturday."

**How it works** section (`--c-canvas` background, `--s-5xl` vertical padding):
- Section eyebrow: `--t-caption-mono`, uppercase, `--c-mute`: "HOW IT WORKS"
- Headline: `--t-display-lg`: "Three steps. Zero writing effort."
- 3 numbered steps in a row (3-up desktop, stacked mobile), each in a `card-soft` (`--c-canvas-soft`, `--r-md`, `--s-lg` padding, Level 2 shadow):
  1. "Paste a public repo URL."
  2. "Every Saturday, we read the week's commits."
  3. "Review and copy your draft — post it yourself, anywhere."
- Step number in `--t-display-md`, `--c-link`. Step text in `--t-body-md`.

**"What this isn't"** section (`--c-canvas-soft` background, `--s-4xl` vertical padding):
- A single centered text block, max-width 640px.
- Headline: `--t-display-md`: "Yes, the writing step is easy."
- Body in `--t-body-md`, `--c-body`: "Any AI can turn your summary into a post. The hard part — the part that makes you skip a week — is figuring out what's worth writing about in the first place. AutoPost reads what you actually did, so you don't have to explain your week yourself."

**Weekly Grid teaser** (`--c-canvas` background, `--s-4xl` vertical padding):
- A static example `<WeeklyGrid />` showing ~12 weeks of mixed statuses.
- Caption: `--t-body-md`, `--c-body`: "A quiet week is still visible — no fake activity, no filler posts."

**Final CTA band** (`--c-primary` background — polarity flip, `--s-5xl` vertical padding):
- Headline: `--t-display-lg`, `--c-on-primary`: "Add your first repo."
- CTA: "Create account" (`button-secondary` — white pill on dark band, `--r-pill`) → routes to `/signup`.

**Footer** (`--c-canvas` background, `--s-4xl` vertical padding):
- Simple: product name, "Built for AccioBuild 2026", link to GitHub repo.
- Column labels in `--t-caption-mono`.

**Explicitly do not include:** pricing, testimonials, feature grids with icons.

---

### 4.2 Sign Up (`/signup`)

**Job:** Create an account with minimum friction — email + password only.

**Layout:** Centered single card on `--c-canvas-soft` background. No sidebar. `<NavBar />` (unauthenticated variant) at top.

**Auth form card:** `--c-canvas` background, `--r-lg` radius, `--s-xl` padding, Level 4 shadow, max-width 400px, centered.
- Headline: `--t-display-md`, `--c-ink`: "Create your account."
- Fields: Email, Password, Confirm Password — all `<FormInput />` components.
- Inline validation on blur, not on every keystroke. Password requirements stated once above the field in `--t-caption`, `--c-mute` — not as a moving checklist.
- Submit button: full-width `button-primary` (`--r-pill`), label: "Create account" (not "Submit" or "Sign up now").
- Below: "Already have an account? [Log in](/login)" — `--t-body-sm`, link in `--c-link`.

**On success:** Route directly to Dashboard (skip welcome interstitial — the empty-state Dashboard itself is the onboarding).

**Error states:** "That email's already in use — [log in instead?](/login)" with a direct link.

---

### 4.3 Log In (`/login`)

**Job:** Standard auth entry. Same visual treatment as Sign Up.

**Layout:** Same as Sign Up — centered card, `--c-canvas-soft`, no sidebar.

**Auth form card:** Same chrome as Sign Up.
- Headline: `--t-display-md`: "Welcome back."
- Fields: Email, Password.
- "Forgot password?" link below password field — routes to a "contact support" note if reset flow isn't built.
- Submit: full-width `button-primary`, label: "Log in"
- Below: "Don't have an account? [Create one](/signup)"

---

### 4.4 Dashboard — Home (`/dashboard`)

**Job:** The main authenticated landing page. Answer at a glance: what repos am I tracking, and what's new this week?

**Layout:** `<AppShell />` — sidebar + main content.

**Main content area:**

**Header section:**
- Eyebrow: `--t-caption-mono`, `--c-mute`: current week's date range (e.g., "JUL 21 — JUL 27, 2026").
- Headline: `--t-display-md`, `--c-ink`: "This week"

**Draft cards section (for repos with drafts this week):**
- One `<DraftCard />` per tracked repo that has a draft ready this week.
- Cards in a single-column list, `--s-md` gap between cards.
- Each card shows: repo name, generated draft preview (first 2–3 lines), `<StatusBadge />`, and actions: "Review" (link), "Copy" (button), "Mark as posted" (button).

**Skipped repos section (lower emphasis):**
- For repos with no activity this week: a muted card (`--c-canvas-soft` background instead of `--c-canvas`, no shadow) showing repo name and "No activity this week — nothing generated." in `--t-body-sm`, `--c-mute`.
- These are shown, not hidden — reinforces trustworthiness.

**Empty state (no repos tracked):**
- Full main area shows `<EmptyState message="Add your first repo to get a draft this Saturday." action={{ label: "Add a repo", onClick: openAddRepoModal }} />`.
- This is the first thing a new user sees post-signup, so it must double as onboarding.

---

### 4.5 Add Repo (modal, triggered from Dashboard sidebar or empty state)

**Job:** Add a public GitHub repo URL to track. Modal, not a full page.

**Component:** `<Modal />`
- Headline: `--t-display-sm`: "Add a repository"
- Single `<FormInput />`, placeholder: `https://github.com/username/repo-name`
- Client-side validation: check it matches a GitHub URL pattern before submit.
- Submit button: `button-primary`, label: "Add repo"

**Loading state:** After submit, button shows "Reading the project…" (this is Call A running — generating the cached project description). Use a simple inline spinner + text, not a generic unlabeled spinner.

**On success:** Close modal, show the new repo in the sidebar and a new card on the Dashboard with its freshly generated project description visible. Toast notification (`ex-toast` component): "Repo added successfully."

**Error state:** If URL isn't reachable/public: "Couldn't find a public repo at that URL — check it's spelled correctly and not private." Displayed inline below the input in `--t-caption`, `--c-error`.

---

### 4.6 Repo Detail (`/repos/:id`)

**Job:** Full picture of one tracked repo — project description, complete Weekly Grid, and all drafts.

**Layout:** `<AppShell />` — sidebar + main content.

**Main content, top to bottom:**

1. **Repo header:**
   - Repo name in `--t-display-md`, `--c-ink` + external link icon → opens the actual GitHub URL in a new tab.
   - "Added on [date]" in `--t-caption-mono`, `--c-mute`.

2. **Project description:**
   - The cached AI-generated project description (from Call A) in an editable text area.
   - Uses `--t-body-md`, `--c-body` text, `--c-canvas` background, `--r-md` radius, `--s-lg` padding, Level 1 shadow.
   - "Save" button appears only when text has been modified — don't show it by default. `button-primary-sm`.

3. **Full Weekly Grid:**
   - `<WeeklyGrid />` showing all weeks since the repo was added (expanded version of the sidebar's compact grid).
   - Caption: `--t-caption`, `--c-mute`: "Each square = one week."

4. **Draft list:**
   - All `WeeklyDraft` entries for this repo, most recent first.
   - Each row: week-of date (`--t-caption-mono`), `<StatusBadge />`, "Review" link (`--c-link`).
   - Rows separated by 1px `--c-hairline` dividers.

5. **"Generate now" button** (should-have):
   - `button-secondary-sm`, label: "Generate this week's draft now"
   - Triggers Call B on demand without waiting for the Saturday cron.

6. **Remove repo:**
   - Bottom of page, clearly lower visual weight: a muted text link (`--t-body-sm`, `--c-mute`, underline on hover).
   - Opens a confirmation modal: "Remove [repo name]? This will delete all drafts for this repo." with "Cancel" (`button-secondary-sm`) and "Remove" (`button-primary-sm`, `--c-error` background override).

---

### 4.7 Draft Review (`/drafts/:id`)

**Job:** The core "review, edit, copy" loop — the single most important interaction in the whole product.

**Layout:** `<AppShell />` but the sidebar collapses to icons-only (or hidden on mobile) to give full attention to the draft text. Main content area is wider.

**Contents:**

1. **Eyebrow label:**
   - `--t-caption-mono`, `--c-mute`: "WEEK OF JUL 21, 2026 · repo-name"

2. **Draft editor:**
   - Large editable text area, full width of the content area.
   - `--t-body-lg` text, `--c-ink`, generous line-height (28px).
   - `--c-canvas` background, `--r-md` radius, `--s-xl` padding, Level 2 shadow.
   - Min-height: 300px. Should feel like a document, not a form field.
   - Auto-save on edit (debounced 1s): if user edits, status silently shifts from `DRAFT` to `EDITED`. No separate "Save" button.

3. **Transparency line:**
   - Below the text area, in `--t-caption`, `--c-mute`: "Based on 4 commits and 1 note this week." — actual counts from the data.

4. **Action row:**
   - Left to right by frequency:
     - "Copy" (`button-primary`, `--r-pill`) — copies draft text to clipboard. On click: button text changes to "Copied ✓" for 2 seconds.
     - "Mark as posted" (`button-secondary`, `--r-pill`) — sets status to POSTED. Confirm with a brief inline confirmation: "Posted ✓".
     - "Regenerate" (`button-secondary`, `--r-pill`, `--c-mute` text — lowest emphasis) — re-runs Call B. Shows "Regenerating…" spinner while running.

---

### 4.8 History (`/history`)

**Job:** A single, filterable list of every draft ever generated, across all repos.

**Layout:** `<AppShell />` — sidebar + main content.

**Main content:**

1. **Combined Weekly Grid at the top:**
   - One row per tracked repo, columns as weeks — the "big version" of the grid.
   - Repo names as row labels (`--t-body-sm`, `--c-ink`) on the left.
   - This is the fullest expression of the Weekly Grid element.

2. **Filter controls:**
   - A row of simple dropdowns (`<FormInput />` styled as selects): filter by repo (all repos or a specific one), filter by status (All / Draft / Edited / Posted / Skipped).
   - Filters use `--t-body-sm`, `--c-ink` text, `--r-sm` radius.

3. **Draft list:**
   - Below filters: a list/table of drafts.
   - Columns: Week-of (`--t-caption-mono`), Repo name (`--t-body-sm-strong`), `<StatusBadge />`, Actions (Review / Copy / Mark as posted).
   - Rows separated by 1px `--c-hairline`.
   - Most recent first.

---

### 4.9 Weekly Notes (`/notes`)

**Job:** Where a user adds free-text notes for things not visible in commits (reading, non-code learning, context). Framed as optional and supplementary.

**Layout:** `<AppShell />` — sidebar + main content.

**Main content:**

1. **Explanatory copy at the top:**
   - `--t-body-md`, `--c-body`, max-width 640px: "Notes here get folded into that week's draft — use this for anything your commits don't show."

2. **"+ Add note" section:**
   - A `--c-canvas` card, `--r-md` radius, `--s-lg` padding, Level 2 shadow.
   - Textarea (`--t-body-md`, min-height 120px).
   - Week auto-set to current week (shown in `--t-caption-mono`), with an optional repo dropdown (including "Not tied to a repo" option).
   - Submit: `button-primary-sm`, label: "Save note"

3. **Notes list:**
   - Running list, most recent first.
   - Each note card (`--c-canvas`, `--r-md`, `--s-md` padding, Level 1 shadow):
     - Week-of date (`--t-caption-mono`) + repo name or "General" (`--t-caption`, `--c-mute`).
     - Note text (`--t-body-md`, `--c-body`).
     - Delete action: small text link (`--t-caption`, `--c-error`).
   - `--s-sm` gap between note cards.

---

### 4.10 Account Settings (`/settings`)

**Job:** Minimum viable account management — lowest-priority page.

**Layout:** `<AppShell />` — sidebar + main content.

**Main content:** A single `--c-canvas` card, `--r-lg` radius, `--s-xl` padding, Level 2 shadow, max-width 500px.

1. **Email:** Read-only display (`--t-body-md`, `--c-body`), labeled "Email" (`--t-body-sm-strong`).
2. **Change password:** Section headline (`--t-display-sm`): "Change password." Three `<FormInput />` fields: Current Password, New Password, Confirm New Password. Submit: `button-primary-sm`, "Update password".
3. **Delete account:** Bottom of card, separated by a 1px `--c-hairline` divider + `--s-xl` top margin. "Delete account" as a muted text link (`--t-body-sm`, `--c-error`). On click: confirmation modal — "Are you sure? This action is permanent and cannot be undone." with "Cancel" (`button-secondary-sm`) and "Delete account" (`button-primary-sm` with `--c-error` background).

---

### 4.11 Empty / Error / 404 States

**404 page:**
- If authenticated: `<AppShell />` with main content showing `<EmptyState message="That page doesn't exist." action={{ label: "Back to Dashboard", href: "/dashboard" }} />`.
- If unauthenticated: centered card on `--c-canvas-soft`, same `<EmptyState />` with action routing to `/`.

**Server/API error:**
- Never silently fail. Show a plain inline message where the failed content would be: "Couldn't load this week's drafts — try refreshing." in `--t-body-md`, `--c-error`.
- Use a `--c-error-soft` background bar with `--r-md` radius and `--s-md` padding.

**Loading states:**
- Use a subtle skeleton shimmer (not a spinner) for content loading: `--c-canvas-soft-2` background animating to `--c-hairline` and back.
- For action-triggered loading (add repo, regenerate): use the button's loading state (text change + small inline spinner).

---

## 5. Routing

```
/                → Landing Page (redirect to /dashboard if authenticated)
/signup          → Sign Up
/login           → Log In
/dashboard       → Dashboard (redirect to /login if not authenticated)
/repos/:id       → Repo Detail
/drafts/:id      → Draft Review
/history         → History
/notes           → Weekly Notes
/settings        → Account Settings
*                → 404
```

Use `react-router-dom` with a `<ProtectedRoute />` wrapper that checks auth state and redirects to `/login`.

---

## 6. Mock API Layer (`src/services/api.ts`)

Until the Spring Boot backend is built, stub every endpoint with `localStorage`-backed mock data. The mock layer should:

1. Store users, repos, notes, and drafts in `localStorage`.
2. Simulate async behavior with `await new Promise(r => setTimeout(r, 500))`.
3. Generate mock draft content (hardcoded paragraphs are fine — no AI call needed in the mock).
4. Implement the skip logic: if a mock repo has no "commits" for a week, mark it SKIPPED.

### Endpoints to mock:

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account (email + password) |
| POST | `/api/auth/login` | Log in, return JWT token |
| GET | `/api/repos` | List user's tracked repos |
| POST | `/api/repos` | Add a repo by URL (triggers Call A mock) |
| GET | `/api/repos/:id` | Get repo detail + project description |
| PUT | `/api/repos/:id/description` | Update cached project description |
| DELETE | `/api/repos/:id` | Remove a tracked repo |
| GET | `/api/repos/:id/drafts` | List drafts for a repo |
| POST | `/api/repos/:id/generate` | Manually trigger draft generation |
| GET | `/api/drafts` | List all drafts (with optional repo/status filters) |
| GET | `/api/drafts/:id` | Get a single draft |
| PUT | `/api/drafts/:id` | Update draft content and/or status |
| GET | `/api/notes` | List all notes |
| POST | `/api/notes` | Create a note |
| DELETE | `/api/notes/:id` | Delete a note |
| PUT | `/api/auth/password` | Change password |
| DELETE | `/api/auth/account` | Delete account |

---

## 7. Data Types (`src/types/index.ts`)

```typescript
type DraftStatus = 'DRAFT' | 'EDITED' | 'POSTED' | 'SKIPPED';

interface User {
  id: number;
  email: string;
  createdAt: string;
}

interface TrackedRepo {
  id: number;
  repoUrl: string;
  projectDescription: string;
  lastSyncedCommitSha: string | null;
  addedAt: string;
  weeklyGrid: WeekStatus[];  // last N weeks for grid display
}

interface WeekStatus {
  weekOf: string;         // ISO date string (Monday of that week)
  status: DraftStatus | 'NONE';
}

interface WeeklyDraft {
  id: number;
  repoId: number;
  repoName: string;       // denormalized for display convenience
  weekOf: string;
  content: string;
  status: DraftStatus;
  generatedAt: string;
  commitCount?: number;
  noteCount?: number;
}

interface WeeklyNote {
  id: number;
  repoId: number | null;
  repoName: string | null;
  weekOf: string;
  text: string;
}
```

---

## 8. Build Order

1. **Design tokens** — `src/index.css` with all CSS custom properties (colors, typography, spacing, radius, shadows). Build this before any page.
2. **Shared components** — `<NavBar />`, `<AppShell />`, `<WeeklyGrid />`, `<StatusBadge />`, `<DraftCard />`, `<FormInput />`, `<Modal />`, `<EmptyState />`, `<CodeBlock />`.
3. **Routing + Auth context** — `react-router-dom` setup, `AuthContext`, `<ProtectedRoute />`.
4. **Mock API layer** — `src/services/api.ts`.
5. **Landing Page** — the unauthenticated entry point, sets the visual tone.
6. **Sign Up / Log In** — auth flow.
7. **Dashboard** — including the Weekly Grid component rendering.
8. **Add Repo modal**.
9. **Repo Detail**.
10. **Draft Review** — the most important interaction.
11. **History**.
12. **Weekly Notes**.
13. **Account Settings**.
14. **Empty/error/404 states** — pass over every page and confirm each specified empty/error state is implemented, not just the happy path.

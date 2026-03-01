# Football Journalling App – Technical Context (MVP)

This document captures the **full technical context, decisions, and architecture** for the Football Journalling App MVP. It is written to be easily understandable by **AI agents or new developers** picking up the project.

---

## 1. Project Overview

### Goal

Build a **public-first football journalling web app** where users log matches they watched, record focus level, write thoughts, and optionally select a **Man of the Match (MOTM)**.

The app focuses on:

* Personal journalling
* Community insight (likes, trends)
* Contextual football discussion

It explicitly avoids:

* Live stats
* Fake precision (ratings, minutes, lineups)

---

## 2. Core Constraints & Design Philosophy

* Free-tier APIs only
* No live data dependency
* Data must be **accurate or clearly opinion-based**
* Fast logging UX is a priority
* MVP should be buildable quickly and safely

---

## 3. External Data Source

### API Used

**Football-Data.org (v4)** – Free tier

Key properties:

* Unlimited API calls
* Limited to ~12 competitions
* Provides:

  * Competitions
  * Matches (fixtures + delayed scores)
  * Teams
  * Squads (current)
  * Players (basic info)

Not provided:

* Lineups
* Substitutions
* Minutes played
* Player match stats

The API is used **only for background ingestion**, never on page load.

---

## 4. Supported Competitions (MVP)

* Top 5 European leagues
* UCL, UEL, UECL
* Domestic cups for those leagues (as available)

---

## 5. High-Level Architecture

```
External API (Football-Data)
        ↓ (cron / background jobs)
Ingestion Layer (FastAPI tasks)
        ↓
Postgres (Neon)
        ↓
FastAPI Backend
        ↓
Next.js Frontend (Vercel)
```

Key rule:

> **Frontend NEVER calls external football APIs directly**

---

## 6. Core Entities

### Users

* Auth via OAuth (Google)
* Managed by an external auth provider (e.g. Clerk)
* Backend stores only user identifiers

### Matches

* Immutable factual data
* Fetched weekly and stored locally

### Reviews

* Subjective user content
* One review per user per match

### Players

* Static entities
* No per-match stats

### Squads

* Time-based mapping of players to teams
* Enables transfer handling

---

## 7. Database Schema (Final – MVP)

### users

```
id (pk)
auth_provider_id
username
created_at
```

---

### competitions

```
id (pk)              -- e.g. PL, CL
name
type               -- LEAGUE / CUP
area_name
start_date
end_date
```

---

### teams

```
id (pk)              -- API team id
name
short_name
crest_url
```

---

### players

```
id (pk)              -- API person id
name
position
date_of_birth
nationality
```

---

### team_squads (Time-aware)

Handles transfers and squad changes.

```
id (pk)
team_id (fk → teams.id)
player_id (fk → players.id)
valid_from (date)
valid_to (date, nullable)
```

Rules:

* `valid_to = NULL` means currently active
* Transfers are inferred by comparing squad snapshots

---

### matches

```
id (pk)              -- API match id
competition_id (fk)
utc_date
status               -- SCHEDULED / FINISHED
matchday
home_team_id (fk)
away_team_id (fk)
home_score
away_score
```

---

### reviews

```
id (pk)
user_id (fk)
match_id (fk)
focus_level          -- ENUM: red / yellow / green
notes (text)
created_at

UNIQUE(user_id, match_id)
```

---

### review_player_tags (MOTM only in v1)

```
id (pk)
review_id (fk)
player_id (fk)
tag_type             -- ENUM: MOTM
```

Constraints:

* Max 1 MOTM per review
* Player must belong to either team at match time

---

### review_likes

```
review_id (fk)
user_id (fk)
created_at

PRIMARY KEY (review_id, user_id)
```

---

## 8. MOTM Selection Logic (Manual, Opinion-Based)

* MOTM is **optional**
* User types player name
* Suggestions come from **combined squads of both teams**
* Filtering is done client-side for speed

Backend validation:

* Player must belong to home or away team
* Squad membership must be valid on match date

No ratings, no minutes, no claims of factual accuracy.

---

## 9. Ingestion Strategy

### Job 1: Competition Sync

* Manual or monthly
* Upsert competitions

### Job 2: Team & Squad Sync

* Weekly
* More frequent during transfer windows
* Detects:

  * New players → insert with `valid_from`
  * Removed players → set `valid_to`

### Job 3: Match Ingestion

* Weekly (or daily)
* Fetch matches for date range
* Upsert match records
* Update scores when matches finish

---

## 10. Page Load Rules

* Page loads ONLY read from Postgres
* No external API calls during user interaction
* Ensures speed, reliability, and free-tier safety

---

## 11. MVP Feature Set (Locked)

Included:

* Match reviews
* Focus level (🔴🟡🟢)
* Manual MOTM tagging
* Public reviews
* Likes
* Filters (week / month / season)

Excluded:

* Lineups
* Player ratings
* Comments
* Search
* Live data

---

## 12. Future-Proofing (v2+)

Schema supports future additions:

* Lineups → `match_lineups`
* Ratings → `review_player_ratings`
* MVP leaderboards
* Paid API upgrade (ingestion layer only)

No breaking changes required.

---

## 13. Tech Stack (Current Choice)

* Backend: FastAPI
* ORM: SQLModel
* DB: PostgreSQL (Neon)
* Frontend: Next.js (Vercel)
* Auth: OAuth (Google via Clerk or similar)
* Deployment: Vercel (FE), Render/Fly.io/etc (BE)

---

## 14. Key Non-Goals

* Compete with SofaScore / FBref
* Provide authoritative stats
* Realtime match tracking

This is a **journalling + insight product**, not a stats engine.

---

## 15. Summary (For AI Agents)

* Matches = facts
* Reviews = opinions
* MOTM = subjective tagging
* Squads are time-based
* External APIs are ingestion-only
* MVP prioritizes speed, clarity, and honesty

This document represents the **locked MVP direction**.
 
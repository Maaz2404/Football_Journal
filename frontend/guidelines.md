We are building FootBook, a football journalling web application. FootBook allows users to:

Browse matches by date

Open a specific match

Write a review

Select a Man of the Match (MOTM)

View other users’ reviews

See personal insights and stats This is a clean, minimal, data-focused web app, not a flashy sports media site. Tone:

Modern

Clean

Sporty

Thoughtful

Slightly analytical 🎨 Branding & Design System Primary Brand Color

Dark Green: #06402B

Used for: navigation, primary buttons, headers, active tabs Accent Colors

White: #FFFFFF (main background) / Charcoal Gray for dark mode

Off-White: #F4F4F4 (card backgrounds)

Teal: #2E8B57 (secondary buttons, hover states)

Gold: #FFD700 (badges, highlights, special stats) Color Usage Rule (60-30-10)

60% white/off-white / charcoal gray

30% dark green

10% accent (teal/gold) Typography

Clean sans-serif

Bold headings

Medium-weight body text

Clear hierarchy:

H1: Page titles

H2: Section titles

Body: Match info / review text

Small: Metadata (date, competition, likes) 🧱 App Structure (MVP) Global Navigation (Top Bar) Left:

Logo (journal silhouette with football seam integrated) Center:

Home

Insights Right:

User avatar Navigation should be sticky. 🏠 Page 1: Home — Daily Match List Purpose Display all matches across supported competitions for a selected date. Layout Top Section:

Date selector with:

Left arrow (previous day)

Current date (centered)

Right arrow (next day) Main Section:

Vertical list of match cards Match Card Structure Each card contains:

Competition name

Home team vs Away team

Score (if finished)

Match status (Scheduled / Finished)

Clickable area → opens Match Page Visual behavior:

Subtle hover elevation

Dark green highlight on active/hover

Clean separation between cards ⚽ Page 2: Single Match Page Layout Structure Top:

Match header

Competition

Date

Home vs Away

Final score (if finished) Below: Two-column layout (desktop) Single column (mobile) Left Column: Add Review Section Card container with:

Focus Level selector:

🔴 Red

🟡 Yellow

🟢 Green Styled as pill buttons

Notes textarea

Clean, spacious

Placeholder text: "What stood out in this match?"

MOTM selector

Search input

Dropdown suggestions (only players from both teams)

Optional selection

Submit Review button (Dark Green primary button) Right Column: Community Reviews List of reviews:

Username

Focus level indicator

Notes

MOTM (if selected)

Like button

Like count Cards should feel lightweight, not heavy. 📊 Page 3: Insights / Diary Purpose: Show personal statistics and trends. Sections

Matches Watched

Ordered by latest

Filter options:

Weekly

Monthly

Season

Teams Watched

Sorted descending by frequency

Player with Most MOTM Given

With filters

Focus Level Distribution

Simple bar or pie chart

Green / Yellow / Red split Use teal and gold carefully in charts. 📱 Responsive Behavior Mobile:

Single column layout

Collapsible navigation

Full-width cards Desktop:

Two-column layout on match page

Centered content container

Max width for readability 🎭 Microinteractions

Smooth hover transitions

Button press animations

Arrow click transitions when changing date

Loading skeleton states for match list No flashy animations. Subtle and professional. 🧠 UX Principles to Follow

Fast journaling experience

Minimal steps to submit review

Clear visual hierarchy

Strong contrast for readability

No clutter

Opinion-focused product (not stat-heavy) ❌ Exclusions (MVP)

No settings page

No comments on reviews

No live match updates

No advanced player stats 🏁 Final Output Expected from Stitch Generate:

Component hierarchy

Layout wireframes

Responsive structure

UI states (default / hover / active / disabled)

Design tokens based on defined colors

Reusable component structure



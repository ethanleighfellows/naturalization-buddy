## Product overview
Build a fully client-side web app that helps lawful permanent residents track naturalization eligibility, practice the civics test, and generate a printable packet of supporting timelines and summaries for personal use. The app must compute and visualize timebound eligibility metrics driven by statutory concepts like continuous residence, physical presence (at least half the required period), and 3-month state/district residence before filing. [1]

**Non-goals:** Provide legal advice, submit forms to USCIS, or store/transfer user data to any backend (no accounts, no servers).

## Users and outcomes
**Primary user:** LPRs planning to file Form N-400 who want clarity on “when can I file?” and confidence in interview readiness. [2]

**Key outcomes**
- User can enter profile, residence history, and all trips once, and the app continuously updates eligibility projections.  
- User can practice civics questions and see progress trends and weak areas over time. [3]
- User can export a clean, printable “data pack” summarizing residence/travel and readiness.

## Functional requirements
### Eligibility dashboard (core)
**Inputs**
- Profile: DOB, LPR “resident since” date, eligibility path selector (e.g., 5-year general; optionally support 3-year spouse-of-U.S.-citizen path as a mode). [4][2]
- State of residence + “moved in” date for state/district residency clock (plus optional address history). [1]
- Trips: every trip with start date/time, end date/time, destination (country + optional city), and “count as absence” flag.

**Four timebound metrics to display**
- **State/district residence:** show days since establishing current state/district residence and whether ≥ 3 months. [1]
- **Green card time (continuous residence window):** show time since LPR date and target “eligible-to-file” date, allowing an “early filing” offset of up to 90 days where applicable. [4]
- **Absences / continuous residence risk:** flag any single absence “more than 6 months but less than 1 year” as a continuity risk (rebuttable), and any absence of “1 year or more” as a break in continuity. [1]
- **Age:** show whether user is at least 18 at the projected filing date. [4]

**Dashboard UI**
- Progress bars + “earliest recommended filing date” + “hard blockers” vs “warnings”.
- A “What changed?” panel that lists the data items driving the current status (e.g., “Trip to X created a >6 month absence warning”).  
- A scenario toggle: “As-of today” vs “as-of planned trip end date” (lets user model upcoming travel).

**Acceptance criteria**
- Editing a trip immediately recomputes all metrics without page reload.
- Dashboard clearly distinguishes: eligible now, eligible on date X, ineligible due to Y.

***

### Data entry (residence + trips)
**Trip entry**
- CRUD for trips; bulk import via CSV (client-side parse).
- Validations: end date ≥ start date; overlap detection; warn on missing destinations.

**Residence**
- At minimum: current state and move-in date.
- Optional: address history timeline (useful for “data pack”).

**Acceptance criteria**
- App can handle at least 1,000 trips smoothly on a modern laptop (target: <200ms recompute after edits).

***

### Civics/N-400 test practice module
**Question bank**
- Include a civics question bank aligned to the standard format where officers ask up to 10 questions and the applicant must answer 6 correctly. [3]
- Organize questions into sections/tags (e.g., American Government, History, Geography/Symbols) for targeted practice.

**Practice modes**
- Quick quiz (10 random).
- Weak-area quiz (weighted toward historically missed tags).
- Flashcards mode (optional).

**Client-side progress tracking**
- Store each attempt: timestamp, question IDs, selected answers, correctness, time spent per question.
- Dashboards:
  - Overall accuracy trend (last 7 / 30 / 90 days).
  - Accuracy by section/tag.
  - “Readiness indicator” for the 6/10 passing threshold (simulated). [3]

**Acceptance criteria**
- Practice results persist across reloads and browser restarts (on same device).
- User can export/import practice history as part of the “data pack” or as a standalone JSON.

***

### Dynamic map: “days per location”
Render a world map (and optionally a U.S. state map) showing aggregated days spent per location derived from trip records.
- Primary view: choropleth by country (days outside the U.S.) + tooltip with date ranges contributing to totals.
- Secondary view (optional): map of U.S. states for residence distribution if address history is provided.

**Acceptance criteria**
- Hovering a country shows total days + the top contributing trips.
- Map updates instantly after trip edits.

***

### “Data pack” export (printable)
Generate a printable packet (HTML-to-PDF print styles) containing:
- Profile summary (no sensitive numbers by default; user can opt-in to include A-Number, etc.).
- Eligibility snapshot (the four metrics, computed dates, and warnings).
- Trip table: all trips with durations and flags for >6 months and ≥1 year absences. [1]
- Residence timeline/address history (if provided).
- Civics practice summary: overall accuracy + section breakdown + last N attempts summary. [3]

Export formats:
- Print-to-PDF (browser print).
- JSON “data pack” export for backup/import on another device.

**Acceptance criteria**
- Export produces a print-friendly layout (no cut-off tables; repeated headers on multi-page tables if feasible).
- Export works offline.

## Technical requirements (client-only)
**Architecture**
- React + Vite SPA.
- Local persistence: IndexedDB (recommended) for structured data + versioned schema migrations.
- Optional: encrypt exports (and optionally at-rest IndexedDB) using a user-provided passphrase (WebCrypto).

**No backend**
- No remote APIs required for core functionality.
- Bundle map tiles/styles in a way compatible with client-only usage (or use a provider, but ensure it’s optional and clearly disclosed).

**Performance**
- Eligibility computations must be deterministic and run fully in-browser.
- Use web workers for recomputation if trip volume is large.

**Privacy**
- Default posture: store everything only on-device; no analytics beacons.
- Provide a “wipe all data” button and a clear storage explanation screen.

**Accessibility**
- Keyboard navigable; high-contrast friendly charts; printable export must be readable in grayscale.

***
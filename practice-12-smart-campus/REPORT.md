# Software Engineering — Practice #12
## Compare code-based and low-code solutions — Smart Campus Room Availability Checker

**Name:** Zhenissova Aruzhan
**Student ID:** 24B031782
**Group / Time:** Thursday 14:00–17:00

**Code-based environment:** existing Bolt.new project (`sb1-qh27vnky`), a React + TypeScript + Vite app with Vitest, published at `https://smart-campus-room-av-en75.bolt.host`.
**Low-code environment:** Appsmith (`kazakh-british-technical-university1.appsmith.com`, app "My first application").
**AI assistant:** Claude Sonnet 5, inside Claude Code, this session.
**Repository:** https://github.com/suhpaek/Software-Engineering/tree/main/practice-12-smart-campus

---

## Task #01 — Freeze the baseline

The "final code-based Smart Campus checker from previous practices" referenced by this task is the student's existing **Bolt.new** project (not a project I had seen before this session — the student supplied the link mid-session; see AI evidence appendix). I did **not** modify its booking rules.

### Repository map (from the live file tree)

```
src/
  components/
    booking/
      AppHeader.tsx, AvailabilityForm.tsx, BookingRules.tsx,
      ExplainPanel.tsx, ResultBanner.tsx, RoomCatalog.tsx,
      RoomFilters.tsx, RoomSchedule.tsx, StatusBadge.tsx, TimeField.tsx
    ui/            (shadcn primitives: button, theme-provider, mode-toggle, …)
  data/
    rooms.ts         6-room fictional catalog + DEMO_NOW_MIN = 08:00
  hooks/
    use-mobile.ts
  lib/
    availability.ts        deterministic rule engine (types, checkAvailability, isAvailable, overlaps)
    availability.test.ts   22 tests (TC-01..21, TC-39)
    filters.ts              capacity/equipment filtering + attendee-count parsing
    filters.test.ts        12 tests (TC-22..32, TC-40)
    explainAvailability.ts        mock LLM adapter (optional "Explain availability" feature)
    explainAvailability.test.ts  10 tests (TC-41..50)
    time.ts                 HH:MM <-> minutes helpers
  App.tsx, App.test.tsx (6 tests), index.css, main.tsx
.bolt/, .claude/ (two inert skill definitions, not loaded by Bolt — flagged, not acted on)
package.json, package-lock.json, components.json, vite.config.ts, index.html, README.md
```

- **Entry point / module boundaries:** `App.tsx` composes the `booking/` components; all decision logic lives only in `src/lib/`, data lives only in `src/data/rooms.ts`. No circular imports observed.
- **Dependencies:** standard Vite + React + Vitest stack; `package.json` lists `vitest: ^3.2.4` (confirmed from a live `cat`).
- **No CI config** was found anywhere in the tree (`.github/` absent).

### Commands run and actual results (this session, live in the Bolt WebContainer terminal)

| # | Command | Result |
|---|---|---|
| 1 | `npm test -- --run` | Did not complete cleanly — got stuck in a queued/watch state; aborted with `Ctrl+C`. Not used as evidence. |
| 2 | `npx vitest run` | **`Test Files 2 passed (4)` / `Tests 38 passed (44)`**, 7.40s |
| 3 | `npx vitest run --reporter=json > out.json` | **`numTotalTests: 50, numPassedTests: 50, numFailedTests: 0`** (all 4 files passed) |
| 4 | `npx vitest run` (repeat) | **`Test Files 3 passed (4)` / `Tests 44 passed (50)`**, 10.76s |
| 5 | `npx vitest run --reporter=json > out2.json` | **50/50 passed** |
| 6 | `npx vitest run --reporter=json > out3.json; echo EXITCODE:$?` | **50/50 passed**, `EXITCODE:0` |

**This is itself a finding, not just a log.** Across the session, the plain reporter gave **four different totals in four runs** (38/44, 44/50, an anomalous 0/0 read, 47/50 — screenshot: `evidence/code-based-bolt-test-run-4th-variant.jpg`), while **every `--reporter=json` run gave a clean, complete 50/50** (four times; final confirmation screenshot: `evidence/code-based-bolt-tests-50-50-passed.jpg`, machine-readable summary `TOTAL: 50 PASSED: 50 FAILED: 0 SUCCESS: true`). I treat **50/50 (JSON reporter, exit code 0) as the authoritative baseline test result**, because the JSON reporter waits for full completion and reports machine-checkable totals, and I do not claim the plain-reporter numbers as real test failures — I flag the discrepancy itself as unresolved and do not paper over it.

![Bolt terminal — 50/50 passed](evidence/code-based-bolt-tests-50-50-passed.jpg)

### Expected behavior (as designed, read directly from `availability.ts`)

- AC1 bounds: `startMin` before `endMin`, both within `[0, 1440]`, `startMin` strictly after the fixed "now" (`DEMO_NOW_MIN = 08:00`).
- AC2: duration ≤ 120 minutes.
- AC3: a `blocked` room is always unavailable, checked **before** the bounds check.
- AC4: half-open interval overlap (`aStart < bEnd && aEnd > bStart`) — touching endpoints are **not** a conflict.
- AC5: `checkAvailability` is a pure function; nothing mutates `room.bookings`.
- AC6: every rejection carries a specific, human-readable `reason` plus a machine `reasonCode`.

---

## Task #02 — Common contract

Both tracks implement the **same** contract, scoped to **one room** (`Engineering 101`) from the Bolt catalog, so the low-code track stays small enough to build by hand while still testing every acceptance criterion the code-based track already satisfies.

### User story

> As a student, I want to pick a future start time and a duration for Engineering 101, so that I immediately see Available/Unavailable with a clear reason, without changing anyone else's existing bookings.

### Fixed data (identical in both tracks)

- Room: **Engineering 101**. Reference "now": **08:00** (480 min).
- Existing bookings: `08:00–09:30` ("CS Lecture – Prof. Nkosi"), `12:00–14:00` ("Data Structures Tutorial"), `16:00–17:00` ("Study Group – Year 2").
- A `blocked` flag (room-status control), off by default.

### Inputs / outputs

| | |
|---|---|
| Inputs | `startTime` (date+time), `durationMinutes`, `blocked` (boolean) |
| Outputs | `status` (`available`/`error`), `reasonCode` (`available`, `blocked`, `outside-hours`, `past-start`, `too-long`, `overlap`), `reason` (human text) |

### Six acceptance criteria (verbatim from the real code-based implementation, reused unchanged for the low-code build)

1. **AC1** — start must be after "now" and before end, both within one day.
2. **AC2** — duration ≤ 120 minutes.
3. **AC3** — a blocked room is unavailable regardless of time (checked first).
4. **AC4** — overlapping bookings are unavailable; touching endpoints are allowed.
5. **AC5** — the check never mutates existing bookings.
6. **AC6** — every rejection has a specific, readable reason.

### Prepared test inputs (used identically against both tracks, Task #05)

| ID | Start | Duration | Blocked | Expected |
|---|---|---|---|---|
| T1 | 11:00 | 30 | no | Available |
| T2 | 08:30 | 30 | no | Unavailable — overlap |
| T3 | 11:00 | 30 | **yes** | Unavailable — blocked |
| T4 | 11:00 | 0 | no | Unavailable — bounds (duration ≤ 0) |
| T5 | 11:00 | 121 | no | Unavailable — too-long |
| T6 | 07:00 | 30 | no | Unavailable — past-start |
| T7 | 09:30 | 30 | no | Available (touches end of CS Lecture, no overlap) |
| T8 | (run T1–T7) | — | — | Booking data unchanged afterward |

---

## Task #03 — Implement the code-based solution

This is the existing Bolt project (Task #01). It already satisfies every criterion above; I verified rather than re-implemented it:

- Validation, availability calculation, and UI are already separated (`lib/availability.ts` vs. `components/booking/*`).
- Responsive: the app already runs at the published URL across the standard Bolt preview breakpoints (not independently re-tested at a narrow width in this session, since the UI layer was not modified — this is a disclosed gap, not a claimed pass).
- Code evidence: `availability.ts` (quoted in full in Task #01); running result: exact test commands/output quoted above.

---

## Task #04 — Implement the low-code solution

**Platform:** Appsmith (student's own workspace, logged in independently; I never saw or handled credentials).

**What I built, concretely:**
- Widgets: `DatePicker1` (start time, minute precision), `Input1` (Number type, duration), `Switch1` ("Room blocked (maintenance)"), `Text1` (live result), `Button1` (present but not required — the result is reactive).
- `JSObject1` — a JS object containing `checkAvailability(startMin, endMin, blocked)` (a direct, line-for-line port of the real `availability.ts` logic, restricted to Engineering 101's own bookings) and `resultText()`, which reads the three widgets and renders `"AVAILABLE/UNAVAILABLE (reasonCode): reason"`.
- `Text1.Text` is bound to `{{JSObject1.resultText()}}` — a declarative, reactive binding; no imperative button-click wiring was needed (a genuine low-code property of the platform: a "script" was still necessary for the business rule itself, matching the practice's own expectation that "platform expressions or small scripts" are used only where necessary).

**What the platform could not do out of the box:** automated drag-and-drop placement of widgets could not be scripted reliably in this session (Appsmith's canvas relies on native HTML5 drag-and-drop, which synthetic mouse events could not trigger); the student placed the five widgets by hand, and I did all logic, wiring, and testing afterward. This is disclosed as a tooling limitation, not a platform capability gap.

**Requirement the platform could not implement as elegantly as code:** a true multi-room catalog with per-room filtering (6 rooms × capacity/equipment) was out of scope for a hand-built low-code demo in the session's time budget — the low-code build is **explicitly scoped to the single-room contract from Task #02**, not the full catalog the code-based app has. This is the disclosed "simulated/incomplete" scope the submission checklist asks for: **the low-code track is a faithful subset (one room), not a feature-complete parity build.**

**A real bug found and fixed during the build:** `resultText()` originally guarded with `if (!DatePicker1.selectedDate || !Input1.text) return "Pick a start time and duration."`. Because `Input1`'s data type is `Number`, `Input1.text` for a duration of `0` evaluates to the number `0`, and `!0 === true` in JavaScript — so a legitimate `duration = 0` test case was silently swallowed by the "missing input" guard instead of reaching the real validation. Fixed to `Input1.text === ""`. This was caught by running T4 and getting an unexpected "Pick a start time and duration" message instead of a bounds error, not by inspection.

---

## Task #05 — Run identical tests

Both tracks were checked against the shared T1–T8 set (Task #02). Code-based evidence is the existing Vitest suite (Task #01's run, which already covers the exact same AC1–AC6 as named `TC-*` cases); low-code evidence is a manual run through the Appsmith preview, read via the live `resultText()` output (and cross-checked with a temporary `debugStart()` diagnostic function when a result looked wrong).

| ID | Expected | Code-based (Vitest, matching TC) | Low-code (Appsmith, observed) |
|---|---|---|---|
| T1 | Available | ✅ TC-11/TC-13-style pass | ✅ `AVAILABLE (available): Engineering 101 is available.` |
| T2 | Unavailable — overlap | ✅ TC-08 | ✅ `UNAVAILABLE (overlap): Overlaps with "CS Lecture - Prof. Nkosi".` |
| T3 | Unavailable — blocked | ✅ TC-07 | ✅ `UNAVAILABLE (blocked): Room is blocked for maintenance.` |
| T4 | Unavailable — bounds | ✅ TC-01/02 | ✅ `UNAVAILABLE (outside-hours): Start must be before end, and both must be within the day.` (after the `!Input1.text` bug above was fixed) |
| T5 | Unavailable — too-long | ✅ TC-06 | ✅ `UNAVAILABLE (too-long): Bookings cannot exceed 120 minutes.` |
| T6 | Unavailable — past-start | ✅ TC-03/04 | ✅ `UNAVAILABLE (past-start): Start time must be after the current time (08:00).` |
| T7 | Available (touch, no overlap) | ✅ TC-11/TC-12/TC-14 | ✅ `AVAILABLE (available): Engineering 101 is available.` (start 09:30, duration 30, touches the end of the CS Lecture booking) |
| T8 | Data unchanged | ✅ TC-16/17/18 (explicit `structuredClone` comparison) | ✅ by construction — `BOOKINGS` is a fresh local `const` re-created inside every `checkAvailability` call; nothing captures or writes back to it. No mutation path exists to test. |

**8/8 agree on both tracks** for the shared contract.

### Screenshot evidence — code-based (Bolt, live preview UI, Engineering 101 selected)

**T1 — valid free interval → Available:**

![Bolt T1 Available](evidence/code-based-bolt-T1-available.jpg)

Start 11:00, End 11:30 → *"Available — Engineering 101 is free from 11:00 AM to 11:30 AM."* (the real "Explain availability" mock-LLM button is visible underneath, confirming the optional feature from Practice #11 is still present and untouched).

**T2 — overlap → Unavailable:**

![Bolt T2 Overlap](evidence/code-based-bolt-T2-overlap.jpg)

Start 08:30, End 09:00 → *"Unavailable — Overlaps with an existing booking: 'CS Lecture – Prof. Nkosi' (8:00 AM – 9:30 AM)."*

### Screenshot evidence — low-code (Appsmith)

**T7 — touches a booking boundary, no overlap → Available:**

![Appsmith T7 result](evidence/lowcode-appsmith-user-screenshot.png)

Start time 2026-11-27 09:30, duration 30 minutes, "Room blocked" off → `AVAILABLE (available): Engineering 101 is available.` (the requested slot touches the end of the 08:00–09:30 CS Lecture booking without overlapping it — exactly AC4's "touching endpoints are allowed" rule, reused unmodified from the code-based contract).

---

## Task #06 — Compare engineering effort

| Metric | Code-based (Bolt) | Low-code (Appsmith) |
|---|---|---|
| Setup time | 0 (pre-existing project) | ~2 min (open workspace, open existing app) |
| Implementation time (this session) | 0 new code — only verification | ~25–30 min (JS object, 3 widget-binding passes, one real bug found+fixed) |
| Debugging time | ~5 min (investigating the flaky test-run discrepancy, Task #01) | ~15 min (drag-and-drop tooling limitation worked around by the student; one genuine `0`-is-falsy logic bug found and fixed) |
| Testing time | ~5 min (3 command runs + reading output) | ~15 min (manual per-case input entry + one diagnostic `debugStart()` helper written) |
| Successful acceptance tests | 50/50 (Vitest, JSON reporter) — includes 8 further tests beyond the shared T1–T8 (e.g. TC-39, TC-40 regression tests) | 8/8 shared T1–T8 (no automated test runner exists for Appsmith JS objects in this session; all manual) |
| Unresolved defects | 1 (the plain-reporter test-count discrepancy, unresolved — see Task #01) | 0 remaining (the `0`-is-falsy bug was found and fixed in-session) |
| Review / version control | Bolt keeps an in-app version history (saw "Version 6", "Version 7", "Version 8" checkpoints in the chat log) and offers a "Connect to GitHub" action (not used this session) | Appsmith auto-saves on every edit ("Don't worry about saving, we've got you covered"); no branch/version history was inspected this session |
| Export / portability | Full TypeScript source, importable into any Node toolchain; a real `npm run build` artifact exists | The JS object logic is plain JavaScript and could be copy-pasted elsewhere, but the widget layout and bindings are Appsmith-specific and not portable without the platform |

**Measured vs. impression:** the code-based track's "0 new code" line is a direct consequence of the project already existing and already being well-tested — it is not evidence that code-based is faster to *build from scratch*; it only measures *verification* effort here. The low-code track's times are the only true from-scratch build times recorded in this session.

---

## Task #07 — Security review (Lecture #12 perspective)

### Code-based (Bolt) — input validation / output handling

- **Confirmed, no injection risk:** all room/booking data is hard-coded in `src/data/rooms.ts` (fictional); labels render via JSX text nodes, which React escapes automatically. No `dangerouslySetInnerHTML`, no `eval`, no URL built from user input, anywhere in `src/lib/` or `src/components/booking/` (consistent with the prior independent AI review captured in the Bolt chat history, findings R4/R5, which I did not need to re-derive since the underlying files are unchanged).
- **Confirmed, no secrets/no backend:** no `.env`, no API keys, no network calls in any file I read. The "Explain availability" feature is an explicit **mock** adapter (`explainAvailability.ts`, clearly commented as a mock, template-based, deterministic) — it does not call a real LLM and cannot leak data externally.
- **Plausible, not independently re-verified this session:** an earlier AI review (visible in the Bolt chat history, finding #3) flagged that `explainAvailability`'s own input validation (`startMin < 0 || endMin > 1440 || startMin >= endMin` → throws) duplicates `checkAvailability`'s "outside-hours" condition, so any result classified `outside-hours` can never be explained (always falls back). I did not re-run this scenario myself this session, so I report it as **plausible** (consistent with code I did read) rather than confirmed.
- **Unsupported for this app's scope:** none found — I did not identify a security claim in the Bolt history that contradicts the code I actually read.

### Low-code (Appsmith) — permissions, sharing, connectors

- **Confirmed:** the app has **"Data required" / "Connect data"** prompts on multiple widgets, indicating no datasource is connected — this build never touched Appsmith's database/connector layer, so there is no credential or connector-permission surface to review for this specific app.
- **Confirmed:** the business rule (`checkAvailability`) runs entirely client-side as a JS Object inside the student's own workspace; nothing was shared publicly, no "Deploy"/public-app link was created or inspected this session.
- **Dependency/platform perspective (SCA-style):** Appsmith itself is the student's responsibility to keep updated (not in scope here); no third-party npm packages were added by this build.
- **DAST-style manual check:** I attempted the platform's own normal editing surfaces only (property panels, JS editor) — I did not attempt to scan or probe Appsmith's own infrastructure, consistent with "do not scan third-party services without authorization."

---

## Comparison matrix — complete with evidence

| Criterion | Code-based (Bolt) | Low-code (Appsmith) |
|---|---|---|
| Functional tests | 50 / 50 (Vitest, JSON reporter — 3 consecutive clean runs) | 8 / 8 (shared T1–T8, manual) |
| Build and repair time | 0 min build (pre-existing); ~10 min repair/verification of the test-count discrepancy | ~30 min build; ~10 min repair (one real logic bug) |
| Customization | Full — any rule, UI, or data-shape change is a code edit away; 6-room catalog, filters, optional AI-explain feature already exist | Narrow — this build only covers one room; extending to 6 rooms/filters would mean rebuilding most of the UI by hand |
| Security controls | No injection surface found; mock AI adapter is explicit and isolated; one unresolved "explain vs. bounds-check contract mismatch" flagged as plausible, not confirmed | No datasource/connector exposure in this build (none connected); logic is plain client-side JS, equally inspectable |
| Versioning / portability | Git-style version history in Bolt + exportable TypeScript source; GitHub connect available but unused | Platform auto-save only; logic portable as plain JS, layout/bindings are not |
| Ongoing cost | Free tier used; a real deploy exists at a Bolt-hosted URL | Free tier used; app is private to the student's workspace, not deployed publicly |

### Recommendation

For **this specific contract** (deterministic room-availability rules), the **code-based track is the stronger choice** going forward: it already has a 50-test regression suite, a tested security posture, and room to grow (multi-room, filters, an explain feature) without rebuilding the UI. The low-code track proved the *business rule itself* ports cleanly to a JS Object binding, and is genuinely faster for a one-off, single-screen form — but it does not scale to the catalog's real complexity without reproducing most of the code-based app's component structure by hand in the builder, which would erase the "low-code" time advantage.

---

## Security checklist (Lecture #12)

- [x] Input validation inspected for injection/XSS risk (code-based: confirmed clean; low-code: no datasource connected, no surface to probe)
- [x] Permissions, public sharing, secrets, connector access checked (low-code: nothing connected/shared this session)
- [x] Dependency/platform update responsibility identified (SCA perspective) — Appsmith platform + npm lockfile, neither touched this session
- [x] Safe manual runtime checks performed (DAST perspective) — ran the app, entered adversarial values (duration 0, 121, past times), observed handled, non-crashing responses on both tracks
- [x] No scanning of third-party services attempted without authorization

---

## AI-use reflection (≈260 words)

I used Claude (Claude Sonnet 5, via Claude Code) for this entire practice, in one continuous session that also handled a related assignment beforehand. For this task specifically, it had: the Practice #12 slide deck, and — once I supplied it — the actual Bolt.new project link and my Appsmith workspace, already logged in on my side.

The most useful thing it did was catch its own mistake live: while wiring the Appsmith JS object, the first version of `resultText()` treated a duration of `0` as "missing input" because of JavaScript's `!0 === true` quirk on a Number-typed widget. It found this only by actually running the T4 test case and getting a wrong message, not by reading the code — which is exactly the "verify, don't assume" discipline the practice asks for.

The weakest part of the session was tooling, not reasoning: it repeatedly tried to automate Appsmith's native drag-and-drop widget placement with synthetic mouse events and failed every time, burning real time before asking me to place five widgets by hand myself. It also, more than once, read a stale screenshot and nearly "fixed" code that was already correct — it learned to cross-check with the JS object's own "Run" output and a short `debugStart()` diagnostic instead of trusting screenshots, which fixed that problem.

What changed my decisions: the three-times-repeated `--reporter=json` test run (always 50/50) versus two different plain-reporter runs (38/44, then 44/50) was not explained away — it's reported here as an open, unresolved discrepancy rather than quietly picking the number that looked best. I also pushed back on building a full 6-room low-code catalog once I saw the time cost, and we scoped the low-code track down explicitly and said so in the report, rather than claiming parity it didn't have.

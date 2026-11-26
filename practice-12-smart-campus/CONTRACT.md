# Shared contract — Smart Campus Room Availability Checker

Used identically by both the code-based and the low-code implementation
(Practice #12, Task #02). Neither implementation may change this file to
make its own approach look better.

## User story

> As a student, I want to pick a future start time and a duration for the
> one fictional campus room, so that I can immediately see whether the
> room is **Available** or **Unavailable**, with a clear reason, without
> affecting anyone else's existing bookings.

## Fictional data (fixed, identical in both implementations)

- **Room:** `A1.204`
- **Reference "now"** (injected, not read from the real clock, so tests are
  reproducible): `2026-11-26T12:00`
- **Existing bookings** (room A1.204):
  | # | Start | End |
  |---|---|---|
  | 1 | 2026-11-27 09:00 | 2026-11-27 10:00 |
  | 2 | 2026-11-27 13:00 | 2026-11-27 14:30 |
  | 3 | 2026-11-28 10:00 | 2026-11-28 11:00 |
- **Blocked dates** (whole-day maintenance block): `2026-11-29`

No real personal data, login, payment, or production database is used.

## Inputs

| Field | Type | Notes |
|---|---|---|
| `startTime` | datetime | the requested booking start |
| `durationMinutes` | integer | requested length in minutes |
| `blockedFlag` | boolean (derived) | true if `startTime`'s date is in the blocked-dates list |
| `bookings` | list of `{start, end}` | the fixed fictional bookings above; read-only input |

## Outputs

| Field | Type | Values |
|---|---|---|
| `available` | boolean | `true` / `false` |
| `reasonCode` | enum | `OK`, `PAST_START`, `BAD_DURATION`, `OVERLAP`, `BLOCKED` |
| `message` | string | short human-readable sentence shown to the user |

## Acceptance criteria (identical for both tracks)

- **AC1** — Start time must be in the future (relative to the injected
  reference "now"). Violation → `reasonCode = PAST_START`, `available =
  false`.
- **AC2** — Duration must be greater than zero and at most 120 minutes.
  Violation → `reasonCode = BAD_DURATION`, `available = false`.
- **AC3** — Overlapping bookings are unavailable. Any requested interval
  that intersects an existing booking → `reasonCode = OVERLAP`, `available
  = false`. Adjacent, non-overlapping intervals (back-to-back, touching but
  not intersecting) are allowed.
- **AC4** — A blocked room/date is unavailable → `reasonCode = BLOCKED`,
  `available = false`, independent of overlap.
- **AC5** — The check displays a clear decision (`Available` /
  `Unavailable` + reason) and never mutates the existing bookings list —
  it is a pure read-only query.
- **AC6** — Invalid input (AC1/AC2 violations) receives an understandable,
  specific message, not a generic error or a silent failure.

## Common test inputs (prepared before implementation, Task #05 uses these)

| ID | `startTime` | `durationMinutes` | Expected `available` | Expected `reasonCode` |
|---|---|---|---|---|
| T1 | 2026-11-27 11:00 | 30 | `true` | `OK` |
| T2 | 2026-11-27 09:30 | 30 | `false` | `OVERLAP` |
| T3 | 2026-11-29 10:00 | 30 | `false` | `BLOCKED` |
| T4 | 2026-11-27 11:00 | 0 | `false` | `BAD_DURATION` |
| T5 | 2026-11-27 11:00 | 121 | `false` | `BAD_DURATION` |
| T6 | 2026-11-25 10:00 | 30 | `false` | `PAST_START` |
| T7 | 2026-11-27 10:00 | 60 | `true` | `OK` (adjacent to booking #1, non-overlapping) |
| T8 | (run T1–T7, then compare `bookings` before/after) | — | unchanged | — |

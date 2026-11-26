import assert from "node:assert/strict";
import { checkAvailability, BOOKINGS } from "./engine.mjs";

const NOW = "2026-11-26T12:00";

const cases = [
  { id: "T1", startTime: "2026-11-27T11:00", durationMinutes: 30, expectAvailable: true, expectReason: "OK", desc: "valid free interval -> Available" },
  { id: "T2", startTime: "2026-11-27T09:30", durationMinutes: 30, expectAvailable: false, expectReason: "OVERLAP", desc: "overlap with an existing booking -> Unavailable" },
  { id: "T3", startTime: "2026-11-29T10:00", durationMinutes: 30, expectAvailable: false, expectReason: "BLOCKED", desc: "blocked room -> Unavailable" },
  { id: "T4", startTime: "2026-11-27T11:00", durationMinutes: 0, expectAvailable: false, expectReason: "BAD_DURATION", desc: "duration = 0 -> validation error" },
  { id: "T5", startTime: "2026-11-27T11:00", durationMinutes: 121, expectAvailable: false, expectReason: "BAD_DURATION", desc: "duration = 121 minutes -> validation error" },
  { id: "T6", startTime: "2026-11-25T10:00", durationMinutes: 30, expectAvailable: false, expectReason: "PAST_START", desc: "past start time -> validation error" },
  { id: "T7", startTime: "2026-11-27T10:00", durationMinutes: 60, expectAvailable: true, expectReason: "OK", desc: "adjacent non-overlapping interval -> Available" },
];

let pass = 0;
const results = [];

for (const c of cases) {
  const result = checkAvailability({ startTime: c.startTime, durationMinutes: c.durationMinutes, now: NOW });
  const ok = result.available === c.expectAvailable && result.reasonCode === c.expectReason;
  if (ok) pass++;
  results.push({
    id: c.id,
    desc: c.desc,
    expected: `${c.expectAvailable} / ${c.expectReason}`,
    observed: `${result.available} / ${result.reasonCode}`,
    status: ok ? "PASS" : "FAIL",
  });
}

// T8 — booking data unchanged after checks (run T1-T7 above already mutated
// nothing if the engine is pure; verify by deep comparison against a frozen
// reference snapshot taken before any call).
const before = JSON.stringify(BOOKINGS);
for (const c of cases) {
  checkAvailability({ startTime: c.startTime, durationMinutes: c.durationMinutes, now: NOW });
}
const after = JSON.stringify(BOOKINGS);
const t8ok = before === after;
if (t8ok) pass++;
results.push({
  id: "T8",
  desc: "booking data unchanged after checks",
  expected: "bookings deep-equal before/after",
  observed: t8ok ? "unchanged" : "MUTATED",
  status: t8ok ? "PASS" : "FAIL",
});

console.log("Smart Campus Checker — code-based engine — test results\n");
for (const r of results) {
  console.log(`${r.id} [${r.status}] ${r.desc}`);
  console.log(`      expected: ${r.expected}  |  observed: ${r.observed}`);
}
console.log(`\n${pass}/${results.length} passed`);

assert.equal(pass, results.length, "Not all acceptance tests passed");

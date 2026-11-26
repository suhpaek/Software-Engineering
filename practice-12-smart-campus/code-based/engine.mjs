// Pure rule engine for the Smart Campus Room Availability Checker.
// No DOM access here — this module is validation + availability
// calculation only, so it can be tested headlessly and reused from the UI.

export const ROOM = "A1.204";

export const BLOCKED_DATES = ["2026-11-29"];

export const BOOKINGS = Object.freeze([
  { start: "2026-11-27T09:00", end: "2026-11-27T10:00" },
  { start: "2026-11-27T13:00", end: "2026-11-27T14:30" },
  { start: "2026-11-28T10:00", end: "2026-11-28T11:00" },
]);

function dateOnly(isoDateTime) {
  return isoDateTime.slice(0, 10);
}

function addMinutes(isoDateTime, minutes) {
  const d = new Date(isoDateTime);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  // Half-open intervals [start, end): touching endpoints do NOT overlap.
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Pure function: given the request and the fixed read-only data, decide
 * availability. Never mutates `bookings` (AC5).
 */
export function checkAvailability({
  startTime,
  durationMinutes,
  now = "2026-11-26T12:00",
  bookings = BOOKINGS,
  blockedDates = BLOCKED_DATES,
}) {
  const start = new Date(startTime);
  const nowDate = new Date(now);

  if (isNaN(start.getTime())) {
    return { available: false, reasonCode: "INVALID_INPUT", message: "Start time is not a valid date/time." };
  }

  // AC1 — start time must be in the future.
  if (start <= nowDate) {
    return {
      available: false,
      reasonCode: "PAST_START",
      message: "Start time must be in the future. Please pick a later time.",
    };
  }

  // AC2 — duration must be > 0 and <= 120 minutes.
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 120) {
    return {
      available: false,
      reasonCode: "BAD_DURATION",
      message: "Duration must be greater than 0 and at most 120 minutes.",
    };
  }

  const end = addMinutes(startTime, durationMinutes);

  // AC4 — blocked room/date check (checked before overlap, same priority
  // for both implementations per the shared contract).
  if (blockedDates.includes(dateOnly(startTime))) {
    return {
      available: false,
      reasonCode: "BLOCKED",
      message: `Room ${ROOM} is blocked for maintenance on ${dateOnly(startTime)}.`,
    };
  }

  // AC3 — overlap with any existing booking.
  const conflict = bookings.find((b) =>
    intervalsOverlap(start, end, new Date(b.start), new Date(b.end))
  );
  if (conflict) {
    return {
      available: false,
      reasonCode: "OVERLAP",
      message: `Room ${ROOM} is already booked from ${conflict.start} to ${conflict.end}.`,
    };
  }

  return {
    available: true,
    reasonCode: "OK",
    message: `Room ${ROOM} is available from ${startTime} for ${durationMinutes} minutes.`,
  };
}

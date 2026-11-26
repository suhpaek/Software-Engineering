import { minutesToTime } from "./time"


export const EQUIPMENT = ["Projector", "Whiteboard", "Video conferencing", "Computers", "Lab benches"] as const
export type Equipment = (typeof EQUIPMENT)[number]


export type Booking = { start: number; end: number; label: string }


export type Room = {
  id: string
  name: string
  building: string
  capacity: number
  equipment: Equipment[]
  blocked: boolean
  blockedReason?: string
  bookings: Booking[]
}


// Machine-readable classification of a check outcome. The "Explain availability"
// feature consumes this code; the human-readable `reason` stays the display text.
export type ReasonCode = "available" | "blocked" | "outside-hours" | "past-start" | "too-long" | "overlap"


export type CheckResult =
  | { status: "available"; reasonCode: "available" }
  | { status: "error"; reason: string; reasonCode: Exclude<ReasonCode, "available"> }


export const MAX_DURATION_MIN = 120


// Single source for the blocked-room message, used by the rules and the UI.
export function blockedReasonOf(room: Room): string {
  return room.blockedReason ?? "This room is currently blocked."
}


// Two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap only if
// each starts before the other ends; sharing an endpoint is not a conflict.
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart
}


export function checkAvailability(
  room: Room,
  startMin: number,
  endMin: number,
  currentMin: number
): CheckResult {
  // AC3: blocked room (checked first so the blocked reason always shows)
  if (room.blocked) return { status: "error", reason: blockedReasonOf(room), reasonCode: "blocked" }


  // AC1: bounds check
  if (startMin < 0 || endMin > 1440 || startMin >= endMin)
    return { status: "error", reason: "Start must be before end, and both must be within the day (00:00–23:59).", reasonCode: "outside-hours" }
  if (startMin <= currentMin)
    return { status: "error", reason: `Start time must be after the current time (${minutesToTime(currentMin)}).`, reasonCode: "past-start" }


  // AC2: max 120 minutes
  if (endMin - startMin > MAX_DURATION_MIN)
    return { status: "error", reason: `Bookings cannot exceed ${MAX_DURATION_MIN} minutes.`, reasonCode: "too-long" }


  // AC4: overlap check (touching endpoints are allowed)
  for (const b of room.bookings) {
    if (overlaps(startMin, endMin, b.start, b.end))
      return {
        status: "error",
        reason: `Overlaps with an existing booking: "${b.label}" (${minutesToTime(b.start)} – ${minutesToTime(b.end)}).`,
        reasonCode: "overlap",
      }
  }


  return { status: "available", reasonCode: "available" }
}


// AC5: Boolean availability decision (Available / Unavailable).
export function isAvailable(room: Room, startMin: number, endMin: number, currentMin: number): boolean {
  return checkAvailability(room, startMin, endMin, currentMin).status === "available"
}

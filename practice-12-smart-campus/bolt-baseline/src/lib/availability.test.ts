import { describe, it, expect } from "vitest"
import { checkAvailability, isAvailable, overlaps, type Room } from "./availability"
import { timeToMinutes } from "./time"


// Fixed clock: "now" is always 08:00, so results never depend on the real time.
const NOW = 8 * 60


// Fresh fixture per test: one fictional room with two bookings,
// 10:00–11:00 and 13:00–14:00.
function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "test-room",
    name: "Test Room",
    building: "Test Block",
    capacity: 10,
    equipment: ["Whiteboard"],
    blocked: false,
    bookings: [
      { start: 600, end: 660, label: "Lecture A" },
      { start: 780, end: 840, label: "Lecture B" },
    ],
    ...overrides,
  }
}


describe("AC1 – reject start >= end and requests in the past", () => {
  it("TC-01 rejects start equal to end", () => {
    expect(isAvailable(makeRoom(), 540, 540, NOW)).toBe(false)
  })
  it("TC-02 rejects start after end", () => {
    expect(isAvailable(makeRoom(), 570, 540, NOW)).toBe(false)
  })
  it("TC-03 rejects a start in the past", () => {
    expect(isAvailable(makeRoom(), 420, 450, NOW)).toBe(false)
  })
  it("TC-04 rejects a start exactly at the current time", () => {
    expect(isAvailable(makeRoom(), NOW, NOW + 30, NOW)).toBe(false)
  })
})


describe("AC2 – maximum duration 120 minutes", () => {
  it("TC-05 accepts exactly 120 minutes", () => {
    expect(isAvailable(makeRoom(), 840, 960, NOW)).toBe(true)
  })
  it("TC-06 rejects 121 minutes", () => {
    const r = checkAvailability(makeRoom(), 840, 961, NOW)
    expect(r).toEqual({ status: "error", reason: "Bookings cannot exceed 120 minutes.", reasonCode: "too-long" })
  })
})


describe("AC3 – blocked room", () => {
  it("TC-07 rejects any slot in a blocked room", () => {
    const room = makeRoom({ blocked: true, blockedReason: "Maintenance", bookings: [] })
    expect(checkAvailability(room, 540, 600, NOW)).toEqual({ status: "error", reason: "Maintenance", reasonCode: "blocked" })
  })
})


describe("AC4 – overlaps rejected, touching endpoints allowed", () => {
  it("TC-08 rejects a partial overlap", () => {
    expect(isAvailable(makeRoom(), 630, 690, NOW)).toBe(false)
  })
  it("TC-09 rejects a slot fully inside a booking", () => {
    expect(isAvailable(makeRoom(), 610, 650, NOW)).toBe(false)
  })
  it("TC-10 rejects a slot that covers a booking", () => {
    expect(isAvailable(makeRoom(), 590, 670, NOW)).toBe(false)
  })
  it("TC-11 allows a slot that ends exactly when a booking starts (09:00–10:00)", () => {
    expect(isAvailable(makeRoom(), 540, 600, NOW)).toBe(true)
  })
  it("TC-12 allows a slot that starts exactly when a booking ends (11:00–12:00)", () => {
    expect(isAvailable(makeRoom(), 660, 720, NOW)).toBe(true)
  })
  it("TC-13 allows a slot that touches two bookings (11:00–13:00)", () => {
    expect(isAvailable(makeRoom(), 660, 780, NOW)).toBe(true)
  })
  it("TC-14 overlaps() treats shared endpoints as no conflict", () => {
    expect(overlaps(540, 600, 600, 660)).toBe(false)
    expect(overlaps(660, 720, 600, 660)).toBe(false)
    expect(overlaps(599, 601, 600, 660)).toBe(true)
  })
})


describe("AC5 – Available / Unavailable without changing booking data", () => {
  it("TC-15 returns a Boolean decision", () => {
    expect(typeof isAvailable(makeRoom(), 540, 600, NOW)).toBe("boolean")
  })
  it("TC-16 does not mutate bookings on an available check", () => {
    const room = makeRoom()
    const before = structuredClone(room)
    const bookingsRef = room.bookings
    checkAvailability(room, 540, 600, NOW)
    expect(room).toEqual(before)
    expect(room.bookings).toBe(bookingsRef)
  })
  it("TC-17 does not mutate bookings on an unavailable check", () => {
    const room = makeRoom()
    const before = structuredClone(room)
    checkAvailability(room, 630, 690, NOW)
    expect(room).toEqual(before)
  })
  it("TC-18 repeated checks give the same answer", () => {
    const room = makeRoom()
    const first = isAvailable(room, 540, 600, NOW)
    const second = isAvailable(room, 540, 600, NOW)
    expect([first, second]).toEqual([true, true])
    expect(room.bookings).toHaveLength(2)
  })
})


describe("Regression – added after reviewing the AI diagnoses", () => {
  it("TC-20 boundary: 1-minute touch vs 1-minute overlap", () => {
    expect(overlaps(660, 661, 600, 660)).toBe(false)
    expect(overlaps(599, 600, 600, 660)).toBe(false)
    expect(overlaps(659, 720, 600, 660)).toBe(true)
    expect(overlaps(540, 601, 600, 660)).toBe(true)
  })
  it("TC-21 AC2 isolated: exactly 120 min in an empty room is available", () => {
    expect(isAvailable(makeRoom({ bookings: [] }), 840, 960, NOW)).toBe(true)
  })
  it("TC-39 blocked room with an invalid interval returns the blocked reason, not the bounds error", () => {
    const blocked = makeRoom({ blocked: true, blockedReason: "Maintenance", bookings: [] })
    const r = checkAvailability(blocked, -1, 9999, NOW)
    expect(r).toEqual({ status: "error", reason: "Maintenance", reasonCode: "blocked" })
  })
})


describe("Input parsing used by the UI (AC6 feedback)", () => {
  it("TC-19 parses valid HH:MM and rejects invalid input", () => {
    expect(timeToMinutes("09:30")).toBe(570)
    expect(timeToMinutes("24:00")).toBeNull()
    expect(timeToMinutes("9.30")).toBeNull()
  })
})

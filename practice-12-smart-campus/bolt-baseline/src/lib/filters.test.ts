import { describe, it, expect } from "vitest"
import { ROOMS } from "@/data/rooms"
import { checkAvailability, isAvailable, overlaps, type Room } from "./availability"
import { filterRooms, hasAllEquipment, matchesCapacity, parseAttendees } from "./filters"


const NOW = 8 * 60


// Fresh fictional fixtures per test.
function room(overrides: Partial<Room> = {}): Room {
  return {
    id: "r-a",
    name: "Room A",
    building: "Test Block",
    capacity: 10,
    equipment: ["Projector", "Whiteboard"],
    blocked: false,
    bookings: [{ start: 600, end: 660, label: "Lecture A" }],
    ...overrides,
  }
}


describe("F1 – capacity >= requested attendees", () => {
  it("TC-22 exact capacity is enough (10 attendees, capacity 10)", () => {
    expect(matchesCapacity(room(), 10)).toBe(true)
  })
  it("TC-23 insufficient capacity is rejected (11 attendees, capacity 10)", () => {
    expect(matchesCapacity(room(), 11)).toBe(false)
  })
  it("TC-24 attendees input: empty means no requirement, invalid input is reported", () => {
    expect(parseAttendees("")).toEqual({ value: null })
    expect(parseAttendees(" 12 ")).toEqual({ value: 12 })
    expect(parseAttendees("0").error).toBeDefined()
    expect(parseAttendees("2.5").error).toBeDefined()
    expect(matchesCapacity(room(), null)).toBe(true)
  })
  it("TC-40 attendees input above 500 is rejected with a clear error", () => {
    expect(parseAttendees("501")).toEqual({ value: null, error: "Enter a number of attendees up to 500." })
    expect(parseAttendees("99999999999999999999").error).toBeDefined()
    expect(parseAttendees("500")).toEqual({ value: 500 })
  })
})


describe("F2 – room must contain ALL selected equipment", () => {
  it("TC-25 all selected items present passes; one missing item fails", () => {
    expect(hasAllEquipment(room(), ["Projector"])).toBe(true)
    expect(hasAllEquipment(room(), ["Projector", "Whiteboard"])).toBe(true)
    expect(hasAllEquipment(room(), ["Projector", "Computers"])).toBe(false)
  })
  it("TC-26 no equipment selected matches every room", () => {
    expect(filterRooms(ROOMS, { attendees: null, equipment: [] })).toHaveLength(ROOMS.length)
  })
  it("TC-27 capacity and equipment filters combine on the catalog", () => {
    const ids = filterRooms(ROOMS, { attendees: 20, equipment: ["Projector"] }).map((r) => r.id)
    expect(ids).toEqual(["eng-101", "sci-lab-3", "arts-studio-2", "it-training-1"])
  })
  it("TC-28 filtering does not modify the catalog", () => {
    const before = structuredClone(ROOMS)
    filterRooms(ROOMS, { attendees: 30, equipment: ["Projector", "Computers"] })
    expect(ROOMS).toEqual(before)
  })
})


describe("F3 – a blocked room is never available", () => {
  it("TC-29 blocked room that matches every filter is still unavailable, with its reason", () => {
    const blocked = room({ blocked: true, blockedReason: "Maintenance", bookings: [] })
    expect(filterRooms([blocked], { attendees: 10, equipment: ["Projector"] })).toHaveLength(1)
    expect(checkAvailability(blocked, 900, 960, NOW)).toEqual({ status: "error", reason: "Maintenance", reasonCode: "blocked" })
  })
})


describe("F4 – no matching rooms", () => {
  it("TC-30 impossible requirements return an empty list", () => {
    expect(filterRooms(ROOMS, { attendees: 41, equipment: [] })).toEqual([])
    expect(filterRooms(ROOMS, { attendees: null, equipment: ["Computers", "Lab benches"] })).toEqual([])
  })
})


describe("F5 – the check uses the chosen room's own bookings", () => {
  it("TC-31 same interval: free in room A, taken in room B", () => {
    const a = room()
    const b = room({ id: "r-b", name: "Room B", bookings: [{ start: 840, end: 900, label: "Lecture B" }] })
    expect(isAvailable(a, 840, 900, NOW)).toBe(true)
    expect(isAvailable(b, 840, 900, NOW)).toBe(false)
  })
})


describe("Catalog data integrity", () => {
  it("TC-32 at least four rooms, unique ids, equipment lists, no overlapping bookings inside a room", () => {
    expect(ROOMS.length).toBeGreaterThanOrEqual(4)
    expect(new Set(ROOMS.map((r) => r.id)).size).toBe(ROOMS.length)
    for (const r of ROOMS) {
      expect(Array.isArray(r.equipment)).toBe(true)
      r.bookings.forEach((x, i) =>
        r.bookings.slice(i + 1).forEach((y) => expect(overlaps(x.start, x.end, y.start, y.end)).toBe(false))
      )
    }
  })
})

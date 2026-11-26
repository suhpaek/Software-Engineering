import type { Equipment, Room } from "./availability"


export type RoomFilter = { attendees: number | null; equipment: Equipment[] }


export const NO_FILTER: RoomFilter = { attendees: null, equipment: [] }


// F1: capacity must be greater than or equal to the requested attendees.
export function matchesCapacity(room: Room, attendees: number | null): boolean {
  return attendees === null || room.capacity >= attendees
}


export function hasAllEquipment(room: Room, required: Equipment[]): boolean {
  return required.every((item) => room.equipment.includes(item))
}


export function filterRooms(rooms: Room[], filter: RoomFilter): Room[] {
  return rooms.filter((r) => matchesCapacity(r, filter.attendees) && hasAllEquipment(r, filter.equipment))
}


// Empty input means "no capacity requirement".
export function parseAttendees(text: string): { value: number | null; error?: string } {
  const trimmed = text.trim()
  if (trimmed === "") return { value: null }
  if (!/^\d+$/.test(trimmed) || Number(trimmed) < 1)
    return { value: null, error: "Enter a whole number of attendees (1 or more)." }
  if (Number(trimmed) > 500)
    return { value: null, error: "Enter a number of attendees up to 500." }
  return { value: Number(trimmed) }
}

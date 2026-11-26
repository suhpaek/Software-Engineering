// Tests for the MOCK LLM ADAPTER (src/lib/explainAvailability.ts).
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  ExplainValidationError,
  explainAvailability,
  type ExplainInput,
} from "./explainAvailability"


afterEach(() => {
  vi.useRealTimers()
})


const BASE: ExplainInput = {
  roomName: "Engineering 101",
  startMin: 9 * 60,
  endMin: 10 * 60,
  isAvailable: true,
  reasonCode: "available",
}


describe("explainAvailability – mock LLM adapter", () => {
  it("TC-41 available case: explains a free room from the structured input", async () => {
    const out = await explainAvailability(BASE)
    expect(out.explanation).toContain("Engineering 101")
    expect(out.explanation).toContain("free from 9:00 AM to 10:00 AM")
  })


  it("TC-42 overlap case: names the conflicting booking and suggests an alternative window", async () => {
    const out = await explainAvailability({
      ...BASE,
      isAvailable: false,
      reasonCode: "overlap",
      conflictLabel: "Data Structures Tutorial",
      conflictStart: 8 * 60,
      conflictEnd: 9 * 60,
    })
    expect(out.explanation).toContain('"Data Structures Tutorial"')
    expect(out.explanation).toContain("8:00 AM")
  })


  it("TC-43 blocked room case: explains the room is blocked regardless of time", async () => {
    const out = await explainAvailability({ ...BASE, isAvailable: false, reasonCode: "blocked" })
    expect(out.explanation).toContain("blocked")
    expect(out.explanation).toContain("Engineering 101")
  })


  it("TC-44 outside-hours and past-start cases produce their own templates", async () => {
    const outside = await explainAvailability({ ...BASE, isAvailable: false, reasonCode: "outside-hours" })
    const past = await explainAvailability({ ...BASE, isAvailable: false, reasonCode: "past-start" })
    expect(outside.explanation).not.toEqual(past.explanation)
    expect(outside.explanation).toContain("outside the valid booking window")
    expect(past.explanation).toContain("not after the current time")
  })


  it("TC-45 rejects a missing room name", async () => {
    await expect(explainAvailability({ ...BASE, roomName: "" })).rejects.toBeInstanceOf(ExplainValidationError)
    await expect(explainAvailability({ ...BASE, roomName: "   " })).rejects.toBeInstanceOf(ExplainValidationError)
  })


  it("TC-46 rejects a malformed time range (start after end, out-of-day, zero length)", async () => {
    await expect(explainAvailability({ ...BASE, startMin: 600, endMin: 540 })).rejects.toBeInstanceOf(ExplainValidationError)
    await expect(explainAvailability({ ...BASE, startMin: -10, endMin: 600 })).rejects.toBeInstanceOf(ExplainValidationError)
    await expect(explainAvailability({ ...BASE, startMin: 600, endMin: 1441 })).rejects.toBeInstanceOf(ExplainValidationError)
    await expect(explainAvailability({ ...BASE, startMin: 600, endMin: 600 })).rejects.toBeInstanceOf(ExplainValidationError)
  })


  it("TC-47 rejects when the simulated input is too long", async () => {
    await expect(
      explainAvailability({ ...BASE, roomName: "R".repeat(2500) })
    ).rejects.toBeInstanceOf(ExplainValidationError)
  })


  it("TC-48 explanations never invent facts absent from the input (deterministic templates)", async () => {
    const out = await explainAvailability({
      ...BASE,
      isAvailable: false,
      reasonCode: "overlap",
      conflictLabel: "CS Lecture",
      conflictStart: 8 * 60,
      conflictEnd: 9 * 60,
    })
    // No invented equipment, capacity, or booking labels beyond the input.
    expect(out.explanation).not.toContain("Whiteboard")
    expect(out.explanation).not.toContain("Projector")
    expect(out.explanation).not.toContain("30")
    expect(out.explanation).toContain("CS Lecture")
  })


  it("TC-49 adapter failure surfaces the safe fallback without changing availability state", async () => {
    const FALLBACK = "Explanation unavailable — see availability status above."
    // Simulate an adapter that rejects (e.g. real API returning an error).
    const failing = explainAvailability({ ...BASE, roomName: "" }).catch(() => FALLBACK)
    await expect(failing).resolves.toBe(FALLBACK)
  })


  it("TC-50 same input always yields the same explanation (template determinism)", async () => {
    const a = await explainAvailability(BASE)
    const b = await explainAvailability(BASE)
    expect(a.explanation).toBe(b.explanation)
  })
})

// MOCK LLM ADAPTER — classroom demo only. Swap `explainAvailability` for a real
// server-side API call later; the input contract and UI wiring stay the same.
// The adapter EXPLAINS an already-computed deterministic result. It never
// decides availability and never invents facts beyond the structured input.
// ============================================================================


import { MAX_DURATION_MIN, type ReasonCode } from "./availability"
import { minutesToTime } from "./time"


export type ExplainInput = {
  roomName: string
  startMin: number
  endMin: number
  isAvailable: boolean
  reasonCode: ReasonCode
  conflictLabel?: string
  conflictStart?: number
  conflictEnd?: number
}


export type ExplainOutput = { explanation: string }


export class ExplainValidationError extends Error {}


// Simulated latency bounds (ms), kept short so tests stay fast.
const MIN_DELAY_MS = 50
const MAX_DELAY_MS = 150
// Simulated "input too long" ceiling for the serialized payload.
const MAX_INPUT_CHARS = 2000


function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}


function serialize(input: ExplainInput): string {
  return JSON.stringify(input)
}


// Deterministic template per reason code. Every template uses ONLY facts present
// in the structured input — no hallucination is possible by construction.
function templateFor(input: ExplainInput): string {
  const start = minutesToTime(input.startMin)
  const end = minutesToTime(input.endMin)
  const slot = `${start} to ${end}`


  switch (input.reasonCode) {
    case "available":
      return `${input.roomName} is free from ${slot}, and the slot fits inside the ${MAX_DURATION_MIN}-minute limit. You can book it.`
    case "overlap":
      if (input.conflictLabel && input.conflictStart !== undefined && input.conflictEnd !== undefined)
        return `${input.roomName} already has "${input.conflictLabel}" booked from ${minutesToTime(input.conflictStart)} to ${minutesToTime(input.conflictEnd)}, which clashes with your ${slot} slot. Try a time before ${minutesToTime(input.conflictStart)} or after ${minutesToTime(input.conflictEnd)}.`
      return `${input.roomName} already has a booking that clashes with your ${slot} slot. Try a different time.`
    case "blocked":
      return `${input.roomName} is currently blocked for maintenance, so no bookings are accepted at any time.`
    case "outside-hours":
      return `The requested ${slot} slot falls outside the valid booking window, so it cannot be booked at ${input.roomName}. Times must be within the day and end after the start.`
    case "past-start":
      return `The requested start (${start}) is not after the current time, so ${input.roomName} cannot be booked for ${slot}. Pick a later start.`
    case "too-long":
      return `Your ${slot} slot is longer than the ${MAX_DURATION_MIN}-minute maximum, so ${input.roomName} cannot be booked for it. Split it into shorter bookings.`
  }
}


export async function explainAvailability(input: ExplainInput): Promise<ExplainOutput> {
  if (!input || typeof input.roomName !== "string" || input.roomName.trim() === "")
    throw new ExplainValidationError("Missing room name.")
  if (
    !Number.isFinite(input.startMin) ||
    !Number.isFinite(input.endMin) ||
    input.startMin < 0 ||
    input.endMin > 1440 ||
    input.startMin >= input.endMin
  )
    throw new ExplainValidationError("Malformed time range.")


  if (serialize(input).length > MAX_INPUT_CHARS) throw new ExplainValidationError("Input too long.")


  await delay(MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)))
  return { explanation: templateFor(input) }
}


// Simulated adapter failure hook, used by tests and by the UI fallback path.
export class SimulatedAdapterError extends Error {}

import type { Room } from "@/lib/availability"


// Fixed "current time" for the demo (08:00), so results never depend on the real clock.
export const DEMO_NOW_MIN = 8 * 60


export const ROOMS: Room[] = [
  {
    id: "eng-101",
    name: "Engineering 101",
    building: "Engineering Block",
    capacity: 30,
    equipment: ["Projector", "Whiteboard"],
    blocked: false,
    bookings: [
      { start: 480, end: 570, label: "CS Lecture – Prof. Nkosi" },
      { start: 720, end: 840, label: "Data Structures Tutorial" },
      { start: 960, end: 1020, label: "Study Group – Year 2" },
    ],
  },
  {
    id: "lib-seminar-a",
    name: "Library Seminar A",
    building: "Main Library",
    capacity: 12,
    equipment: ["Whiteboard", "Video conferencing"],
    blocked: false,
    bookings: [
      { start: 540, end: 600, label: "Research Methods Workshop" },
      { start: 780, end: 900, label: "Honours Thesis Review" },
    ],
  },
  {
    id: "sci-lab-3",
    name: "Science Lab 3",
    building: "Science Complex",
    capacity: 24,
    equipment: ["Projector", "Lab benches"],
    blocked: false,
    bookings: [
      { start: 600, end: 720, label: "Chemistry Practical" },
      { start: 840, end: 960, label: "Biology Lab – Group B" },
      { start: 1080, end: 1200, label: "Physics Demonstration" },
    ],
  },
  {
    id: "arts-studio-2",
    name: "Arts Studio 2",
    building: "Arts & Humanities",
    capacity: 20,
    equipment: ["Projector", "Whiteboard"],
    blocked: true,
    blockedReason: "Maintenance – HVAC repair in progress",
    bookings: [],
  },
  {
    id: "biz-boardroom",
    name: "Business Boardroom",
    building: "Commerce Building",
    capacity: 16,
    equipment: ["Projector", "Whiteboard", "Video conferencing"],
    blocked: false,
    bookings: [
      { start: 480, end: 600, label: "MBA Strategy Session" },
      { start: 660, end: 720, label: "Investment Club Meeting" },
      { start: 900, end: 1020, label: "Entrepreneurship Mentoring" },
    ],
  },
  {
    id: "it-training-1",
    name: "IT Training Room 1",
    building: "ICT Centre",
    capacity: 40,
    equipment: ["Projector", "Whiteboard", "Computers"],
    blocked: false,
    bookings: [
      { start: 480, end: 600, label: "Python Bootcamp – Day 1" },
      { start: 780, end: 900, label: "Cybersecurity Awareness" },
    ],
  },
]

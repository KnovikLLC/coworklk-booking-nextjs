// Fixed clock times for the schedule-based slots (doc §7.1 comments). The
// three lobby slots (1hr/2hr/30min) have no fixed start time in the current
// schema — the customer's chosen start time isn't captured — so they're
// left null here.
export const SLOT_TIMES: Record<string, { start: string; end: string } | null> = {
  morning: { start: "08:00", end: "12:00" },
  afternoon: { start: "12:00", end: "16:00" },
  evening: { start: "16:00", end: "20:00" },
  night: { start: "20:00", end: "23:59" },
  full_day: { start: "08:00", end: "17:00" },
  unlimited: { start: "08:00", end: "20:00" },
  "1hr": null,
  "2hr": null,
  "30min": null,
};

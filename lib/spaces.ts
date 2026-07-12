export const SPACE_TYPE_LABELS: Record<string, string> = {
  hot_desk: "Hot Desk",
  workspace: "Workspace Seat",
  meeting_room_4: "4-Seater Meeting Room",
  meeting_room_4_black: "4-Seater Black Meeting Room",
  meeting_room_5: "5-Seater Meeting Room",
  lobby: "Lobby Area",
  creative_studio: "Creative Studio",
  classroom: "Classroom",
};

export const DURATION_LABELS: Record<string, string> = {
  half_day: "Half Day",
  full_day: "Full Day",
  unlimited: "Unlimited",
  "1hr": "1 Hour",
  "2hr": "2 Hours",
  "30min": "30 Minutes",
};

export function spaceTypeLabel(type: string) {
  return SPACE_TYPE_LABELS[type] ?? type;
}

export function durationLabel(duration: string) {
  return DURATION_LABELS[duration] ?? duration;
}

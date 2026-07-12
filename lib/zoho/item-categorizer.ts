// Doc §5.3 lines 1019-1085, verbatim.

interface ItemCategory {
  category:
    | "hot_desk"
    | "workspace"
    | "meeting_room_4"
    | "meeting_room_4_black"
    | "meeting_room_5"
    | "lobby_meeting"
    | "lobby_shooting"
    | "addon"
    | "other";
  duration: "half_day" | "full_day" | "unlimited" | "1hr" | "2hr" | "30min" | "per_item" | null;
}

export function categorizeZohoItem(itemName: string): ItemCategory {
  const name = itemName.toLowerCase();

  // Hot Desk
  if (name.includes("hot desk")) {
    if (name.includes("half")) return { category: "hot_desk", duration: "half_day" };
    if (name.includes("full day") || name.includes("8hr")) return { category: "hot_desk", duration: "full_day" };
    if (name.includes("unlimited") || name.includes("12hr")) return { category: "hot_desk", duration: "unlimited" };
  }

  // Workspace
  if (name.includes("workspace")) {
    if (name.includes("half")) return { category: "workspace", duration: "half_day" };
    if (name.includes("full")) return { category: "workspace", duration: "full_day" };
    if (name.includes("unlimited")) return { category: "workspace", duration: "unlimited" };
  }

  // 4-Seater Black Room
  if (name.includes("4 seater black") || name.includes("4-seater black")) {
    if (name.includes("half")) return { category: "meeting_room_4_black", duration: "half_day" };
    if (name.includes("full")) return { category: "meeting_room_4_black", duration: "full_day" };
    if (name.includes("unlimited")) return { category: "meeting_room_4_black", duration: "unlimited" };
  }

  // 4-Seater Room (non-black)
  if ((name.includes("4 seater") || name.includes("4-seater")) && !name.includes("black")) {
    if (name.includes("half")) return { category: "meeting_room_4", duration: "half_day" };
    if (name.includes("full")) return { category: "meeting_room_4", duration: "full_day" };
    if (name.includes("unlimited")) return { category: "meeting_room_4", duration: "unlimited" };
  }

  // 5-Seater Room
  if (name.includes("5 seater") || name.includes("5-seater")) {
    if (name.includes("half")) return { category: "meeting_room_5", duration: "half_day" };
    if (name.includes("full")) return { category: "meeting_room_5", duration: "full_day" };
    if (name.includes("unlimited")) return { category: "meeting_room_5", duration: "unlimited" };
  }

  // Lobby
  if (name.includes("lobby")) {
    if (name.includes("shooting")) {
      if (name.includes("additional") || name.includes("30min")) return { category: "lobby_shooting", duration: "30min" };
      return { category: "lobby_shooting", duration: "2hr" };
    }
    if (name.includes("1h") || name.includes("1 hour")) return { category: "lobby_meeting", duration: "1hr" };
    if (name.includes("2h") || name.includes("2 hour")) return { category: "lobby_meeting", duration: "2hr" };
    if (name.includes("additional")) return { category: "lobby_meeting", duration: "1hr" };
  }

  // Add-ons
  if (
    name.includes("projector") ||
    name.includes("screen") ||
    name.includes("monitor") ||
    name.includes("data") ||
    name.includes("gb") ||
    name.includes("photocopy")
  ) {
    return { category: "addon", duration: "per_item" };
  }

  // Unmapped
  return { category: "other", duration: null };
}

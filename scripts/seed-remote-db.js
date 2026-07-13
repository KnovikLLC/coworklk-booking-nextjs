const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

async function seed() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error(".env.local file not found.");
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, "utf8");
  const url = content.match(/^[^#\n]*NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/m)?.[1]?.trim();
  const key = content.match(/^[^#\n]*SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)/m)?.[1]?.trim();

  if (!url || !key) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local.");
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${url}...`);
  const supabase = createClient(url, key);

  console.log("Cleaning existing database records (spaces, pricing, addons)...");
  
  // Reverse order delete to avoid key constraints
  await supabase.from("pricing").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("spaces").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("addons").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Inserting spaces...");
  const spacesToInsert = [
    { name: "Hot Desk", type: "hot_desk", capacity: 1, total_inventory: 5, requires_specific_seat: false, image_url: "/images/spaces/co-work-area.png" },
    { name: "Workspace Seat", type: "workspace", capacity: 1, total_inventory: 16, requires_specific_seat: false, image_url: "/images/spaces/co-work-area.png" },
    { name: "4-Seater Meeting Room", type: "meeting_room_4", capacity: 4, total_inventory: 1, requires_specific_seat: true, image_url: "/images/spaces/4-seater.png" },
    { name: "4-Seater Black Meeting Room", type: "meeting_room_4_black", capacity: 4, total_inventory: 1, requires_specific_seat: true, image_url: "/images/spaces/meeting-rooms.png" },
    { name: "5-Seater Meeting Room", type: "meeting_room_5", capacity: 5, total_inventory: 1, requires_specific_seat: true, image_url: "/images/spaces/table.png" },
    { name: "Lobby Area", type: "lobby", capacity: 10, total_inventory: 1, requires_specific_seat: true, image_url: "/images/spaces/lobby.png" },
  ];

  const { data: insertedSpaces, error: spacesError } = await supabase
    .from("spaces")
    .insert(spacesToInsert)
    .select();

  if (spacesError) {
    console.error("Error inserting spaces:", spacesError);
    process.exit(1);
  }

  const spaceIdByMap = {};
  insertedSpaces.forEach((s) => {
    spaceIdByMap[s.type] = s.id;
  });

  console.log("Inserting pricing...");
  const pricingToInsert = [
    // Hot Desk
    { space_id: spaceIdByMap["hot_desk"], duration: "half_day", price: 490, zoho_item_id: "4944213000001171243", zoho_item_name: "Hot Desk - Half Daytime", description: "4hrs (8am-12pm or 12pm-4pm)" },
    { space_id: spaceIdByMap["hot_desk"], duration: "full_day", price: 790, zoho_item_id: "4944213000001171232", zoho_item_name: "Hot Desk Full Day", description: "8hrs (8am-5pm)" },
    { space_id: spaceIdByMap["hot_desk"], duration: "unlimited", price: 990, zoho_item_id: "4944213000001171254", zoho_item_name: "Hot Desk - Daily Unlimited", description: "12hrs (8am-8pm)" },

    // Workspace
    { space_id: spaceIdByMap["workspace"], duration: "half_day", price: 790, zoho_item_id: "4944213000000084278", zoho_item_name: "Workspace - Half Day", description: "4hrs access" },
    { space_id: spaceIdByMap["workspace"], duration: "full_day", price: 1000, zoho_item_id: "4944213000000084226", zoho_item_name: "Workspace - Full Daytime", description: "8hrs (8am-5pm)" },
    { space_id: spaceIdByMap["workspace"], duration: "unlimited", price: 1350, zoho_item_id: "4944213000000100027", zoho_item_name: "Workspace - Daily Unlimited", description: "12hrs (8am-8pm)" },

    // 4-Seater
    { space_id: spaceIdByMap["meeting_room_4"], duration: "half_day", price: 3450, zoho_item_id: "4944213000000154001", zoho_item_name: "4 Seater Private Room - Half Day", includes_data_gb: 4 },
    { space_id: spaceIdByMap["meeting_room_4"], duration: "full_day", price: 4950, zoho_item_id: "4944213000000152001", zoho_item_name: "4 Seater Private Room - Full Day", includes_data_gb: 8 },
    { space_id: spaceIdByMap["meeting_room_4"], duration: "unlimited", price: 5950, zoho_item_id: "4944213000000175001", zoho_item_name: "4 Seater Private Room - Unlimited Day Access", includes_data_gb: 8 },

    // 4-Seater Black
    { space_id: spaceIdByMap["meeting_room_4_black"], duration: "half_day", price: 3450, zoho_item_id: "4944213000001985001", zoho_item_name: "4 Seater Black Private Room - Half Day", includes_data_gb: 4 },
    { space_id: spaceIdByMap["meeting_room_4_black"], duration: "full_day", price: 4950, zoho_item_id: "4944213000001985012", zoho_item_name: "4 Seater Black Private Room - Full Day", includes_data_gb: 8 },
    { space_id: spaceIdByMap["meeting_room_4_black"], duration: "unlimited", price: 5950, zoho_item_id: "4944213000001983049", zoho_item_name: "4 Seater Black Private Room - Unlimited Day Access", includes_data_gb: 8 },

    // 5-Seater
    { space_id: spaceIdByMap["meeting_room_5"], duration: "half_day", price: 3950, zoho_item_id: "4944213000001171199", zoho_item_name: "5 Seater Private Room - Half Day", includes_data_gb: 5 },
    { space_id: spaceIdByMap["meeting_room_5"], duration: "full_day", price: 5950, zoho_item_id: "4944213000001171210", zoho_item_name: "5 Seater Private Room - Full Day", includes_data_gb: 10 },
    { space_id: spaceIdByMap["meeting_room_5"], duration: "unlimited", price: 6750, zoho_item_id: "4944213000001171221", zoho_item_name: "5 Seater Private Room - Unlimited Day Access", includes_data_gb: 15 },

    // Lobby
    { space_id: spaceIdByMap["lobby"], duration: "1hr", price: 1200, zoho_item_id: "4944213000001171476", zoho_item_name: "Lobby Area Meeting for 1h | Max 3 Pax" },
    { space_id: spaceIdByMap["lobby"], duration: "2hr", price: 6500, zoho_item_id: "4944213000001171487", zoho_item_name: "Lobby Area Meeting for 2h | Maximum 10 Pax" },
  ];

  const { error: pricingError } = await supabase
    .from("pricing")
    .insert(pricingToInsert);

  if (pricingError) {
    console.error("Error inserting pricing:", pricingError);
    process.exit(1);
  }

  console.log("Inserting addons...");
  const addonsToInsert = [
    { name: "5 GB Extra Data", price: 650, zoho_item_id: "4944213000001171366", category: "data" },
    { name: "10 GB Extra Data", price: 1300, zoho_item_id: "4944213000001171388", category: "data" },
    { name: "20 GB Extra Data", price: 2500, zoho_item_id: "4944213000001171377", category: "data" },
    { name: "Monitor Rental (Day)", price: 500, zoho_item_id: "4944213000001171305", category: "equipment" },
    { name: "Projector (Up to 4hrs)", price: 1800, zoho_item_id: "4944213000001171316", category: "equipment" },
    { name: "Projector (4+ hrs)", price: 2800, zoho_item_id: "4944213000001171349", category: "equipment" },
    { name: "Projector Screen (Up to 4hrs)", price: 2400, zoho_item_id: "4944213000001171327", category: "equipment" },
    { name: "Projector Screen (4+ hrs)", price: 3800, zoho_item_id: "4944213000001171338", category: "equipment" },
    { name: "Photocopy B&W (per page)", price: 10, zoho_item_id: "4944213000001171288", category: "printing" },
  ];

  const { error: addonsError } = await supabase
    .from("addons")
    .insert(addonsToInsert);

  if (addonsError) {
    console.error("Error inserting addons:", addonsError);
    process.exit(1);
  }

  console.log("\nSuccess! Remote Supabase database seeded successfully.");
}

seed();

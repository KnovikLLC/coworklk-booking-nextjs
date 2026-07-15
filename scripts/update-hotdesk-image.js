const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

async function run() {
  console.log("=== Upgrading Hot Desk Image URL in Database ===");

  // 1. Load env
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Error: .env.local file not found.");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const getEnv = (key) => {
    const regex = new RegExp(`^[^#\\n]*${key}\\s*=\\s*(.+)`, "m");
    return envContent.match(regex)?.[1]?.trim() || "";
  };

  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Supabase credentials missing in .env.local.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 2. Perform Update
  console.log("Updating spaces table...");
  const { data, error } = await supabase
    .from("spaces")
    .update({ image_url: "/images/spaces/hotdesks.webp" })
    .eq("type", "hot_desk")
    .select();

  if (error) {
    console.error("Failed to update Hot Desk image url:", error.message);
    process.exit(1);
  }

  console.log("Update successful! Updated record details:");
  console.log(JSON.stringify(data, null, 2));
}

run();

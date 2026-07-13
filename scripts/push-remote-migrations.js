const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function pushMigrations() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error(".env.local file not found.");
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, "utf8");
  const connString = content.match(/^[^#\n]*CONN_STRING\s*=\s*(.+)/m)?.[1]?.trim();

  if (!connString) {
    console.error("Error: CONN_STRING not found in .env.local.");
    process.exit(1);
  }

  const match = connString.match(/postgresql:\/\/([^:]+):(.*)@([^/]+)\/(.+)/);
  if (!match) {
    console.error("Error: CONN_STRING format is invalid.");
    process.exit(1);
  }

  const user = match[1];
  const password = match[2];
  const host = match[3];
  const db = match[4];
  
  const encodedConnString = `postgresql://${user}:${encodeURIComponent(password)}@${host}/${db}`;
  console.log(`Connecting to remote database at: ${host}...`);

  try {
    console.log("Pushing database migrations to remote Supabase...");
    execSync(`npx supabase db push --yes --db-url "${encodedConnString}"`, { stdio: "inherit" });
    console.log("Success! Database migrations pushed successfully.");
  } catch (err) {
    console.error("Error pushing migrations:", err.message);
    process.exit(1);
  }
}

pushMigrations();

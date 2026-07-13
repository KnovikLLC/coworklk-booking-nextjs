const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Read .env.local
const envPath = path.join(process.cwd(), ".env.local");
let clientId = "";
let clientSecret = "";
let redirectUri = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  clientId = content.match(/ZOHO_CLIENT_ID\s*=\s*(.+)/)?.[1]?.trim() || "";
  clientSecret = content.match(/ZOHO_CLIENT_SECRET\s*=\s*(.+)/)?.[1]?.trim() || "";
  redirectUri = content.match(/ZOHO_REDIRECT_URI\s*=\s*(.+)/)?.[1]?.trim() || "";
}

if (!clientId || !clientSecret || !redirectUri) {
  console.error("Error: Could not read ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REDIRECT_URI from .env.local.");
  process.exit(1);
}

const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoBooks.fullaccess.all&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(redirectUri)}`;

console.log("\n=======================================================");
console.log("Zoho Books Refresh Token Generator");
console.log("=======================================================");
console.log("\n1. Open this URL in your web browser to authorize access:\n");
console.log(authUrl);
console.log("\n2. Log in (if prompted), authorize the app, and you will be redirected.");
console.log("3. Copy the 'code' parameter from the redirected browser URL.");
console.log("   (e.g., http://localhost:3000/api/auth/zoho/callback?code=1000.xxxx...)");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\n4. Paste the authorization 'code' here and press Enter: ", async (code) => {
  rl.close();
  const trimmedCode = code.trim();
  if (!trimmedCode) {
    console.error("Code is required.");
    process.exit(1);
  }

  console.log("\nExchanging code for tokens...");
  
  const params = new URLSearchParams({
    code: trimmedCode,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  try {
    const res = await fetch(`https://accounts.zoho.com/oauth/v2/token?${params.toString()}`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error(`Failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }

    console.log("\nSuccess!");
    console.log("=======================================================");
    console.log(`Refresh Token: ${data.refresh_token}`);
    console.log("=======================================================");
    console.log("\nCopy this Refresh Token and add it as ZOHO_REFRESH_TOKEN in your .env.local file.");
  } catch (error) {
    console.error("\nError exchanging code:", error.message);
  }
});

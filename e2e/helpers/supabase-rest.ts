// Direct Supabase REST calls with the service-role key, instead of
// @supabase/supabase-js — the JS SDK's realtime client throws
// "Node.js detected but native WebSocket not found" when constructed in a
// plain Node process outside Next.js's runtime (which is what Playwright's
// test process is). Raw fetch avoids that entirely and is the same
// workaround used throughout this project's manual live-data verification.

function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set — check .env.local");
  return url;
}

function serviceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — check .env.local");
  return key;
}

function headers() {
  const key = serviceRoleKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function insertRow<T>(table: string, row: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${supabaseUrl()}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`insertRow(${table}) failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as T[];
  return data[0];
}

export async function deleteRows(table: string, filterQuery: string): Promise<void> {
  const res = await fetch(`${supabaseUrl()}/rest/v1/${table}?${filterQuery}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`deleteRows(${table}) failed: ${res.status} ${await res.text()}`);
}

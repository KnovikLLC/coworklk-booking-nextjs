// Shared push-send helper for all notification Edge Functions.
// Mirrors this repo's Zoho/Resend failure posture (lib/zoho/client.ts,
// lib/email/resend.ts): never throws out to the caller, logs and returns,
// so a notification failure never blocks a booking/cron run. Uses
// npm:firebase-admin (Deno's npm specifier support) instead of hand-rolling
// FCM HTTP v1 OAuth2/JWT signing.

import { initializeApp, cert, getApps, type App } from "npm:firebase-admin@12/app";
import { getMessaging } from "npm:firebase-admin@12/messaging";
import { createClient } from "npm:@supabase/supabase-js@2";

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super("Firebase push notifications are not configured");
    this.name = "FirebaseNotConfiguredError";
  }
}

function getFirebaseApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
  const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
  // Vercel/Supabase secrets store multi-line PEM keys with literal `\n` —
  // must be un-escaped before firebase-admin can parse it.
  const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new FirebaseNotConfiguredError();
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

function getAdminSupabase() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Loads every device registered for a user, sends to all of them, and
// prunes tokens FCM reports as invalid/unregistered.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const supabase = getAdminSupabase();

  const { data: devices, error } = await supabase
    .from("user_devices")
    .select("id, fcm_token")
    .eq("user_id", userId);

  if (error || !devices || devices.length === 0) return;

  let app: App;
  try {
    app = getFirebaseApp();
  } catch (err) {
    console.error("[push] not configured:", err);
    return;
  }

  try {
    const messaging = getMessaging(app);
    const response = await messaging.sendEachForMulticast({
      tokens: devices.map((d) => d.fcm_token),
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    });

    const staleTokenIds = response.responses
      .map((result, index) => ({ result, device: devices[index] }))
      .filter(({ result }) => !result.success && result.error && INVALID_TOKEN_CODES.has(result.error.code))
      .map(({ device }) => device.id);

    if (staleTokenIds.length > 0) {
      await supabase.from("user_devices").delete().in("id", staleTokenIds);
    }
  } catch (err) {
    console.error("[push] send failed:", err);
  }
}

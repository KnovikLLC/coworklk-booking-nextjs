// Gap-fill (not in doc): the doc's sync-service and customers/invoices
// snippets call a `getZohoClient()` that's referenced but never
// implemented. Built here with the critical property none of the doc's
// Zoho code has: every call site in this app wraps getZohoClient() in a
// try/catch that treats ZohoNotConfiguredError as "skip, don't crash" —
// this repo has no real Zoho credentials, and a booking or admin action
// must never fail because Zoho is unreachable or unset.

export class ZohoNotConfiguredError extends Error {
  constructor() {
    super("Zoho Books is not configured (missing ZOHO_CLIENT_ID/CLIENT_SECRET/REFRESH_TOKEN/ORGANIZATION_ID)");
    this.name = "ZohoNotConfiguredError";
  }
}

interface ZohoEnv {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  organizationId: string;
}

function getZohoEnv(): ZohoEnv {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const organizationId = process.env.ZOHO_ORGANIZATION_ID;

  if (!clientId || !clientSecret || !refreshToken || !organizationId) {
    throw new ZohoNotConfiguredError();
  }

  return { clientId, clientSecret, refreshToken, organizationId };
}

let tokenCache: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(env: ZohoEnv): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const params = new URLSearchParams({
    refresh_token: env.refreshToken,
    client_id: env.clientId,
    client_secret: env.clientSecret,
    grant_type: "refresh_token",
  });

  const res = await fetch(`https://accounts.zoho.com/oauth/v2/token?${params.toString()}`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Zoho token refresh failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return tokenCache.accessToken;
}

export interface ZohoResponse<T = unknown> {
  data: T;
}

export interface ZohoClient {
  get<T = unknown>(path: string, opts?: { params?: Record<string, string | number> }): Promise<ZohoResponse<T>>;
  post<T = unknown>(path: string, body?: unknown): Promise<ZohoResponse<T>>;
  // Zoho Books' `?accept=pdf` variant returns raw PDF bytes, not JSON — a
  // separate method rather than a flag on get() so callers can't
  // accidentally .json() a binary response.
  getPdf(path: string, opts?: { params?: Record<string, string | number> }): Promise<ArrayBuffer>;
}

const ZOHO_BOOKS_BASE_URL = "https://www.zohoapis.com/books/v3";

// Throws ZohoNotConfiguredError if env vars are unset — every caller in
// this codebase must catch that (or Error generally) and degrade
// gracefully rather than letting it bubble into a 500.
export async function getZohoClient(): Promise<ZohoClient> {
  const env = getZohoEnv();
  const accessToken = await getAccessToken(env);

  async function request<T>(
    method: "GET" | "POST",
    path: string,
    opts?: { params?: Record<string, string | number>; body?: unknown }
  ): Promise<ZohoResponse<T>> {
    const url = new URL(ZOHO_BOOKS_BASE_URL + path);
    url.searchParams.set("organization_id", env.organizationId);
    if (opts?.params) {
      for (const [key, value] of Object.entries(opts.params)) {
        url.searchParams.set(key, String(value));
      }
    }

    const res = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Zoho API error ${res.status}: ${await res.text()}`);
    }

    return { data: (await res.json()) as T };
  }

  async function requestPdf(path: string, params?: Record<string, string | number>): Promise<ArrayBuffer> {
    const url = new URL(ZOHO_BOOKS_BASE_URL + path);
    url.searchParams.set("organization_id", env.organizationId);
    url.searchParams.set("accept", "pdf");
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Zoho API error ${res.status}: ${await res.text()}`);
    }

    return res.arrayBuffer();
  }

  return {
    get: (path, opts) => request("GET", path, opts),
    post: (path, body) => request("POST", path, { body }),
    getPdf: (path, opts) => requestPdf(path, opts?.params),
  };
}

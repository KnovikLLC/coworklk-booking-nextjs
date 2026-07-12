"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SyncStatus {
  configured: boolean;
  last_sync: {
    status: string;
    started_at: string;
    completed_at: string | null;
    items_synced: number;
    items_created: number;
    items_updated: number;
    error_message: string | null;
  } | null;
  mapping_status: { active: number; inactive: number; mapped: number; unmapped: number };
}

// Doc §5.3 admin sync dashboard mockup.
export function ZohoSyncPanel() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadStatus() {
    setLoading(true);
    const res = await fetch("/api/admin/zoho/sync/status");
    const data = await res.json();
    setStatus(data);
    setLoading(false);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleSyncNow() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/zoho/sync", { method: "POST" });
      const data = await res.json();

      if (data.skipped) {
        toast.info("Zoho is not configured — nothing to sync.");
      } else if (!data.success) {
        toast.error(data.errors?.[0] ?? "Sync failed");
      } else {
        toast.success(`Synced ${data.items_synced} items (${data.items_created} new, ${data.items_updated} updated)`);
      }
    } finally {
      setSyncing(false);
      loadStatus();
    }
  }

  if (loading || !status) {
    return <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-brand-dark">Zoho Sync</h2>
        <Button size="sm" onClick={handleSyncNow} disabled={syncing}>
          {syncing ? "Syncing..." : "🔄 Sync Now"}
        </Button>
      </div>

      {!status.configured ? (
        <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <Badge variant="secondary" className="mb-1">
            Not Configured
          </Badge>
          <p>
            Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, and ZOHO_ORGANIZATION_ID to enable
            product/price sync and automatic invoicing.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 text-sm">
            {status.last_sync ? (
              <p>
                <span className={status.last_sync.status === "completed" ? "text-emerald-600" : "text-destructive"}>
                  {status.last_sync.status === "completed" ? "✅" : "⚠️"} {status.last_sync.status}
                </span>{" "}
                — {formatDistanceToNow(new Date(status.last_sync.started_at), { addSuffix: true })}
                <br />
                Items: {status.last_sync.items_synced} synced ({status.last_sync.items_created} new,{" "}
                {status.last_sync.items_updated} updated)
                {status.last_sync.error_message ? (
                  <p className="mt-1 text-destructive">{status.last_sync.error_message}</p>
                ) : null}
              </p>
            ) : (
              <p className="text-muted-foreground">No syncs yet.</p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>
              🟢 Active: <strong>{status.mapping_status.active}</strong>
            </div>
            <div>
              🔴 Inactive: <strong>{status.mapping_status.inactive}</strong>
            </div>
            <div>
              ✅ Mapped: <strong>{status.mapping_status.mapped}</strong>
            </div>
            <div>
              ⚠️ Unmapped: <strong>{status.mapping_status.unmapped}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

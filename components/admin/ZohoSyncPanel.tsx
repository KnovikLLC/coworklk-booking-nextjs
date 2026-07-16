"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2, AlertTriangle, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base text-brand-dark">Zoho Sync</CardTitle>
        <Button size="sm" onClick={handleSyncNow} disabled={syncing}>
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", syncing && "animate-spin")} />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </CardHeader>
      <CardContent>
        {!status.configured ? (
          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
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
            <div className="text-sm">
              {status.last_sync ? (
                <div>
                  <p className="flex items-center gap-1.5">
                    {status.last_sync.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <span
                      className={cn(
                        "font-medium capitalize",
                        status.last_sync.status === "completed" ? "text-emerald-600" : "text-destructive"
                      )}
                    >
                      {status.last_sync.status}
                    </span>
                    <span className="text-muted-foreground">
                      — {formatDistanceToNow(new Date(status.last_sync.started_at), { addSuffix: true })}
                    </span>
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Items: {status.last_sync.items_synced} synced ({status.last_sync.items_created} new,{" "}
                    {status.last_sync.items_updated} updated)
                  </p>
                  {status.last_sync.error_message ? (
                    <p className="mt-1 text-destructive">{status.last_sync.error_message}</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-muted-foreground">No syncs yet.</p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="flex items-center gap-1.5">
                <CircleDot className="h-3.5 w-3.5 text-emerald-600" />
                Active: <strong>{status.mapping_status.active}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <CircleDot className="h-3.5 w-3.5 text-red-500" />
                Inactive: <strong>{status.mapping_status.inactive}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Mapped: <strong>{status.mapping_status.mapped}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Unmapped: <strong>{status.mapping_status.unmapped}</strong>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

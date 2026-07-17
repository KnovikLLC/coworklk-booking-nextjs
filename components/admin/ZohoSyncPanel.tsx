"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2, AlertTriangle, CircleDot, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SyncLogEntry {
  status: string;
  started_at: string;
  completed_at: string | null;
  items_synced: number;
  items_created: number;
  items_updated: number;
  error_message: string | null;
}

interface SyncStatus {
  configured: boolean;
  last_sync: SyncLogEntry | null;
  mapping_status: { active: number; inactive: number; mapped: number; unmapped: number };
  last_user_sync: SyncLogEntry | null;
  user_contact_status: { total: number; synced: number; unsynced: number };
}

// Doc §5.3 admin sync dashboard mockup.
export function ZohoSyncPanel() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingItems, setSyncingItems] = useState(false);
  const [syncingUsers, setSyncingUsers] = useState(false);

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

  async function handleSyncItems() {
    setSyncingItems(true);
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
      setSyncingItems(false);
      loadStatus();
    }
  }

  async function handleSyncUsers() {
    setSyncingUsers(true);
    try {
      const res = await fetch("/api/admin/zoho/sync-users", { method: "POST" });
      const data = await res.json();

      if (data.skipped) {
        toast.info("Zoho is not configured — nothing to sync.");
      } else if (!data.success) {
        toast.error(data.errors?.[0] ?? "Sync failed");
      } else {
        toast.success(`Checked ${data.users_checked} users, created ${data.contacts_created} new Zoho contacts`);
      }
    } finally {
      setSyncingUsers(false);
      loadStatus();
    }
  }

  if (loading || !status) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base text-brand-dark">Zoho Item Sync</CardTitle>
          <Button size="sm" onClick={handleSyncItems} disabled={syncingItems}>
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", syncingItems && "animate-spin")} />
            {syncingItems ? "Syncing..." : "Sync Now"}
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
                product/price sync, customer sync, and automatic invoicing.
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

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base text-brand-dark">Zoho Customer Contacts</CardTitle>
          <Button size="sm" onClick={handleSyncUsers} disabled={syncingUsers || !status.configured}>
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", syncingUsers && "animate-spin")} />
            {syncingUsers ? "Syncing..." : "Sync Now"}
          </Button>
        </CardHeader>
        <CardContent>
          {!status.configured ? (
            <p className="text-sm text-muted-foreground">Configure Zoho above to enable customer contact sync.</p>
          ) : (
            <>
              <div className="text-sm">
                {status.last_user_sync ? (
                  <div>
                    <p className="flex items-center gap-1.5">
                      {status.last_user_sync.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      <span
                        className={cn(
                          "font-medium capitalize",
                          status.last_user_sync.status === "completed" ? "text-emerald-600" : "text-destructive"
                        )}
                      >
                        {status.last_user_sync.status}
                      </span>
                      <span className="text-muted-foreground">
                        — {formatDistanceToNow(new Date(status.last_user_sync.started_at), { addSuffix: true })}
                      </span>
                    </p>
                    {status.last_user_sync.error_message ? (
                      <p className="mt-1 text-destructive">{status.last_user_sync.error_message}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No syncs yet.</p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  Total: <strong>{status.user_contact_status.total}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Synced: <strong>{status.user_contact_status.synced}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Unsynced: <strong>{status.user_contact_status.unsynced}</strong>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

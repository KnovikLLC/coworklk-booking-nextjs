"use client";

import { useEffect, useState } from "react";
import { addDays, format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SLOT_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  full_day: "Full Day",
  unlimited: "Unlimited",
  "1hr": "1 Hour",
  "2hr": "2 Hours",
};

interface AdminSlotInfo {
  available: number;
  booked: number;
  booking: { id: string; customer: string; status: string } | null;
}
interface AdminResource {
  space_id: string;
  space_name: string;
  space_type: string;
  total_inventory: number;
  slots: Record<string, AdminSlotInfo>;
  is_holiday: boolean;
}

// Doc §10.3 mockup. Renders one row per space with whatever slot keys apply
// to that space type (lobby's 1hr/2hr vs everyone else's morning/afternoon/
// full_day/unlimited) rather than a fixed-column table, since those two
// slot sets don't share columns.
export function AvailabilityGrid() {
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [resources, setResources] = useState<AdminResource[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/availability?date=${date}`)
      .then((res) => res.json())
      .then((data) => setResources(data.resources))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <Card>
      <CardContent className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDate((d) => format(subDays(new Date(d), 1), "yyyy-MM-dd"))}>
            ← Prev
          </Button>
          <span className="font-semibold text-brand-dark">
            {format(new Date(`${date}T00:00:00`), "EEEE, MMMM d, yyyy")}
          </span>
          <Button variant="outline" size="sm" onClick={() => setDate((d) => format(addDays(new Date(d), 1), "yyyy-MM-dd"))}>
            Next →
          </Button>
        </div>
      </div>

      {loading || !resources ? (
        <Skeleton className="h-64 w-full" />
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
          <p className="font-medium text-brand-dark">No resources found</p>
          <p className="text-sm text-muted-foreground">There are no bookable spaces configured yet.</p>
        </div>
      ) : resources[0]?.is_holiday ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 py-10 text-center">
          <p className="font-medium text-amber-800">Closed — Holiday</p>
          <p className="text-sm text-amber-700">The venue is closed on this date. Remove it under Settings → Holidays to reopen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <div key={resource.space_id} className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-brand-dark">
                  {resource.space_name} ({resource.total_inventory})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(resource.slots).map(([slot, info]) => (
                  <div
                    key={slot}
                    className={cn(
                      "min-w-[130px] rounded-md border p-2 text-xs",
                      info.available > 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                    )}
                  >
                    <p className="font-medium text-brand-dark">{SLOT_LABELS[slot] ?? slot}</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {info.available > 0 ? `${info.available} available` : "Booked"}
                    </p>
                    {info.booking ? (
                      <div className="mt-1 flex items-center gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {info.booking.customer}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{info.booking.status}</span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </CardContent>
    </Card>
  );
}

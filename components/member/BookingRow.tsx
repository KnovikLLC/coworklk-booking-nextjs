import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatLKR } from "@/lib/utils";
import { BOOKING_SLOT_LABEL, BOOKING_STATUS_VARIANT, bookingStatusLabel } from "@/lib/bookings/status";
import type { BookingSummaryDTO } from "@/lib/types/domain";
import type { ReactNode } from "react";

export function BookingRow({
  booking,
  action,
}: {
  booking: BookingSummaryDTO;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-brand-dark/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-brand-dark">{booking.space_name}</p>
          <p className="truncate text-xs text-brand-dark/50">
            #{booking.booking_number} · {format(parseISO(booking.booking_date), "MMM d, yyyy")} ·{" "}
            {BOOKING_SLOT_LABEL[booking.time_slot] ?? booking.time_slot.replace(/_/g, " ")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
        <div className="text-right">
          <p className="font-semibold text-brand-dark">{formatLKR(booking.total_amount)}</p>
          <Badge variant={BOOKING_STATUS_VARIANT[booking.status] ?? "outline"} className="mt-0.5 capitalize">
            {bookingStatusLabel(booking.status)}
          </Badge>
        </div>
        {action}
      </div>
    </div>
  );
}

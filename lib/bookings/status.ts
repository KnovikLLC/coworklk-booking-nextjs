export const BOOKING_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  confirmed: "default",
  checked_in: "default",
  completed: "default",
  pending_payment: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
  expired: "outline",
};

export function bookingStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export const BOOKING_SLOT_LABEL: Record<string, string> = {
  morning: "Morning (8am-12pm)",
  afternoon: "Afternoon (12pm-4pm)",
  evening: "Evening (4pm-8pm)",
  night: "Night (8pm-12am)",
  full_day: "Full Day (8am-5pm)",
  unlimited: "Unlimited (8am-8pm)",
};

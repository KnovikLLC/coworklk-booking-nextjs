export interface RefundCalculation {
  refund_amount: number;
  refund_percentage: number;
  reason: string;
}

export interface BookingForRefund {
  total_amount: number;
  booking_date: string;
  start_time?: string | null;
}

// Doc: docs/cowork-booking-architecture.md §7.3 calculateRefund
export function calculateRefund(
  booking: BookingForRefund,
  cancellationTime: Date
): RefundCalculation {
  const bookingDate = new Date(booking.booking_date);

  // If there is a slot start_time, combine it with the booking date for an exact comparison
  if (booking.start_time) {
    const [hours, minutes] = booking.start_time.split(":");
    bookingDate.setHours(Number(hours), Number(minutes), 0, 0);
  } else {
    // Otherwise default to the start of that day
    bookingDate.setHours(0, 0, 0, 0);
  }

  const hoursUntilBooking = (bookingDate.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60);

  if (hoursUntilBooking >= 24) {
    return {
      refund_amount: Number(booking.total_amount) * 0.8,
      refund_percentage: 80,
      reason: "Cancelled more than 24 hours in advance",
    };
  } else if (hoursUntilBooking >= 4) {
    return {
      refund_amount: Number(booking.total_amount) * 0.5,
      refund_percentage: 50,
      reason: "Cancelled 4-24 hours before booking",
    };
  } else {
    return {
      refund_amount: 0,
      refund_percentage: 0,
      reason: "Cancelled less than 4 hours before booking",
    };
  }
}

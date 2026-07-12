"use client";

import { format, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { AvailabilityDay } from "@/lib/types/domain";

export function AvailabilityCalendar({
  days,
  selectedDate,
  onSelectDate,
}: {
  days: AvailabilityDay[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {days.map((day) => {
        const date = parseISO(day.date);
        const isSelected = isSameDay(date, selectedDate);
        const hasAvailability = Object.values(day.slots).some((s) => s.available);

        return (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelectDate(date)}
            className={cn(
              "flex min-w-[64px] flex-col items-center rounded-lg border px-3 py-2 text-sm transition-colors",
              isSelected
                ? "border-brand bg-brand text-white"
                : "border-border bg-white hover:border-brand"
            )}
          >
            <span className="text-xs uppercase opacity-70">{format(date, "EEE")}</span>
            <span className="text-lg font-semibold">{format(date, "d")}</span>
            <span
              className={cn(
                "mt-1 h-1.5 w-1.5 rounded-full",
                hasAvailability ? "bg-emerald-500" : "bg-destructive",
                isSelected && "bg-white"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

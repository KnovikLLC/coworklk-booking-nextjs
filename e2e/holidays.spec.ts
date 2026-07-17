import { test, expect } from "@playwright/test";
import { format, addDays } from "date-fns";
import { insertRow, deleteRows } from "./helpers/supabase-rest";

const SPACE_ID = "7036d73f-60a3-4711-b7db-44e1c67e3309"; // 5-Seater Meeting Room

// Mirrors the manual browser verification done when the holidays feature was
// built: seed a holiday directly (service-role REST write — see
// e2e/helpers/supabase-rest.ts for why this bypasses the JS SDK) rather than
// going through the admin UI/login, since no staff test account exists in
// this environment. Always cleans up in a finally block so a failed
// assertion never leaves a stray holiday blocking real bookings.
test("a holiday date renders as closed and blocks every slot", async ({ page }) => {
  const holidayDate = format(addDays(new Date(), 2), "yyyy-MM-dd");

  await insertRow("holidays", { date: holidayDate, reason: "Playwright E2E test holiday" });

  try {
    await page.goto(`/booking/${SPACE_ID}`);
    await expect(page.getByText("Select a date")).toBeVisible();

    const holidayDay = page.getByText(String(new Date(`${holidayDate}T00:00:00`).getDate()), { exact: true });
    await holidayDay.click();

    await expect(page.getByText("CLOSED").first()).toBeVisible();

    const slotCards = page.locator("text=Fully booked");
    await expect(slotCards.first()).toBeVisible();
  } finally {
    await deleteRows("holidays", `date=eq.${holidayDate}`);
  }
});

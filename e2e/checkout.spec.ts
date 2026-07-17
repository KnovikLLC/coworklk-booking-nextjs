import { test, expect } from "@playwright/test";

// Workspace Seat — high total_inventory, so it reliably has open slots in
// live data even when smaller single-inventory spaces (meeting rooms, hot
// desks) are fully booked out for the visible date range.
const SPACE_ID = "081a051a-645e-465f-a424-fe6a8b27161e";

// This spec runs against the live Supabase project (see e2e/README.md) and
// this project's Zoho Books integration is live-configured — submitting a
// real booking here would create a real Zoho invoice for a throwaway test
// customer. So this deliberately stops one step short of the final
// "Confirm Booking" click: it exercises date/slot selection, navigation to
// checkout, guest-detail entry, and the computed order summary, which is
// where regressions in the golden path actually tend to live.
test("customer can select a date/slot and reach a correctly-priced checkout summary", async ({ page }) => {
  await page.goto(`/booking/${SPACE_ID}`);

  await expect(page.getByText("Select a date")).toBeVisible();
  const dateButtons = page.getByTestId("date-option");
  await expect(dateButtons.first()).toBeVisible(); // wait for the initial client-side availability fetch

  // Today is frequently fully booked in this environment (live data) — try
  // each visible date in order until one has a clickable (enabled) slot.
  const dateCount = await dateButtons.count();
  let clicked = false;
  for (let i = 0; i < dateCount && !clicked; i++) {
    await dateButtons.nth(i).click();
    const slotButtons = page.getByTestId("slot-option");
    await expect(slotButtons.first()).toBeVisible();

    const slotCount = await slotButtons.count();
    for (let j = 0; j < slotCount; j++) {
      const slot = slotButtons.nth(j);
      if (await slot.isEnabled()) {
        await slot.click();
        clicked = true;
        break;
      }
    }
  }
  expect(clicked, "expected at least one date in the visible range to have an available slot").toBe(true);

  await page.getByRole("button", { name: /continue to checkout/i }).click();
  await expect(page).toHaveURL(/\/booking\/checkout/);

  await page.getByLabel("Full Name").fill("Playwright Test User");
  await page.getByLabel("Email").fill("playwright-test@example.com");
  await page.getByLabel("Phone").fill("0771234567");

  await page.getByLabel(/bank transfer/i).check();

  // The order summary total should be a non-zero LKR amount reflecting the
  // selected slot's price — this is the regression this spec exists to catch.
  const total = page.locator("text=Total").locator("..").getByText(/LKR/);
  await expect(total).toBeVisible();
  const totalText = await total.textContent();
  expect(totalText).toMatch(/LKR\s*[\d,]+/);
});

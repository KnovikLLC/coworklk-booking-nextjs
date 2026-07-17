import { test, expect } from "@playwright/test";
import { deleteRows } from "./helpers/supabase-rest";

// Requires a seeded staff test account (role = 'admin' or 'frontdesk') —
// this is a one-time manual setup step (see e2e/README.md), not something
// this suite creates/destroys per run. Skips cleanly when the credentials
// aren't configured, rather than failing CI for every environment that
// hasn't done that setup.
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set — see e2e/README.md");

const SPACE_A = "081a051a-645e-465f-a424-fe6a8b27161e"; // Workspace Seat
const SPACE_B = "73cc8145-820d-4445-921e-ae7048aecb65"; // 4-Seater Meeting Room

test("admin can add two items across two dates to one order and create both bookings", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL!);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/);

  await page.goto("/admin/bookings/new");

  // Item 1: today, Space A.
  await page.getByRole("combobox").first().selectOption(SPACE_A);
  await page.locator("button", { hasText: /LKR/ }).first().click();
  await page.getByRole("button", { name: /add to order/i }).click();

  // Item 2: a different date, Space B.
  await page.getByRole("combobox").first().selectOption(SPACE_B);
  const dateInput = page.locator('input[type="date"]');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await dateInput.fill(tomorrow.toISOString().split("T")[0]);
  await page.locator("button", { hasText: /LKR/ }).first().click();
  await page.getByRole("button", { name: /add to order/i }).click();

  await expect(page.getByText("Order Summary")).toBeVisible();

  await page.getByLabel("Name").fill("Playwright Batch Test");
  await page.getByLabel("Email").fill("playwright-batch-test@example.com");
  await page.getByLabel("Phone").fill("0771234567");

  await page.getByRole("button", { name: /create booking/i }).click();
  await expect(page).toHaveURL(/\/admin\/bookings$/);

  // Cleanup: remove whatever this test just created for this throwaway guest.
  await deleteRows("bookings", `guest_email=eq.playwright-batch-test@example.com`);
});

import { test, expect } from "~/tests/playwright";

test("counter test", async ({ page }) => {
  await page.goto("/counter");
  await page.getByRole("button").click();
  await expect(page).toHaveURL(`/counter`);
  await expect(page.getByRole("button", { name: /Count/i })).toHaveText(
    "Count: 1",
  );
});

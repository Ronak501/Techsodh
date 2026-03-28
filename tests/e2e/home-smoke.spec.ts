import { test, expect } from "@playwright/test"

test.skip(
  process.env.RUN_E2E !== "true",
  "Set RUN_E2E=true to run browser smoke tests"
)

test("homepage smoke check", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("ResearchAgent")).toBeVisible()
})

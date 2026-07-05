import { expect, test } from "@playwright/test";

test("AI book selector opens and preserves 100-book import limit", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.route("**/api/search-**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sourceStatus: "empty", items: [] }),
    });
  });
  await page.route("**/api/screen-books", async (route) => {
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        source: "deepseek",
        error: { code: "TEST_DEEPSEEK_UNAVAILABLE", message: "DeepSeek 暂时不可用，可使用备用演示数据" },
      }),
    });
  });

  await page.goto("/#generate");
  await expect(page.getByRole("heading", { name: "导入本月候选书单" })).toBeVisible();

  const books = Array.from({ length: 105 }, (_, index) => `测试书${index + 1}`).join("\n");
  await page.locator("#book-input").fill(books);
  await page.getByRole("button", { name: "补全并交给 DeepSeek 初筛" }).click();

  await expect(page.getByText("本轮已导入 100 / 100 本候选书")).toBeVisible();
  await expect(page.getByText("当前版本最多支持 100 本进入本轮初筛，已保留前 100 本。")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

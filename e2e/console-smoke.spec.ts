import { expect, test } from "@playwright/test";

/**
 * 真浏览器冒烟：控制台壳 + 创建表单 + 列表（经 BFF）。
 * 深度 API 路径仍由 scripts/e2e-bff.sh 覆盖。
 */
test.describe("console smoke", () => {
  test("列表页渲染且 backend 徽章诚实", async ({ page }) => {
    await page.goto("/console/sandboxes");
    await expect(page.getByRole("heading", { name: /沙箱/ })).toBeVisible({
      timeout: 30_000,
    });
    // healthz.backend=fake → 「fake · BFF → sandbox」；不可达则「sandbox 不可达」
    const badge = page.getByText(/BFF/).first();
    await expect(badge).toBeVisible();
    const badgeText = (await badge.innerText()).trim();
    expect(badgeText).toMatch(/BFF/);
    expect(badgeText).not.toMatch(/真集群|CubeSandbox|已连接真|腾讯/);
    await expect(
      page.getByRole("link", { name: /创建沙箱/ }).first(),
    ).toBeVisible();
  });

  test("创建页可提交并进入详情（再销毁）", async ({ page, request }) => {
    const name = `pw-${Date.now().toString(36).slice(-6)}`;
    await page.goto("/console/sandboxes/new");
    await expect(page.getByRole("heading", { name: "创建沙箱" })).toBeVisible({
      timeout: 30_000,
    });
    await page.locator("#name").fill(name);

    // 等模板列表（名称来自 API，中英文皆可）
    await expect
      .poll(
        async () =>
          (await page.locator("form button[type='button']").count()) +
          (await page.locator("form .font-medium").count()),
        { timeout: 20_000 },
      )
      .toBeGreaterThan(0);

    await page.getByRole("button", { name: "创建沙箱" }).click();
    // 排除 /new 本身；详情 id 通常 sbx_… 或更长
    await page.waitForURL(
      (url) =>
        /\/console\/sandboxes\/[^/]+$/.test(url.pathname) &&
        !url.pathname.endsWith("/new"),
      { timeout: 45_000 },
    );
    const id = page.url().split("/").pop()!;
    expect(id).not.toBe("new");
    expect(id.length).toBeGreaterThan(3);
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });

    // 销毁走 BFF（避免 confirm 对话框）
    const res = await request.delete(`/api/sandboxes/${id}`);
    expect([200, 204].includes(res.status()) || res.ok()).toBeTruthy();
  });
});

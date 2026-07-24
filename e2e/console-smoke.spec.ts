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

  test("列表可按 projectId 筛选", async ({ page, request }) => {
    const pid = `pw-proj-${Date.now().toString(36).slice(-5)}`;
    const name = `pw-f-${Date.now().toString(36).slice(-5)}`;
    const create = await request.post("/api/sandboxes", {
      data: {
        name,
        template: "base",
        timeoutMs: 120_000,
        projectId: pid,
      },
    });
    expect(create.ok()).toBeTruthy();
    const body = (await create.json()) as { sandbox?: { id?: string } };
    const id = body.sandbox?.id;
    expect(id).toBeTruthy();

    try {
      await page.goto("/console/sandboxes");
      await expect(page.getByRole("heading", { name: /沙箱/ })).toBeVisible({
        timeout: 30_000,
      });
      const projectInput = page.getByLabel("按项目 ID 筛选");
      await projectInput.fill(pid);
      await page.getByRole("button", { name: "筛选项目" }).click();
      await expect(page.getByText(`· 项目 ${pid}`)).toBeVisible({
        timeout: 15_000,
      });
      // 列表应出现该实例名或 id
      await expect(
        page.getByText(name).or(page.getByText(id!)).first(),
      ).toBeVisible({ timeout: 15_000 });

      // 切到「已销毁」应看不到存活实例
      await page.getByRole("combobox").first().click();
      await page.getByRole("option", { name: "已销毁" }).click();
      await expect
        .poll(async () => page.getByText(name).count(), { timeout: 15_000 })
        .toBe(0);
    } finally {
      await request.delete(`/api/sandboxes/${id}`);
    }
  });

  test("密钥 / 模板 / 用量页可渲染", async ({ page }) => {
    for (const [path, heading] of [
      ["/console/keys", /密钥|API/],
      ["/console/templates", /模板/],
      ["/console/usage", /用量/],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible({
        timeout: 30_000,
      });
    }
  });

  test("官网与定价页无数据面品牌泄露", async ({ page }) => {
    for (const path of ["/", "/pricing", "/docs", "/products/sandbox"] as const) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible({ timeout: 30_000 });
      const text = await page.locator("body").innerText();
      expect(text).not.toMatch(/CubeSandbox|腾讯 Cube|腾讯云|已连接真集群/);
      expect(text).toMatch(/灵境云/);
    }
  });
});

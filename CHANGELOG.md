# Changelog

本文件遵循 Keep a Changelog；版本约定见 [f2b-meta RELEASE.md](https://github.com/f2b-dev/f2b-meta/blob/main/RELEASE.md)。

## [Unreleased]

### Added

- GHA `e2e-bff` job：起 fake sandbox + tunnel + web，跑全路径 `e2e:bff`
- `e2e:bff` 覆盖模板/用量/密钥/隧道全路径（create→list→revoke/close）
- 插件 `sandboxBffRoutes` + `pnpm check:bff-map`；README 补「新增 BFF 路由」步骤
- `e2e:bff` 覆盖 cwd / command timeoutMs / 文件 mkdir+rename / PATCH timeoutMs

### Changed

- 控制台顶栏徽章按 `/healthz` 的 `backend` 动态展示（如 `fake · BFF → sandbox`）
- 营销 `/docs` 页：端口 13200/13287、SDK 示例与诚实数据面说明；去掉过时 mock / 内核宣传

## [0.1.0] - 2026-07

- 官网 + 控制台 + 同源 BFF（沙箱 / 密钥 / 用量 / 模板 / 隧道）

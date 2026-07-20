#!/usr/bin/env bash
# 控制台硬约束：无 antd、无 Cube 管理密钥进浏览器侧、无禁用宣传文案
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
fail=0

# 优先 rg，否则 grep -R
if command -v rg >/dev/null 2>&1; then
  search() { rg -n --glob '!**/.next/**' --glob '!**/node_modules/**' --glob '!**/dist/**' "$@"; }
else
  search() {
    local pattern="$1"; shift
    grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist \
      --exclude-dir=.git -E "$pattern" "$@" 2>/dev/null || true
  }
fi

check_absent() {
  local label="$1"
  local pattern="$2"
  shift 2
  local hits
  hits=$(search "$pattern" "$@" || true)
  # grep returns empty; rg may exit 1
  hits=$(echo "$hits" | sed '/^$/d' || true)
  if [[ -n "$hits" ]]; then
    echo "FAIL: $label"
    echo "$hits"
    fail=1
  else
    echo "OK: $label"
  fi
}

check_absent "no antd imports" 'from ["'\'']antd|@ant-design/' apps packages plugins 2>/dev/null || \
  check_absent "no antd imports" 'antd|@ant-design' apps packages plugins

# 浏览器侧路径禁止 CUBE_API_TOKEN
check_absent "no CUBE_API_TOKEN in client lib" 'CUBE_API_TOKEN' \
  apps/web/src/lib apps/web/src/components apps/web/src/app/console \
  packages/ui packages/console-shell

# 用户可见宣传禁用 CubeSandbox / 基于腾讯
check_absent "no Cube/Tencent in user-facing copy" 'CubeSandbox|基于腾讯' \
  apps/web/src packages/console-shell packages/ui plugins

if [[ "$fail" -ne 0 ]]; then
  echo "CI_GUARDS_FAIL"
  exit 1
fi
echo "CI_GUARDS_OK"

#!/usr/bin/env bash
# 浏览器同源路径 E2E：列表 → 创建 → 命令 → 销毁（经 BFF /api/sandboxes）
set -euo pipefail
BASE="${F2B_WEB_URL:-http://127.0.0.1:3000}"
NAME="e2e-$(date +%s | tail -c 6)"

echo "== pages =="
for p in /console/sandboxes /console/sandboxes/new; do
  code=$(curl -sf -o /dev/null -w "%{http_code}" "$BASE$p")
  [[ "$code" == "200" ]] || { echo "page $p → $code"; exit 1; }
  echo "  $p 200"
done

echo "== list =="
curl -sf "$BASE/api/sandboxes" >/dev/null

echo "== create =="
CREATE=$(curl -sf -X POST "$BASE/api/sandboxes" \
  -H 'content-type: application/json' \
  -d "{\"name\":\"$NAME\",\"template\":\"base\"}")
ID=$(node -e "const j=JSON.parse(process.argv[1]); if(!j.sandbox?.id) process.exit(2); console.log(j.sandbox.id)" "$CREATE")
echo "  id=$ID"

echo "== command =="
CMD=$(curl -sf -X POST "$BASE/api/sandboxes/$ID/commands" \
  -H 'content-type: application/json' \
  -d '{"cmd":"echo e2e-ok"}')
node -e "const j=JSON.parse(process.argv[1]); if(j.result?.exitCode!==0||!String(j.result?.stdout).includes('e2e-ok')) process.exit(3)" "$CMD"
echo "  cmd ok"

echo "== detail page =="
code=$(curl -sf -o /dev/null -w "%{http_code}" "$BASE/console/sandboxes/$ID")
[[ "$code" == "200" ]] || { echo "detail $code"; exit 1; }

echo "== kill =="
KILL=$(curl -sf -X DELETE "$BASE/api/sandboxes/$ID")
node -e "const j=JSON.parse(process.argv[1]); if(j.sandbox?.status!=='killed') process.exit(4)" "$KILL"
echo "  killed"

echo "E2E_BFF_OK"

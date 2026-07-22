#!/usr/bin/env bash
# 浏览器同源路径 E2E：列表 → 创建 → 命令/SSE/cwd/timeout → 文件 mkdir/rename → 销毁
set -euo pipefail
BASE="${F2B_WEB_URL:-http://127.0.0.1:13200}"
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
  -d "{\"name\":\"$NAME\",\"template\":\"base\",\"timeoutMs\":120000}")
ID=$(node -e "const j=JSON.parse(process.argv[1]); if(!j.sandbox?.id) process.exit(2); console.log(j.sandbox.id)" "$CREATE")
echo "  id=$ID"

echo "== command =="
CMD=$(curl -sf -X POST "$BASE/api/sandboxes/$ID/commands" \
  -H 'content-type: application/json' \
  -d '{"cmd":"echo e2e-ok"}')
node -e "const j=JSON.parse(process.argv[1]); if(j.result?.exitCode!==0||!String(j.result?.stdout).includes('e2e-ok')) process.exit(3)" "$CMD"
echo "  cmd ok"

echo "== command cwd =="
CWD=$(curl -sf -X POST "$BASE/api/sandboxes/$ID/commands" \
  -H 'content-type: application/json' \
  -d '{"cmd":"pwd","cwd":"/tmp"}')
node -e "const j=JSON.parse(process.argv[1]); const o=String(j.result?.stdout||''); if(j.result?.exitCode!==0||!o.includes('/tmp')) process.exit(7); console.log('  cwd ok')" "$CWD"

echo "== command timeoutMs =="
# sleep 超过窗口 → 非 0（fake 多为 124）
TMO=$(curl -sf -X POST "$BASE/api/sandboxes/$ID/commands" \
  -H 'content-type: application/json' \
  -d '{"cmd":"sleep 2","timeoutMs":200}')
node -e "const j=JSON.parse(process.argv[1]); if(j.result?.exitCode===0) process.exit(8); console.log('  timeoutMs ok exit='+j.result?.exitCode)" "$TMO"

echo "== command stream (SSE) =="
STREAM=$(curl -sf -N -X POST "$BASE/api/sandboxes/$ID/commands/stream" \
  -H 'content-type: application/json' \
  -H 'accept: text/event-stream' \
  -d '{"cmd":"echo e2e-stream-ok"}')
echo "$STREAM" | node -e '
  const t = require("fs").readFileSync(0,"utf8");
  if (!t.includes("e2e-stream-ok")) process.exit(5);
  if (!t.includes("\"type\":\"result\"") && !t.includes("\"type\": \"result\"")) process.exit(6);
  console.log("  stream ok");
'

echo "== files mkdir + write + rename =="
curl -sf -X POST "$BASE/api/sandboxes/$ID/files/mkdir" \
  -H 'content-type: application/json' \
  -d '{"path":"/tmp/e2e-dir"}' >/dev/null
curl -sf -X POST "$BASE/api/sandboxes/$ID/files" \
  -H 'content-type: application/json' \
  -d '{"path":"/tmp/e2e-dir/a.txt","content":"e2e-file","encoding":"utf8"}' >/dev/null
curl -sf -X POST "$BASE/api/sandboxes/$ID/files/rename" \
  -H 'content-type: application/json' \
  -d '{"from":"/tmp/e2e-dir/a.txt","to":"/tmp/e2e-dir/b.txt"}' >/dev/null
READ=$(curl -sf "$BASE/api/sandboxes/$ID/files?path=/tmp/e2e-dir/b.txt")
node -e "const j=JSON.parse(process.argv[1]); const c=j.file?.content??j.content??''; if(!String(c).includes('e2e-file')) process.exit(9); console.log('  mkdir/rename ok')" "$READ"

echo "== patch timeout (keepalive surface) =="
PATCH=$(curl -sf -X PATCH "$BASE/api/sandboxes/$ID" \
  -H 'content-type: application/json' \
  -d '{"timeoutMs":180000}')
node -e "const j=JSON.parse(process.argv[1]); const t=j.sandbox?.timeoutMs; if(t!==180000) process.exit(10); console.log('  patch timeoutMs ok')" "$PATCH"

echo "== detail page =="
code=$(curl -sf -o /dev/null -w "%{http_code}" "$BASE/console/sandboxes/$ID")
[[ "$code" == "200" ]] || { echo "detail $code"; exit 1; }
HTML=$(curl -sf "$BASE/console/sandboxes/$ID")
echo "$HTML" | node -e '
  const t = require("fs").readFileSync(0,"utf8");
  if (t.length < 200) process.exit(11);
  console.log("  detail html ok len="+t.length);
'

echo "== kill =="
KILL=$(curl -sf -X DELETE "$BASE/api/sandboxes/$ID")
node -e "const j=JSON.parse(process.argv[1]); if(j.sandbox?.status!=='killed') process.exit(4)" "$KILL"
echo "  killed"

echo "E2E_BFF_OK"

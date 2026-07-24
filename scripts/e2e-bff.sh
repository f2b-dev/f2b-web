#!/usr/bin/env bash
# 浏览器同源路径 E2E：沙箱全路径 + 模板/用量/密钥/隧道 → 销毁
set -euo pipefail
BASE="${F2B_WEB_URL:-http://127.0.0.1:13200}"
NAME="e2e-$(date +%s | tail -c 6)"

echo "== pages =="
for p in \
  / \
  /pricing \
  /docs \
  /products/sandbox \
  /console \
  /console/sandboxes \
  /console/sandboxes/new \
  /console/keys \
  /console/templates \
  /console/usage
do
  code=$(curl -sf -o /dev/null -w "%{http_code}" "$BASE$p")
  [[ "$code" == "200" ]] || { echo "page $p → $code"; exit 1; }
  echo "  $p 200"
done

echo "== list =="
curl -sf "$BASE/api/sandboxes" >/dev/null

PROJ="e2e-proj-$(date +%s | tail -c 5)"
echo "== create (projectId=$PROJ) =="
CREATE=$(curl -sf -X POST "$BASE/api/sandboxes" \
  -H 'content-type: application/json' \
  -d "{\"name\":\"$NAME\",\"template\":\"base\",\"timeoutMs\":120000,\"projectId\":\"$PROJ\"}")
ID=$(node -e "const j=JSON.parse(process.argv[1]); if(!j.sandbox?.id) process.exit(2); console.log(j.sandbox.id)" "$CREATE")
echo "  id=$ID"

echo "== list filter projectId + status =="
LIST_P=$(curl -sf "$BASE/api/sandboxes?projectId=$PROJ")
node -e '
  const j=JSON.parse(process.argv[1]);
  const id=process.argv[2];
  const arr=j.sandboxes||[];
  if(!arr.some(s=>s.id===id)) { console.error(JSON.stringify(j)); process.exit(22); }
  if(arr.some(s=>s.projectId && s.projectId!==process.argv[3])) process.exit(23);
  console.log("  projectId filter ok n="+arr.length);
' "$LIST_P" "$ID" "$PROJ"
LIST_S=$(curl -sf "$BASE/api/sandboxes?status=running")
node -e '
  const j=JSON.parse(process.argv[1]);
  const id=process.argv[2];
  const arr=j.sandboxes||[];
  if(!arr.some(s=>s.id===id)) process.exit(24);
  if(arr.some(s=>s.status!=="running")) process.exit(25);
  console.log("  status=running filter ok n="+arr.length);
' "$LIST_S" "$ID"
LIST_K=$(curl -sf "$BASE/api/sandboxes?status=killed")
node -e '
  const j=JSON.parse(process.argv[1]);
  const id=process.argv[2];
  const arr=j.sandboxes||[];
  if(arr.some(s=>s.id===id)) process.exit(26);
  if(arr.some(s=>s.status!=="killed")) process.exit(27);
  console.log("  status=killed excludes live id ok");
' "$LIST_K" "$ID"

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


echo "== files base64 + delete =="
# "hi" base64 = aGk=
curl -sf -X POST "$BASE/api/sandboxes/$ID/files" \
  -H 'content-type: application/json' \
  -d '{"path":"/tmp/e2e-bin.dat","content":"aGk=","encoding":"base64"}' >/dev/null
B64=$(curl -sf "$BASE/api/sandboxes/$ID/files?path=/tmp/e2e-bin.dat&encoding=base64")
node -e '
  const j=JSON.parse(process.argv[1]);
  const c=String(j.file?.content??j.content??"");
  const enc=String(j.file?.encoding??j.encoding??"");
  let ok=false;
  if (c==="hi" || c==="aGk=" || c.includes("aGk")) ok=true;
  try { if (Buffer.from(c,"base64").toString()==="hi") ok=true; } catch {}
  if (!ok) { console.error(JSON.stringify(j)); process.exit(18); }
  console.log("  base64 ok enc="+enc+" content="+c.slice(0,24));
' "$B64"
# delete: try DELETE with query path
code=$(curl -s -o /tmp/e2e-del.json -w "%{http_code}" -X DELETE "$BASE/api/sandboxes/$ID/files?path=/tmp/e2e-bin.dat")
if [[ "$code" != "200" && "$code" != "204" ]]; then
  # fallback POST body delete if route supports
  code=$(curl -s -o /tmp/e2e-del.json -w "%{http_code}" -X DELETE "$BASE/api/sandboxes/$ID/files" \
    -H 'content-type: application/json' -d '{"path":"/tmp/e2e-bin.dat"}')
fi
[[ "$code" == "200" || "$code" == "204" ]] || { echo "delete files → $code $(cat /tmp/e2e-del.json 2>/dev/null)"; exit 19; }
echo "  delete ok"

echo "== pause + resume =="
PAUSE=$(curl -sf -X POST "$BASE/api/sandboxes/$ID/pause")
node -e "const j=JSON.parse(process.argv[1]); if(j.sandbox?.status!=='paused') process.exit(20); console.log('  paused')" "$PAUSE"
RES=$(curl -sf -X POST "$BASE/api/sandboxes/$ID/resume")
node -e "const j=JSON.parse(process.argv[1]); if(j.sandbox?.status!=='running') process.exit(21); console.log('  resumed')" "$RES"

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

echo "== templates =="
TEMPL=$(curl -sf "$BASE/api/templates")
node -e "const j=JSON.parse(process.argv[1]); if(!Array.isArray(j.templates)||!j.templates.some(x=>x.id==='base')) process.exit(12); console.log('  templates ok n='+j.templates.length)" "$TEMPL"

echo "== usage =="
USAGE=$(curl -sf "$BASE/api/usage")
node -e "const j=JSON.parse(process.argv[1]); if(!j.usage||typeof j.usage.totalCommands!=='number') process.exit(13); console.log('  usage ok commands='+j.usage.totalCommands)" "$USAGE"

echo "== keys create+list+revoke =="
KEY_NAME="e2e-key-$(date +%s | tail -c 5)"
KCREATE=$(curl -sf -X POST "$BASE/api/keys" -H 'content-type: application/json' -d "{\"name\":\"$KEY_NAME\"}")
KID=$(node -e "const j=JSON.parse(process.argv[1]); if(!j.key?.id||!j.secret||!String(j.secret).startsWith('sk_')) process.exit(14); console.log(j.key.id)" "$KCREATE")
echo "  key id=$KID"
KLIST=$(curl -sf "$BASE/api/keys")
node -e "const j=JSON.parse(process.argv[1]); if(!j.keys?.some(k=>k.id===process.argv[2])) process.exit(15); console.log('  keys list ok')" "$KLIST" "$KID"
curl -sf -X DELETE "$BASE/api/keys/$KID" >/dev/null
echo "  key revoked"

echo "== tunnels create+list+close =="
TCREATE=$(curl -sf -X POST "$BASE/api/tunnels" -H 'content-type: application/json' \
  -d "{\"sandboxId\":\"$ID\",\"port\":3999,\"targetUrl\":\"http://127.0.0.1:3999\"}")
TID=$(node -e "const j=JSON.parse(process.argv[1]); if(!j.tunnel?.id||!j.tunnel?.publicUrl) process.exit(16); console.log(j.tunnel.id)" "$TCREATE")
echo "  tunnel id=$TID"
TLIST=$(curl -sf "$BASE/api/tunnels")
node -e "const j=JSON.parse(process.argv[1]); if(!j.tunnels?.some(t=>t.id===process.argv[2])) process.exit(17); console.log('  tunnels list ok')" "$TLIST" "$TID"
curl -sf -X DELETE "$BASE/api/tunnels/$TID" >/dev/null
echo "  tunnel closed"

echo "== kill =="
KILL=$(curl -sf -X DELETE "$BASE/api/sandboxes/$ID")
node -e "const j=JSON.parse(process.argv[1]); if(j.sandbox?.status!=='killed') process.exit(4)" "$KILL"
echo "  killed"

echo "E2E_BFF_OK"

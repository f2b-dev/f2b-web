#!/usr/bin/env bash
# 校验 plugins/sandbox bff-map 中的 BFF 路径在 apps/web 有对应 route.ts
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="$ROOT/apps/web/src/app/api"
fail=0

map_file="$ROOT/plugins/sandbox/src/bff-map.ts"
[[ -f "$map_file" ]] || { echo "missing $map_file"; exit 1; }

while IFS= read -r path; do
  rel="${path#/api/}"
  route_file="$API/$rel/route.ts"
  if [[ -f "$route_file" ]]; then
    echo "OK  $path"
  else
    echo "MISS $path → $route_file"
    fail=1
  fi
done < <(node -e '
  const fs = require("fs");
  const t = fs.readFileSync(process.argv[1], "utf8");
  const re = /bff:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(t))) console.log(m[1]);
' "$map_file")

echo "== reverse (api routes not in map) =="
while IFS= read -r f; do
  rel="${f#"$API"/}"
  rel="${rel%/route.ts}"
  path="/api/$rel"
  if [[ "$path" == "/api/health" ]]; then
    echo "SKIP $path (meta)"
    continue
  fi
  # -F：路径含 [id] 时禁止当正则字符类
  if grep -Fq "bff: \"$path\"" "$map_file"; then
    echo "OK  $path"
  else
    echo "UNMAPPED $path"
    fail=1
  fi
done < <(find "$API" -name route.ts | sort)

if [[ "$fail" -ne 0 ]]; then
  echo "BFF_MAP_FAIL"
  exit 1
fi
echo "BFF_MAP_OK"

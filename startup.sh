#!/bin/sh
set -eu
# 平台固定從 /workspace/startup.sh 執行；以腳本所在目錄為準，離開沙箱也能用。
cd "$(dirname "$0")"
node scripts/preview.mjs stop || true
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
